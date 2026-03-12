#!/usr/bin/env node
/**
 * Batch-reply to positive 2025 Yandex reviews.
 *
 * Usage:
 *   node scripts/batch-reply-yandex-2025.mjs
 *   node scripts/batch-reply-yandex-2025.mjs --dry-run --limit=20 --max-pages=6
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://yandex.ru";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PROFILE_DIR = path.resolve(ROOT_DIR, ".yandex-profile");
const REPORT_PATH = path.resolve(ROOT_DIR, "data", "yandex_review_batch_report_latest.json");

const POSITIVE_HINTS = [
  "хорош",
  "отлич",
  "класс",
  "супер",
  "вкус",
  "свеж",
  "ассортимент",
  "вежлив",
  "качеств",
  "рекоменд",
  "приятн",
  "молодц",
  "любим",
];

const NEGATIVE_HINTS = [
  "ужас",
  "груб",
  "невеж",
  "хам",
  "плохо",
  "средняк",
  "просроч",
  "не совет",
  "обман",
  "закрыва",
  "ошибк",
  "дорого",
  "долго",
  "гряз",
];

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    limit: 0,
    maxPages: 6,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg.startsWith("--limit=")) opts.limit = Number(arg.split("=")[1] || 0);
    else if (arg.startsWith("--max-pages=")) opts.maxPages = Number(arg.split("=")[1] || 6);
  }

  if (!Number.isFinite(opts.limit) || opts.limit < 0) opts.limit = 0;
  if (!Number.isFinite(opts.maxPages) || opts.maxPages < 1) opts.maxPages = 6;
  return opts;
}

function textNorm(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isLikelyPositive(reviewText) {
  const t = textNorm(reviewText);
  if (NEGATIVE_HINTS.some((h) => t.includes(h))) return false;
  return POSITIVE_HINTS.some((h) => t.includes(h));
}

function pickFocus(reviewText) {
  const t = textNorm(reviewText);
  if (t.includes("ассортимент")) return "что вы отметили наш ассортимент";
  if (t.includes("свеж")) return "что вы отметили свежесть продукции";
  if (t.includes("цен")) return "что вы отметили наши цены";
  if (t.includes("персонал")) return "что вы отметили работу персонала";
  if (t.includes("каче")) return "что вы отметили качество продукции";
  return "что вам понравился наш магазин";
}

function buildReply(author, reviewText) {
  const name = (author || "").trim();
  const focus = pickFocus(reviewText);
  return `${name ? `${name}, ` : ""}спасибо за высокую оценку и отзыв! Очень рады, ${focus}. Будем рады видеть вас снова в «Сырной Лавке»!`;
}

async function collectReviewUrls(page, maxPages) {
  const urls = new Set();
  await page.goto(`${BASE}/sprav/companies`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  for (let i = 0; i < maxPages; i += 1) {
    const pageUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/p/edit/reviews"]'))
        .map((a) => new URL(a.getAttribute("href"), location.origin).href);
    });
    for (const u of pageUrls) urls.add(u);

    const next = page.getByRole("link", { name: /вперед/i });
    if ((await next.count()) === 0 || !(await next.first().isVisible())) break;
    await next.first().click();
    await page.waitForTimeout(1200);
  }

  return [...urls];
}

async function evaluateCards(page) {
  return page.evaluate(({ POSITIVE_HINTS, NEGATIVE_HINTS }) => {
    const out = [];
    const cards = Array.from(document.querySelectorAll("textarea")).map((ta) => ta.closest("form, section, article, div"));
    const uniqueCards = Array.from(new Set(cards.filter(Boolean)));

    const dateRe = /\b2025\b/;
    const alreadyReplyMarkers = ["ответ компании", "компания ответила"];

    const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
    const isPositive = (t) => {
      const v = norm(t);
      if (NEGATIVE_HINTS.some((h) => v.includes(h))) return false;
      return POSITIVE_HINTS.some((h) => v.includes(h));
    };

    for (const card of uniqueCards) {
      const text = (card?.innerText || "").replace(/\s+/g, " ").trim();
      if (!dateRe.test(text)) continue;

      const lowered = norm(text);
      if (alreadyReplyMarkers.some((m) => lowered.includes(m))) {
        out.push({ action: "already", reason: "already_replied" });
        continue;
      }

      if (!isPositive(text)) {
        out.push({ action: "skip", reason: "neutral_or_negative" });
        continue;
      }

      const author = Array.from(card.querySelectorAll("a, span, div, p"))
        .map((n) => (n.textContent || "").trim())
        .find((x) => x && x.length > 2 && x.length < 60 && !/\b2025\b/.test(x)) || "";

      out.push({ action: "reply", reason: "positive_2025", author, reviewText: text });
    }

    return out;
  }, { POSITIVE_HINTS, NEGATIVE_HINTS });
}

async function submitSingleReply(page, replyText) {
  const targetTa = page.locator("textarea").first();
  await targetTa.click();
  await targetTa.fill(replyText);

  const form = targetTa.locator("xpath=ancestor::form[1]");
  const submitInForm = form.locator('button[type="submit"]:not([disabled])').first();
  if ((await submitInForm.count()) > 0) {
    await submitInForm.click();
    return true;
  }

  const namedButton = page.getByRole("button", { name: /ответить|отправить|опубликовать/i }).first();
  if ((await namedButton.count()) > 0) {
    await namedButton.click();
    return true;
  }

  return false;
}

async function processReviewPage(page, url, opts, run) {
  const pageStats = {
    url,
    totalCards2025: 0,
    alreadyReplied: 0,
    skippedNegativeOrNeutral: 0,
    submitted: 0,
    errors: [],
  };

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const cards = await evaluateCards(page);
  pageStats.totalCards2025 = cards.length;

  for (const card of cards) {
    if (opts.limit > 0 && run.totalSubmitted >= opts.limit) break;

    if (card.action === "already") {
      pageStats.alreadyReplied += 1;
      continue;
    }
    if (card.action === "skip") {
      pageStats.skippedNegativeOrNeutral += 1;
      continue;
    }

    if (opts.dryRun) {
      pageStats.submitted += 1;
      run.totalSubmitted += 1;
      continue;
    }

    try {
      const reply = buildReply(card.author, card.reviewText);
      const ok = await submitSingleReply(page, reply);
      if (!ok) {
        pageStats.errors.push(`no-submit:${card.author || "unknown"}`);
        continue;
      }
      await page.waitForTimeout(900);
      pageStats.submitted += 1;
      run.totalSubmitted += 1;
    } catch (err) {
      pageStats.errors.push(`submit-failed:${String(err)}`);
    }
  }

  return pageStats;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 960 },
  });

  const page = await ctx.newPage();
  await page.goto(`${BASE}/sprav/companies`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  if (page.url().includes("passport.yandex.ru")) {
    console.error("Not authenticated. Sign in to Yandex in the opened browser, then rerun.");
    await ctx.close();
    process.exit(1);
  }

  const reviewUrls = await collectReviewUrls(page, opts.maxPages);
  const run = {
    startedAt: new Date().toISOString(),
    options: opts,
    reviewUrlsTotal: reviewUrls.length,
    pages: [],
    totalSubmitted: 0,
    total2025: 0,
    totalAlreadyReplied: 0,
    totalSkipped: 0,
  };

  for (const url of reviewUrls) {
    if (opts.limit > 0 && run.totalSubmitted >= opts.limit) break;
    const pageResult = await processReviewPage(page, url, opts, run);
    run.pages.push(pageResult);
  }

  run.finishedAt = new Date().toISOString();
  run.total2025 = run.pages.reduce((a, p) => a + p.totalCards2025, 0);
  run.totalAlreadyReplied = run.pages.reduce((a, p) => a + p.alreadyReplied, 0);
  run.totalSkipped = run.pages.reduce((a, p) => a + p.skippedNegativeOrNeutral, 0);
  run.totalErrors = run.pages.reduce((a, p) => a + p.errors.length, 0);

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(run, null, 2), "utf-8");
  console.log(JSON.stringify(run, null, 2));

  await ctx.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
