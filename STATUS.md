# Status

**Updated:** 2026-05-21 (end of session)

## Current Phase

`M5 - Reporting Activation — COMPLETE. Daily Telegram report fires automatically at 08:00 Tashkent via GitHub Actions. Power BI analyst onboarding doc shipped.`

## Product Truth

- This app is QR voting + store/listing operations.
- It is not a social media post publisher.
- Customers scan a poster QR, vote 1–5 stars + optional comment, and the data lands in Postgres for the admin dashboard, the daily Telegram report, and external Power BI reporting.

## What Is Done (as of 2026-05-21 end of session)

### Production cron — DONE today
- GitHub Actions workflow `.github/workflows/daily-telegram-report.yml` fires `POST /api/reports/daily` at **03:00 UTC (08:00 Tashkent)** daily.
- Manual trigger available via "Run workflow" button.
- `REPORTS_API_KEY` set as GitHub repo secret.
- Run #1 verified green on 2026-05-21: `{"ok":true,"sent":true}` in 2 seconds.
- curl uses `--retry 3 --max-time 60 --fail-with-body` to survive Railway cold starts and surface error bodies on failure.

### QR slug freeze — DONE today
- 41 printed slugs are now immutable at the application layer.
- `app/src/lib/db.ts` extends Prisma to throw on any `update`/`updateMany`/`upsert` that touches `QRCode.slug`.
- Backup at `data/qr-links-frozen-2026-05-21.json` (versioned in git forever).
- Full rule documented in `docs/QR_SLUG_PROTECTION.md`.
- Project-level `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` created so any AI tool sees the rule first.

### Power BI analyst access — FULLY PROVISIONED
- `docs/ANALYST_POWER_BI_MESSAGE.md` contains the ready-to-send message in Russian for the analyst.
- Public TCP domain: `metro.proxy.rlwy.net:36355` (Railway Postgres public proxy, port 5432 internally).
- `bi_readonly` Postgres role created with SELECT-only privileges on the `public` schema.
- Verified live: `SELECT count(*) FROM "Store"` returns 43 rows; `SELECT count(*) FROM "Feedback"` returns 35 rows; UPDATE attempts denied with PostgreSQL `42501 permission denied for table Feedback`.
- Connection values (host/port/db/user `bi_readonly` + password) handed to owner for sharing with analyst. **Password is NOT in any git-committed file — held by owner separately.**
- Analyst can use direct Postgres in Power BI immediately.

### Existing infrastructure (from earlier sessions)
- Production Railway deploy from `app/` is reliable.
- Latest verified deployment: today's `railway up` with Prisma slug guard, exit code 0.
- Admin dashboard with daily/weekly/monthly/yearly views (English; Russian translation done locally, awaiting deploy).
- `GET /api/analytics/feedback` and `GET /api/analytics/stores` with Bearer auth, verified 200.
- Daily Telegram report shows every active store including 0-vote ones.
- Vote cooldown is 35 days per device per store.
- 41/41 A5 poster QR links return HTTP 200 in production (verified 2026-05-18).

## Current Blockers

None.

## Immediate Next Steps

1. **Tonight 23:05 Tashkent (20:05 CEST):** Russian dashboard translation auto-deploys via Windows Scheduled Task `Pinbox-Railway-Night-Deploy`. Railway free-tier peak-hours block (8 AM–8 PM CEST) lifted just after 20:00, so the task threads the needle. No manual action needed.
2. **Tomorrow morning:** Verify that the 08:00 Tashkent GitHub Actions cron actually delivered to the managers Telegram group. If green, close M5 in `ROADMAP.md`.
3. **Analyst:** Connection values have been handed to the owner. Owner forwards to analyst; analyst connects Power BI to `metro.proxy.rlwy.net:36355` with the `bi_readonly` credentials.

## Verification Snapshot (2026-05-21 afternoon)

- GitHub Actions run #1 of "Daily Telegram Report": `Success`, log shows `{"ok":true,"sent":true}`.
- All analytics endpoints: `200` with valid auth, `401` without.
- 34 real customer votes already in the database; 5 fresh ones today.
- TypeScript: `npx tsc --noEmit` from `app/` exits 0 (with Prisma extension + translated dashboard).
