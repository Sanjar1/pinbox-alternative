import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      result[key] = next;
      i += 1;
    } else {
      result[key] = 'true';
    }
  }
  return result;
}

function runNode(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${scriptPath}) with code ${code}`));
      }
    });
  });
}

async function fetchStoreSlugs(baseUrl, email, password) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  await page.goto(`${baseUrl}/admin/stores`, { waitUntil: 'networkidle' });

  const rows = await page.$$eval('tbody tr', (trs) =>
    trs
      .map((tr) => {
        const cells = tr.querySelectorAll('td');
        if (cells.length < 4) return null;
        const storeName = cells[0]?.textContent?.trim() || '';
        const qrText = cells[3]?.textContent?.trim() || '';
        const slug = qrText.startsWith('/') ? qrText.slice(1).trim() : '';
        if (!storeName || !slug) return null;
        return { storeName, slug };
      })
      .filter(Boolean),
  );

  await browser.close();
  return rows;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = (args['base-url'] ?? 'https://web-production-370c1.up.railway.app').replace(/\/$/, '');
  const outputDir = args['output-dir'] ?? path.join(process.cwd(), 'test-output', 'all-posters');
  const email = args.email ?? 'admin@demo.com';
  const password = args.password ?? 'change-me';

  const stores = await fetchStoreSlugs(baseUrl, email, password);
  if (!stores.length) {
    throw new Error('No store slugs found in /admin/stores');
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'stores-and-slugs.json'),
    JSON.stringify(stores, null, 2),
    'utf8',
  );

  console.log(`Found ${stores.length} stores. Generating posters...`);
  for (const store of stores) {
    console.log(`\n[${store.slug}] ${store.storeName}`);
    await runNode(path.join(process.cwd(), 'scripts', 'generate-qr-poster.mjs'), [
      '--slug',
      store.slug,
      '--store-name',
      store.storeName,
      '--base-url',
      baseUrl,
      '--output-dir',
      outputDir,
    ]);
  }

  console.log(`\nDone. Output folder: ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
