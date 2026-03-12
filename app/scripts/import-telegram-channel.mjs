import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const prisma = new PrismaClient();

const CHANNEL_URL = process.env.TELEGRAM_CHANNEL_URL ?? 'https://t.me/s/lokasiyasirnayalavka';
const OWNER_EMAIL = process.env.IMPORT_OWNER_EMAIL ?? 'admin@demo.com';
const MAX_PAGES = 25;
const INCLUDE_CLOSED = ['1', 'true', 'yes'].includes(
  (process.env.IMPORT_INCLUDE_CLOSED ?? '').toLowerCase()
);

const PLATFORM_ORDER = ['GOOGLE', 'YANDEX', 'TWOGIS'];

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => {
      const charCode = Number.parseInt(code, 10);
      if (Number.isNaN(charCode)) {
        return _;
      }
      return String.fromCharCode(charCode);
    });
}

function stripTags(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function normalizeName(value) {
  return value.replace(/^[📍\s]+/, '').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(url) {
  return decodeHtml(url).replace(/&amp;/g, '&').trim();
}

function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('maps.app.goo.gl') || lower.includes('google.') || lower.includes('g.page')) {
    return 'GOOGLE';
  }
  if (lower.includes('yandex.')) {
    return 'YANDEX';
  }
  if (lower.includes('2gis.')) {
    return 'TWOGIS';
  }
  return null;
}

function buildFallbackUrl(platform, name, address) {
  const query = encodeURIComponent(`${name} ${address ?? ''}`.trim());
  if (platform === 'GOOGLE') {
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  if (platform === 'YANDEX') {
    return `https://yandex.uz/maps/?text=${query}`;
  }
  return `https://2gis.uz/search/${query}`;
}

function extractMessageTextBlocks(pageHtml) {
  const blocks = [];
  const messageRegex =
    /<div class="tgme_widget_message\b[\s\S]*?data-post="[^"]+\/(\d+)"[\s\S]*?<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/g;

  for (const match of pageHtml.matchAll(messageRegex)) {
    const id = Number.parseInt(match[1], 10);
    const textHtml = match[2];
    if (!Number.isNaN(id) && textHtml) {
      blocks.push({ id, textHtml });
    }
  }

  return blocks;
}

function extractStoreFromMessage({ id, textHtml }) {
  const links = [...textHtml.matchAll(/<a href="([^"]+)"/g)].map((match) => normalizeUrl(match[1]));
  if (links.length === 0) {
    return null;
  }

  const directLinks = {};
  for (const link of links) {
    const platform = detectPlatform(link);
    if (!platform || directLinks[platform]) {
      continue;
    }
    directLinks[platform] = link;
  }

  if (Object.keys(directLinks).length === 0) {
    return null;
  }

  const text = normalizeName(stripTags(textHtml));
  if (!text) {
    return null;
  }

  const isClosed = /закрыт|closed/i.test(text);

  return {
    sourceMessageId: id,
    name: text,
    address: text,
    isClosed,
    directLinks,
  };
}

async function fetchChannelPages(startUrl) {
  const pages = [];
  const visited = new Set();
  let url = startUrl;

  while (url && !visited.has(url) && pages.length < MAX_PAGES) {
    visited.add(url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PinboxImporter/1.0)',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    pages.push({ url, html });

    const prevMatch = html.match(/<link rel="prev" href="([^"]+)"/i);
    if (!prevMatch) {
      break;
    }
    url = new URL(prevMatch[1], 'https://t.me').toString();
  }

  return pages;
}

function dedupeStores(stores) {
  const byName = new Map();

  for (const store of stores) {
    const key = store.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, store);
      continue;
    }

    for (const platform of PLATFORM_ORDER) {
      if (!existing.directLinks[platform] && store.directLinks[platform]) {
        existing.directLinks[platform] = store.directLinks[platform];
      }
    }

    if (store.sourceMessageId > existing.sourceMessageId) {
      existing.sourceMessageId = store.sourceMessageId;
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

async function generateUniqueSlug() {
  for (let i = 0; i < 30; i += 1) {
    const slug = randomBytes(3).toString('hex');
    const existing = await prisma.qRCode.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
  }
  throw new Error('Failed to generate unique QR slug');
}

async function resolveTenantId() {
  const byEmail = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
    select: { tenantId: true },
  });
  if (byEmail?.tenantId) {
    return byEmail.tenantId;
  }

  const owner = await prisma.user.findFirst({
    where: { role: 'OWNER' },
    select: { tenantId: true },
  });
  if (owner?.tenantId) {
    return owner.tenantId;
  }

  const anyUser = await prisma.user.findFirst({
    select: { tenantId: true },
  });
  if (anyUser?.tenantId) {
    return anyUser.tenantId;
  }

  throw new Error('No users found. Run `npm run db:seed` first.');
}

