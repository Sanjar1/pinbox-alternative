import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');

const DEFAULT_POSTERS_DIR = path.join(repoRoot, 'posters', 'A5-PRINT-READY-2026-05-17');
const DEFAULT_BASE_URL = 'https://web-production-370c1.up.railway.app';
const PLACEHOLDER = 'VOTING_URL_PLACEHOLDER';

function parseArgs(argv) {
  const args = new Set(argv);
  const get = (name, fallback) => {
    const index = argv.indexOf(name);
    if (index === -1) return fallback;
    return argv[index + 1] ?? fallback;
  };
  return {
    applyDb: args.has('--apply-db'),
    clearFeedback: args.has('--clear-feedback'),
    syncPosters: args.has('--sync-posters'),
    baseUrl: get('--base-url', DEFAULT_BASE_URL).replace(/\/$/, ''),
    postersDir: path.resolve(get('--posters-dir', DEFAULT_POSTERS_DIR)),
    reportPath: path.resolve(get('--report', path.join(repoRoot, 'docs', 'a5-poster-store-link-repair.json'))),
  };
}

function normalizeSlug(slug) {
  const value = String(slug ?? '').trim();
  if (!value || value === PLACEHOLDER) return null;
  return value;
}

function deterministicSlug(storeName, used) {
  for (let length = 6; length <= 12; length += 2) {
    const slug = createHash('sha1')
      .update(`pinbox-a5-2026-05-17:${storeName}`)
      .digest('hex')
      .slice(0, length);
    if (!used.has(slug)) return slug;
  }
  throw new Error(`Could not generate a unique deterministic slug for ${storeName}`);
}

function getRouteSlugFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const data = parsed.searchParams.get('data');
    if (data) return getRouteSlugFromUrl(decodeURIComponent(data));
    const segment = parsed.pathname.split('/').filter(Boolean).pop();
    return normalizeSlug(segment);
  } catch {
    return null;
  }
}

