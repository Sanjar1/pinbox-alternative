// Re-issue the printed A5 QR posters for a new base URL, as one print-ready PDF.
//
// Source of truth for designs and slugs: the posters printed on 2026-05-17
// (posters/A5-PRINT-READY-2026-05-17/*.html + manifest.json). Slugs are FROZEN
// (see CLAUDE.md) — this script only swaps the domain in front of each slug.
// QR codes are rendered locally (npm `qrcode`), never by an outside web service.
//
// Usage (from app/):
//   node scripts/generate-a5-pdf-from-printed-posters.mjs \
//     --base https://qr.sirnayalavka.uz \
//     --out ../posters/A5-PRINT-READY-2026-10-15 \
//     --add "Лавка Чирчик Восьмой=c28e90=kaas"
//
// Output: one HTML per poster, posters.json (manifest), and per-poster PDFs that
// merge-posters-pdf.py joins into the single file to print.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(here, '../../posters/A5-PRINT-READY-2026-05-17');
const OLD_BASE = 'https://web-production-370c1.up.railway.app';
const BRAND_ORDER = { kaas: 0, glotok: 1, ruba: 2 };

function log(step, msg) {
  console.log(`[posters] ${step} ${msg}`);
}

function parseArgs(argv) {
  const args = { add: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`missing value for --${key}`);
    if (key === 'add') args.add.push(value);
    else args[key] = value;
    i += 1;
  }
  if (!args.base || !args.out) throw new Error('usage: --base <url> --out <dir> [--add "Name=slug=brand"]');
  return args;
}

function brandOf(entry) {
  if (entry.file.startsWith('Ruba ')) return 'ruba';
  if (entry.file.startsWith('Глоток ')) return 'glotok';
  return entry.brand;
}

async function qrDataUri(url) {
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#FFFFFF' } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function rewrite(html, { oldUrl, newUrl, qrUri, storeLabel, sourceLabel }) {
  let out = html.replace(/^﻿/, '');
  const qrSrc = /src="https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?[^"]*"/g;
  const qrHits = (out.match(qrSrc) || []).length;
  if (qrHits !== 1) throw new Error(`expected exactly 1 QR <img> in ${sourceLabel}, found ${qrHits}`);
  out = out.replace(qrSrc, `src="${qrUri}"`);
  out = out.split(oldUrl).join(newUrl);
  if (out.includes(OLD_BASE)) throw new Error(`old base URL still present in ${sourceLabel}`);
  // Mis-encoded middle dot in the KAAS header (UTF-8 "·" read as cp1251 "В·").
  out = out.replace('KAAS В· СЫРНАЯ ЛАВКА', 'KAAS · СЫРНАЯ ЛАВКА');
  // sirnayalavka.uz now 301-redirects to kaas.uz (shop domain moved 2026-09-25).
  out = out.replace('<span class="site">sirnayalavka.uz</span>', '<span class="site">kaas.uz</span>');
  if (storeLabel !== sourceLabel) {
    const hits = out.split(`>${sourceLabel}<`).length - 1;
    if (hits !== 1) throw new Error(`expected 1 store label "${sourceLabel}", found ${hits}`);
    out = out.replace(`>${sourceLabel}<`, `>${storeLabel}<`).split(sourceLabel).join(storeLabel);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = args.base.replace(/\/$/, '');
  const outDir = path.resolve(args.out);
  log('START', `base=${base} out=${outDir} extra=${args.add.length}`);

  const manifest = JSON.parse(await fs.readFile(path.join(SOURCE_DIR, 'manifest.json'), 'utf8'));
  const entries = manifest.map((m) => ({ store: m.store, slug: m.slug, file: m.file, brand: brandOf(m), template: m.file, templateLabel: m.store }));
  for (const spec of args.add) {
    const [store, slug, brand] = spec.split('=');
    if (!store || !/^[0-9a-f]{6,12}$/.test(slug ?? '') || !brand) throw new Error(`bad --add "${spec}"`);
    const template = manifest.find((m) => brandOf(m) === brand);
    if (!template) throw new Error(`no printed template for brand ${brand}`);
    entries.push({ store, slug, file: `${store}.html`, brand, template: template.file, templateLabel: template.store, templateSlug: template.slug });
  }
  const slugs = new Set(entries.map((e) => e.slug));
  if (slugs.size !== entries.length) throw new Error('duplicate slug in poster list');
  entries.sort((a, b) => (BRAND_ORDER[a.brand] - BRAND_ORDER[b.brand]) || a.store.localeCompare(b.store, 'ru'));
  log('LOAD', `posters=${entries.length} kaas=${entries.filter((e) => e.brand === 'kaas').length} glotok=${entries.filter((e) => e.brand === 'glotok').length} ruba=${entries.filter((e) => e.brand === 'ruba').length}`);

  await fs.mkdir(path.join(outDir, 'pages'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const written = [];
  try {
    for (const [i, e] of entries.entries()) {
      const html = await fs.readFile(path.join(SOURCE_DIR, e.template), 'utf8');
      const oldSlug = e.templateSlug ?? e.slug;
      const newUrl = `${base}/${e.slug}`;
      const out = rewrite(html, {
        oldUrl: `${OLD_BASE}/${oldSlug}`,
        newUrl,
        qrUri: await qrDataUri(newUrl),
        storeLabel: e.store,
        sourceLabel: e.templateLabel,
      });
      const htmlPath = path.join(outDir, e.file);
      await fs.writeFile(htmlPath, out, 'utf8');
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const pdfPath = path.join(outDir, 'pages', `${String(i + 1).padStart(2, '0')}.pdf`);
      await page.pdf({ path: pdfPath, format: 'A5', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, pageRanges: '1' });
      written.push({ n: i + 1, store: e.store, brand: e.brand, slug: e.slug, url: newUrl, html: e.file, pdf: path.relative(outDir, pdfPath) });
      log('PAGE', `${i + 1}/${entries.length} ${e.store} slug=${e.slug}`);
    }
  } finally {
    await browser.close();
  }
  await fs.writeFile(path.join(outDir, 'posters.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base, total: written.length, posters: written }, null, 2));
  log('END', `ok=${written.length} of=${entries.length} manifest=${path.join(outDir, 'posters.json')}`);
}

main().catch((err) => {
  console.error(`[posters] FAIL ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
