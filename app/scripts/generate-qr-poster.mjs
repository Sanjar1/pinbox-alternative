import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { chromium } from '@playwright/test';

const prisma = new PrismaClient();

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

function toInternalId(name) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
    қ: 'q', ғ: 'g', ҳ: 'h', ў: 'o', ':': ' ', '"': ' ', "'": ' ', '(': ' ', ')': ' ', ',': ' ',
  };

  return name
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  const baseUrl = args['base-url'] ?? 'http://localhost:3000';
  const outputDir = args['output-dir'] ?? path.join(process.cwd(), 'test-output');

  if (!slug) {
    throw new Error('Missing required --slug argument');
  }

  const qr = await prisma.qRCode.findUnique({
    where: { slug },
    include: { store: true },
  });

  if (!qr) {
    throw new Error(`QR slug not found: ${slug}`);
  }

  const internalId = toInternalId(qr.store.name || 'store').toUpperCase();
  const brandName = `${internalId} | Сырная Лавка`;
  const publicUrl = `${baseUrl.replace(/\/$/, '')}/${slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1400x1400&data=${encodeURIComponent(publicUrl)}`;

  await fs.mkdir(outputDir, { recursive: true });

  const htmlPath = path.join(outputDir, `qr-poster-${slug}.html`);
  const pngPath = path.join(outputDir, `qr-poster-${slug}.png`);

  const html = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(brandName)}</title>
    <style>
      :root {
        --bg: #fff4ea;
        --paper: #ffffff;
        --ink: #171412;
        --muted: #7b5b47;
        --accent: #f26a21;
        --line: rgba(23, 20, 18, 0.08);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top left, rgba(242, 106, 33, 0.14), transparent 28%),
          radial-gradient(circle at bottom right, rgba(242, 106, 33, 0.08), transparent 22%),
          linear-gradient(135deg, #fff3e8 0%, #fff8f2 100%);
        font-family: Georgia, "Times New Roman", serif;
        color: var(--ink);
      }

      .poster {
        width: 1080px;
        height: 1520px;
        padding: 52px;
        border-radius: 40px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.96)),
          var(--paper);
        box-shadow: 0 32px 90px rgba(23, 20, 18, 0.16);
        display: grid;
        grid-template-rows: 20% 60% 10% 10%;
        gap: 22px;
        overflow: hidden;
      }

      .hero {
        border-radius: 30px;
        padding: 24px 28px 18px;
        background: linear-gradient(135deg, #fffdfb, #fff6ef);
        border: 1px solid var(--line);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .brand-row {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 16px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(181, 74, 49, 0.10);
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 20px;
        font-weight: 700;
      }

      .store {
        text-align: right;
        font-size: 28px;
        color: var(--muted);
      }

      h1 {
        margin: 12px 0 10px;
        font-size: 76px;
        line-height: 0.96;
      }

      .lead {
        margin: 0;
        max-width: 860px;
        font-size: 36px;
        line-height: 1.15;
        color: #302925;
      }

      .lead strong {
        color: var(--accent);
      }

      .qr-stage {
        border-radius: 34px;
        background: #ffffff;
        border: 1px solid var(--line);
        display: grid;
        place-items: center;
        padding: 34px;
        position: relative;
      }

      .qr-stage::before {
        content: "SCAN";
        position: absolute;
        top: 18px;
        left: 28px;
        font-size: 26px;
        letter-spacing: 0.22em;
        color: rgba(23, 20, 18, 0.18);
      }

      .qr-frame {
        width: 100%;
        height: 100%;
        border-radius: 28px;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at center, rgba(242, 106, 33, 0.08), transparent 52%),
          linear-gradient(180deg, #fffefc 0%, #fff4ea 100%);
        border: 1px solid rgba(23, 20, 18, 0.06);
      }

      .qr-box {
        width: 660px;
        height: 660px;
        border-radius: 34px;
        padding: 26px;
        background: white;
        border: 1px solid rgba(23, 20, 18, 0.10);
        box-shadow:
          0 18px 40px rgba(23, 20, 18, 0.08),
          inset 0 0 0 1px rgba(255,255,255,0.9);
      }

      .qr-box img {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 16px;
      }

      .instructions {
        border-radius: 28px;
        background: #ffffff;
        border: 1px solid var(--line);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 30px;
      }

      .instruction-label {
        font-size: 22px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--accent);
      }

      .instruction-text {
        flex: 1;
        font-size: 24px;
        line-height: 1.25;
        color: #2d2622;
      }

      .cta {
        border-radius: 28px;
        background: linear-gradient(135deg, #f26a21, #ff8438);
        color: #ffffff;
        padding: 20px 28px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }

      .cta-copy {
        font-size: 28px;
        line-height: 1.18;
      }

      .cta-copy strong {
        color: #fff4d8;
      }

      .url {
        max-width: 320px;
        text-align: right;
        overflow-wrap: break-word;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.84);
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <section class="hero">
        <div class="brand-row">
          <div class="badge">Оцените нас</div>
          <div class="store">${escapeHtml(brandName)}</div>
        </div>
        <div>
          <h1>Оставьте ваш отзыв</h1>
          <p class="lead">Ваше мнение важно для нас.</p>
        </div>
      </section>

      <section class="qr-stage">
        <div class="qr-frame">
          <div class="qr-box">
            <img src="${qrImageUrl}" alt="QR" />
          </div>
        </div>
      </section>

      <section class="instructions">
        <div class="instruction-label">Как это работает</div>
        <div class="instruction-text">Наведите камеру на QR-код. Откроется страница — поставьте оценку.</div>
      </section>

      <section class="cta">
        <div class="cta-copy">Ваш отзыв помогает нам <strong>стать лучше</strong>!</div>
      </section>
    </main>
  </body>
</html>`;

  await fs.writeFile(htmlPath, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1520 },
    deviceScaleFactor: 2,
  });
  await page.goto(`file:///${htmlPath.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: pngPath, fullPage: true });
  await browser.close();

  console.log(JSON.stringify({
    slug,
    storeName: qr.store.name,
    brandName,
    publicUrl,
    htmlPath,
    pngPath,
  }, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