function extractPosterSlug(html) {
  const urls = html.match(/https?:\/\/[^"'\s>]+/gi) ?? [];
  for (const url of urls) {
    const slug = getRouteSlugFromUrl(url);
    if (slug) return slug;
  }
  return null;
}

function replacePosterSlug(html, baseUrl, finalSlug) {
  const voteUrl = `${baseUrl}/${finalSlug}`;
  const qrPattern = /(https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?[^"']*?data=)([^&"']+)/gi;
  let next = html.replace(qrPattern, (_match, prefix) => `${prefix}${voteUrl}`);
  next = next.replace(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/[^"'\\s<&]+`, 'g'), voteUrl);
  next = next.replaceAll(PLACEHOLDER, finalSlug);
  return next;
}

async function loadRows(postersDir) {
  const manifestPath = path.join(postersDir, 'manifest.json');
  const manifest = JSON.parse((await fs.readFile(manifestPath, 'utf8')).replace(/^\uFEFF/, ''));
  if (!Array.isArray(manifest)) throw new Error(`Manifest is not an array: ${manifestPath}`);

  const rows = [];
  for (const entry of manifest) {
    const file = entry.file;
    const store = String(entry.store ?? '').trim();
    if (!file || !store) throw new Error(`Manifest row is missing file/store: ${JSON.stringify(entry)}`);

    const fullPath = path.join(postersDir, file);
    const html = await fs.readFile(fullPath, 'utf8');
    rows.push({
      brand: entry.brand ?? null,
      store,
      file,
      path: fullPath,
      manifestSlug: normalizeSlug(entry.slug),
      posterSlug: extractPosterSlug(html),
    });
  }
  return { manifestPath, rows };
}

function planRows(rows) {
  const sourceSlugCounts = new Map();
  for (const row of rows) {
    const sourceSlug = row.manifestSlug ?? row.posterSlug;
    if (!sourceSlug) continue;
    sourceSlugCounts.set(sourceSlug, (sourceSlugCounts.get(sourceSlug) ?? 0) + 1);
  }

  const used = new Set();
  const keeperBySlug = new Map();
  for (const row of rows) {
    const sourceSlug = row.manifestSlug ?? row.posterSlug;
    if (!sourceSlug || sourceSlugCounts.get(sourceSlug) === 1) continue;
    const current = keeperBySlug.get(sourceSlug);
    if (!current || (current.brand === 'glotok' && row.brand !== 'glotok')) {
      keeperBySlug.set(sourceSlug, row);
    }
  }

  const planned = rows.map((row) => {
    const sourceSlug = row.manifestSlug ?? row.posterSlug;
    const duplicate = sourceSlug ? sourceSlugCounts.get(sourceSlug) > 1 : false;
    const keepDuplicateSlug = duplicate && keeperBySlug.get(sourceSlug) === row;
    let finalSlug = sourceSlug && (!duplicate || keepDuplicateSlug) ? sourceSlug : null;

    if (finalSlug) used.add(finalSlug);
    return { ...row, sourceSlug, duplicate, finalSlug, action: finalSlug === sourceSlug ? 'preserve' : 'assign-new-slug' };
  });

  for (const row of planned) {
    if (!row.finalSlug) {
      row.finalSlug = deterministicSlug(row.store, used);
      used.add(row.finalSlug);
    }
  }

  const finalCounts = new Map();
  for (const row of planned) finalCounts.set(row.finalSlug, (finalCounts.get(row.finalSlug) ?? 0) + 1);
  const duplicateFinalSlugs = Array.from(finalCounts.entries()).filter(([, count]) => count > 1);
  if (duplicateFinalSlugs.length) {
    throw new Error(`Planned duplicate final slugs: ${JSON.stringify(duplicateFinalSlugs)}`);
  }

  return planned;
}

async function syncPosterFiles(planned, manifestPath, baseUrl) {
  const manifest = [];
  for (const row of planned) {
    const html = await fs.readFile(row.path, 'utf8');
    await fs.writeFile(row.path, replacePosterSlug(html, baseUrl, row.finalSlug), 'utf8');
    manifest.push({
      brand: row.brand,
      store: row.store,
      slug: row.finalSlug,
      file: row.file,
    });
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function applyDatabase(planned, clearFeedback) {
  const prisma = new PrismaClient();
  try {
    const existingTenant = await prisma.store.findFirst({ select: { tenantId: true } });
    if (!existingTenant) throw new Error('No existing stores found; cannot derive tenantId');
    const { tenantId } = existingTenant;

    const actions = [];
    let deletedFeedbackCount = 0;
    await prisma.$transaction(async (tx) => {
      if (clearFeedback) {
        const deleted = await tx.feedback.deleteMany({});
        deletedFeedbackCount = deleted.count;
      }

      for (const row of planned) {
        const exactStore = await tx.store.findFirst({
          where: { tenantId, name: row.store },
          include: { qrCodes: true },
        });
        const qrBySlug = await tx.qRCode.findUnique({
          where: { slug: row.finalSlug },
          include: { store: true },
        });

        if (qrBySlug) {
          if (qrBySlug.store.tenantId !== tenantId) {
            throw new Error(`Slug ${row.finalSlug} belongs to another tenant`);
          }
          if (exactStore && exactStore.id !== qrBySlug.storeId) {
            throw new Error(`Exact store ${row.store} exists but slug ${row.finalSlug} belongs to ${qrBySlug.store.name}`);
          }

          if (qrBySlug.store.name !== row.store) {
            await tx.store.update({
              where: { id: qrBySlug.storeId },
              data: {
                name: row.store,
                masterProfile: {
                  upsert: {
                    create: { name: row.store, address: qrBySlug.store.address ?? '' },
                    update: { name: row.store },
                  },
                },
              },
            });
            actions.push({ action: 'renamed-store-for-existing-qr', store: row.store, slug: row.finalSlug });
          } else {
            actions.push({ action: 'kept-existing-qr', store: row.store, slug: row.finalSlug });
          }
          continue;
        }

        if (exactStore) {
          await tx.qRCode.create({
            data: { name: 'Default', slug: row.finalSlug, storeId: exactStore.id },
          });
          actions.push({ action: 'created-qr-for-existing-store', store: row.store, slug: row.finalSlug });
          continue;
        }

        await tx.store.create({
          data: {
            name: row.store,
            address: '',
            tenantId,
            qrCodes: { create: { name: 'Default', slug: row.finalSlug } },
            masterProfile: { create: { name: row.store, address: '' } },
          },
        });
        actions.push({ action: 'created-store-and-qr', store: row.store, slug: row.finalSlug });
      }
    });

    return { deletedFeedbackCount, actions };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.clearFeedback && !args.applyDb) {
    throw new Error('--clear-feedback requires --apply-db');
  }

  // Production gate: this script mutates store/QR rows and can delete feedback.
  // Against a non-local DATABASE_URL it must be opted into explicitly
  // (see docs/QR_SLUG_PROTECTION.md — QR slugs of printed posters are frozen).
  if (args.applyDb) {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const isLocal = /localhost|127\.0\.0\.1/.test(dbUrl);
    if (!isLocal && !process.argv.includes('--i-understand-production')) {
      throw new Error(
        'DATABASE_URL is not local. Re-run with --i-understand-production only if you really intend to modify the production database.',
      );
    }
  }

  const { manifestPath, rows } = await loadRows(args.postersDir);
  if (rows.length !== 41) throw new Error(`Expected 41 A5 poster rows, found ${rows.length}`);

  const planned = planRows(rows);
  const report = {
    generatedAt: new Date().toISOString(),
    applyDb: args.applyDb,
    clearFeedback: args.clearFeedback,
    syncPosters: args.syncPosters,
    total: planned.length,
    uniqueFinalSlugs: new Set(planned.map((row) => row.finalSlug)).size,
    changedLinks: planned.filter((row) => row.finalSlug !== row.sourceSlug).length,
    rows: planned.map((row) => ({
      brand: row.brand,
      store: row.store,
      file: row.file,
      sourceSlug: row.sourceSlug,
      finalSlug: row.finalSlug,
      changed: row.finalSlug !== row.sourceSlug,
    })),
  };

  if (args.applyDb) {
    report.database = await applyDatabase(planned, args.clearFeedback);
  }
  if (args.syncPosters) {
    await syncPosterFiles(planned, manifestPath, args.baseUrl);
  }

  await fs.mkdir(path.dirname(args.reportPath), { recursive: true });
  await fs.writeFile(args.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    total: report.total,
    uniqueFinalSlugs: report.uniqueFinalSlugs,
    changedLinks: report.changedLinks,
    reportPath: args.reportPath,
    appliedDb: args.applyDb,
    clearedFeedback: args.applyDb && args.clearFeedback,
    syncedPosters: args.syncPosters,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
