#!/usr/bin/env node
/**
 * Batch-reply to unanswered 1-3★ Yandex Business reviews (2025 + 2026).
 *
 * Usage:
 *   node scripts/batch-reply-negative-yandex.mjs
 *   node scripts/batch-reply-negative-yandex.mjs --dry-run
 *
 * Discovered DOM structure (2026-02-28):
 *   Review card  : .Review
 *   Star rating  : [class*="StarsRating_value_N"]  where N = stars × 2
 *                  (value_2=1★  value_4=2★  value_6=3★  value_8=4★  value_10=5★)
 *   Author       : .Review-UserName
 *   Date         : .Review-Date
 *   Review text  : .Review-Text
 *   Unanswered   : card contains a <textarea>
 *   Submit btn   : button.ya-business-yabs-button:not(.ya-business-yabs-button_disabled)
 *   React fill   : native setter trick — see fillTextarea() below
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Paths ────────────────────────────────────────────────────────────────────
const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR    = path.resolve(__dirname, "..", "..");
const PROFILE_DIR = path.resolve(ROOT_DIR, ".yandex-profile");
const REPORT_PATH = path.resolve(ROOT_DIR, "data", "yandex_negative_reply_report_latest.json");

// ── Org IDs (all 33 stores from YANDEX_API_CHEATSHEET.md) ───────────────────
const ALL_ORG_IDS = [
  2605231525,   46711213257,  51521899757,  68372174039,  73077844158,
  78130811373,  80285992156,  81444134916,  88969661261,  93021421517,
  93653304255,  96275437524,  98808908571,  113993963061, 119087534313,
  119523779091, 133701096811, 134404129580, 140717986697, 140997774388,
  143672341206, 146603754824, 160095672246, 168675219928, 189015626941,
  191697629628, 193938967033, 205196568796, 219043654252, 225503578112,
  225833833825, 235345012305, 242380255215,
];

const DRY_RUN = process.argv.includes("--dry-run");

// ── Reply builder ────────────────────────────────────────────────────────────
function buildNegativeReply(author, reviewText) {
  const name  = (author || "").trim();
  const lower = (reviewText || "").toLowerCase();

  let issue = "произошедшую ситуацию";
  if (/персон|сотрудник|кассир|телефон|груб|невеж|хам/.test(lower))
    issue = "поведение сотрудника";
  else if (/просроч|испорч|качеств/.test(lower))
    issue = "качество товара";
  else if (/цен|дорог/.test(lower))
    issue = "ценовую политику";
  else if (/час|закрыт|не работает|режим/.test(lower))
    issue = "режим работы";
  else if (/ожид|долго|медленн/.test(lower))
    issue = "скорость обслуживания";

  return (
    `${name ? name + ", " : ""}добрый день! ` +
    `Сожалеем, что визит оставил негативное впечатление. ` +
    `Мы обязательно разберём ${issue}. ` +
    `Пожалуйста, свяжитесь с нами: Telegram @SirnayaLavka_Uzb или ` +
    `+998 78 555 15 15 — постараемся решить вопрос. ` +
    `Надеемся на ваше понимание и будем рады видеть вас снова!`
  );
}

// ── Fill a React-controlled textarea ────────────────────────────────────────
// Plain .fill() or .value= do not trigger React's synthetic events.
// Using the native setter then dispatching 'input' + 'change' works reliably.
async function fillTextarea(card, text) {
  await card.locator("textarea").evaluate((ta, txt) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    ).set;
    setter.call(ta, txt);
    ta.dispatchEvent(new Event("input",  { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }, text);
}

// ── Process one store ────────────────────────────────────────────────────────
async function processStore(page, orgId) {
  const url   = `https://yandex.ru/sprav/${orgId}/p/edit/reviews/`;
  const stats = { orgId, url, submitted: 0, alreadyReplied: 0, skipped: 0, errors: [] };

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    await page.waitForTimeout(1500);

    if (await page.locator("text=Отзывов пока нет").count() > 0) return stats;

    const cards = page.locator(".Review");
    const total = await cards.count();

    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);

      // ── Star rating ──────────────────────────────────────────────────────
      const starsClass = await card
        .locator("[class*='StarsRating_value_']").first()
        .getAttribute("class").catch(() => "");
      const m = (starsClass || "").match(/StarsRating_value_(\d+)/);
      const stars = m ? parseInt(m[1]) / 2 : null;

      // Skip if 4-5 stars (not our target)
      if (stars === null || stars > 3) { stats.skipped++; continue; }

      // ── Check if already answered ────────────────────────────────────────
      if (await card.locator("textarea").count() === 0) {
        stats.alreadyReplied++;
        continue;
      }

      // ── Year filter ──────────────────────────────────────────────────────
      const date = await card.locator(".Review-Date").innerText().catch(() => "");
      if (!/202[56]/.test(date)) { stats.skipped++; continue; }

      // ── Gather text for reply ────────────────────────────────────────────
      const author     = await card.locator(".Review-UserName").innerText().catch(() => "");
      const reviewText = await card.locator(".Review-Text").innerText().catch(() => "");
      const reply      = buildNegativeReply(author, reviewText);

      console.log(`  ${DRY_RUN ? "[DRY] " : ""}★${stars} | ${author} | ${date.trim()}`);
      if (DRY_RUN) { stats.submitted++; continue; }

      try {
        await fillTextarea(card, reply);
        await page.waitForTimeout(400);

        // Wait for button to become enabled, then click
        const btn = card.locator(
          "button.ya-business-yabs-button:not(.ya-business-yabs-button_disabled)"
        );
        await btn.first().waitFor({ state: "visible", timeout: 4_000 });
        await btn.first().click();
        await page.waitForTimeout(900);

        stats.submitted++;
        console.log(`    ✅ reply sent`);
      } catch (err) {
        const msg = (err.message || String(err)).slice(0, 120);
        stats.errors.push(`${author}: ${msg}`);
        console.error(`    ❌ ${msg}`);
      }
    }
  } catch (err) {
    const msg = (err.message || String(err)).slice(0, 120);
    stats.errors.push(`page: ${msg}`);
    console.error(`  ❌ store ${orgId}: ${msg}`);
  }

  return stats;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log("🔍 DRY-RUN — no replies will be posted\n");

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 960 },
  });
  const page = await ctx.newPage();

  await page.goto("https://yandex.ru/sprav/companies", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  if (page.url().includes("passport.yandex.ru")) {
    console.error("Not authenticated. Sign in to Yandex in the opened browser, then rerun.");
    await ctx.close();
    process.exit(1);
  }

  const run = {
    startedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    pages: [],
  };

  for (const orgId of ALL_ORG_IDS) {
    console.log(`\nStore ${orgId}`);
    run.pages.push(await processStore(page, orgId));
    await page.waitForTimeout(300);
  }

  run.finishedAt         = new Date().toISOString();
  run.totalSubmitted     = run.pages.reduce((s, p) => s + p.submitted,     0);
  run.totalAlreadyReplied= run.pages.reduce((s, p) => s + p.alreadyReplied,0);
  run.totalSkipped       = run.pages.reduce((s, p) => s + p.skipped,       0);
  run.totalErrors        = run.pages.reduce((s, p) => s + p.errors.length, 0);

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(run, null, 2), "utf-8");

  console.log("\n════════════════════════════════");
  console.log(`Submitted    : ${run.totalSubmitted}`);
  console.log(`Already had  : ${run.totalAlreadyReplied}`);
  console.log(`Skipped (4-5★ or old): ${run.totalSkipped}`);
  console.log(`Errors       : ${run.totalErrors}`);
  console.log(`Report       : ${REPORT_PATH}`);

  await ctx.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
