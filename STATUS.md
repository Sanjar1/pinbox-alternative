# Status

**Updated:** 2026-05-24 (end of session)

## Current Phase

`M5 — Reporting Activation — alert quality hardening + weekly/monthly crons added. Awaiting tonight's deploy verification.`

## Product Truth

- This app is QR voting + store/listing operations.
- Customers scan a poster QR, vote 1–5 stars + optional comment; data lands in Postgres for the admin dashboard, the daily/weekly/monthly Telegram reports, and external Power BI reporting.
- Brand name in Telegram copy: **«KAAS Сырная Лавка»**.

## What Is Done (as of 2026-05-24 end of session)

### Telegram alert template — DONE today
- Low-rating (≤3) Telegram alert completely rewritten. New template: Russian, shaming tone, per-question score breakdown (Сервис/Качество/Цены), Asia/Tashkent timestamp, brand «KAAS Сырная Лавка», @sanjar676767 + @Alijon_87 on-shift mentions.
- In-memory 30-second debounce buffer (`app/src/lib/feedback-alert-buffer.ts`) collapses the two server calls per customer visit into one merged alert. Late comments (>30s) get a short follow-up message.
- `npx tsc --noEmit` clean; `npm run lint` clean; live preview sent to managers group (message IDs 62913–62925).
- Commit `ddd384b`. Queued for tonight's Railway deploy via `Pinbox-Railway-Night-Deploy`.

### Weekly + monthly report crons — DONE today
- `.github/workflows/weekly-telegram-report.yml` — Mondays 08:00 Tashkent (03:00 UTC). Next firing: next Monday.
- `.github/workflows/monthly-telegram-report.yml` — 1st of each month 08:00 Tashkent. Next firing: 1 June 2026.
- Both reuse `REPORTS_API_KEY` secret. Both have `workflow_dispatch` manual trigger.
- Commits `052bfbf`, `1010e89`.

### Existing infrastructure (from earlier sessions)
- **Daily Telegram report:** GitHub Actions cron fires daily at 08:00 Tashkent. Run #1 verified 2026-05-21.
- **QR slug freeze:** Prisma client extension blocks any update to `QRCode.slug`. 41 printed posters protected.
- **Admin dashboard:** Russian translation deployed. Daily/weekly/monthly/yearly analytics views.
- **Analytics endpoints:** `GET /api/analytics/feedback` + `GET /api/analytics/stores` with Bearer auth, verified 200.
- **Power BI access:** `bi_readonly` role at `metro.proxy.rlwy.net:36355` (SELECT-only on `public` schema), provisioned and verified.
- **Vote cooldown:** 35 days per device per store.
- **41/41 A5 poster QR links:** HTTP 200 in production (verified 2026-05-18).
- **Deploy path:** `Pinbox-Railway-Night-Deploy` Windows Scheduled Task → `cd app && railway up --service web` at 23:05 Tashkent.

## Current Blockers

None blocking. **Watch:** tonight's Railway deploy must pick up `ddd384b` (alert template + buffer). Verify by scanning a real QR after 23:05 Tashkent.

## Known Pre-existing Bug (not fixed today)

`app/src/app/[slug]/client.tsx:136` appends `-comment` to `deviceId` for the free-text comment submission. This produces two Feedback DB rows per customer visit with different `deviceHash` values, causing: (1) analytics over-count of low-rating sessions, and (2) the 35-day anti-abuse check always passing for comment rows. Fix is in TODO Priority 1.

## Immediate Next Steps

1. **Tonight 23:05 Tashkent:** `Pinbox-Railway-Night-Deploy` auto-fires. No manual action needed.
2. **After deploy:** Scan any A5 poster → vote 1–2/5 → type a comment → confirm ONE merged Russian-template message in the managers group.
3. **Next session:** Add `workflow` scope to PAT, fix `-comment` deviceId bug.

## Verification Snapshot (2026-05-24)

- `npx tsc --noEmit`: exit 0 on the 3 changed files.
- `npm run lint`: clean on `notifications.ts`, `feedback-alert-buffer.ts`, `actions.ts`.
- Live `buildMessage` output: sent to managers group, message IDs 62913–62925 confirmed correct format.
- Weekly + monthly workflows: visible in repo `.github/workflows/`, manual dispatch available.