async function upsertStore(tenantId, storeData) {
  const existingStore = await prisma.store.findFirst({
    where: {
      tenantId,
      name: storeData.name,
    },
  });

  const store =
    existingStore ??
    (await prisma.store.create({
      data: {
        tenantId,
        name: storeData.name,
        address: storeData.address,
        qrCodes: {
          create: {
            name: 'Default',
            slug: await generateUniqueSlug(),
          },
        },
      },
    }));

  if (existingStore && existingStore.address !== storeData.address) {
    await prisma.store.update({
      where: { id: store.id },
      data: { address: storeData.address },
    });
  }

  const links = [];
  for (const platform of PLATFORM_ORDER) {
    const directUrl = storeData.directLinks[platform];
    const url = directUrl ?? buildFallbackUrl(platform, storeData.name, storeData.address);

    const saved = await prisma.platformLocationLink.upsert({
      where: {
        storeId_platform: {
          storeId: store.id,
          platform,
        },
      },
      create: {
        storeId: store.id,
        platform,
        url,
      },
      update: {
        url,
      },
    });

    links.push(saved);
  }

  return { store, links };
}

function formatPlatformStatus(link) {
  return link.autoGenerated ? 'auto-generated' : 'direct';
}

async function writeReport(rows, stats) {
  const reportPath = new URL('../../docs/LOCATION_PLATFORM_AUDIT.md', import.meta.url);
  const today = new Date().toISOString();

  const lines = [];
  lines.push('# Location Platform Audit');
  lines.push('');
  lines.push(`Generated: ${today}`);
  lines.push(`Source: ${CHANNEL_URL}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Imported/updated stores: ${stats.imported}`);
  lines.push(`- Skipped closed stores: ${stats.skippedClosed}`);
  lines.push(`- Total channel candidates: ${stats.candidates}`);
  lines.push(`- Google direct links: ${stats.directGoogle}`);
  lines.push(`- Yandex direct links: ${stats.directYandex}`);
  lines.push(`- 2GIS direct links: ${stats.directTwogis}`);
  lines.push('');
  lines.push('## Per Store Status');
  lines.push('');
  lines.push('| Store | Google | Yandex | 2GIS |');
  lines.push('|---|---|---|---|');

  for (const row of rows) {
    lines.push(`| ${row.name} | ${row.google} | ${row.yandex} | ${row.twogis} |`);
  }

  await writeFile(reportPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const tenantId = await resolveTenantId();
  const pages = await fetchChannelPages(CHANNEL_URL);

  const extracted = [];
  for (const page of pages) {
    const blocks = extractMessageTextBlocks(page.html);
    for (const block of blocks) {
      const store = extractStoreFromMessage(block);
      if (store) {
        extracted.push(store);
      }
    }
  }

  const stores = dedupeStores(extracted);

  const stats = {
    candidates: stores.length,
    skippedClosed: 0,
    imported: 0,
    directGoogle: 0,
    directYandex: 0,
    directTwogis: 0,
  };
  const reportRows = [];

  for (const item of stores) {
    if (item.isClosed && !INCLUDE_CLOSED) {
      stats.skippedClosed += 1;
      continue;
    }

    const { store, links } = await upsertStore(tenantId, item);
    const byPlatform = Object.fromEntries(links.map((link) => [link.platform, link]));

    const google = byPlatform.GOOGLE;
    const yandex = byPlatform.YANDEX;
    const twogis = byPlatform.TWOGIS;

    if (!google.autoGenerated) stats.directGoogle += 1;
    if (!yandex.autoGenerated) stats.directYandex += 1;
    if (!twogis.autoGenerated) stats.directTwogis += 1;

    reportRows.push({
      name: store.name,
      google: formatPlatformStatus(google),
      yandex: formatPlatformStatus(yandex),
      twogis: formatPlatformStatus(twogis),
    });
    stats.imported += 1;
  }

  await writeReport(reportRows, stats);

  console.log(`Imported/updated stores: ${stats.imported}`);
  console.log(`Skipped closed stores: ${stats.skippedClosed}`);
  console.log(`Google direct links: ${stats.directGoogle}`);
  console.log(`Yandex direct links: ${stats.directYandex}`);
  console.log(`2GIS direct links: ${stats.directTwogis}`);
  console.log('Report written: docs/LOCATION_PLATFORM_AUDIT.md');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
