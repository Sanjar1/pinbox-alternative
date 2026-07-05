# Pinbox Alternative — Project Rules

> All workflow, skill routing, verification, and communication rules are inherited from the global CLAUDE.md.
> This file contains ONLY rules specific to this project.

---

## QR slugs are frozen (HARD RULE)

**Never modify `QRCode.slug` in the production database.** 41 A5 posters were
printed and distributed on 2026-05-17/18 — every slug below corresponds to a
QR code on a wall in a real cheese store.

- Backup: `data/qr-links-frozen-2026-05-21.json`
- Application-level guard: `app/src/lib/db.ts` (Prisma extension blocks `update`/`updateMany`/`upsert` that touch `slug`)
- Full rule: `docs/QR_SLUG_PROTECTION.md`

Forbidden, no exceptions without first reprinting + redistributing the affected poster:
- `prisma.qRCode.update({ data: { slug: ... } })`
- `UPDATE "QRCode" SET slug = ...` in psql
- Migrations that alter the `slug` column on existing rows
- Re-running any `import-stores` / `regenerate-slugs` style script against production

Creating NEW `QRCode` rows for NEW stores added AFTER 2026-05-21 is fine.
Incrementing `scans` is fine. Only `slug` writes are blocked.

**The production DOMAIN is frozen too.** The printed posters encode the full URL
`https://web-production-370c1.up.railway.app/{slug}` — the app must keep answering
on that exact domain. Never delete/rename the Railway `web` service, never migrate
the web app off Railway, never let the Railway account lapse (see "Railway usage
budget" below). Moving backing services (e.g. the database) is allowed as long as
the same domain keeps serving the same URLs.

## Railway usage budget (HARD RULE — added 2026-07-05)

**The app must run on ≤ $1.00/month of Railway usage** — that is the Free plan's
monthly grant. On 2026-07-05 the grant ran out mid-cycle and Railway took the
whole app offline ("train has not arrived at the station" on all 41 printed QR
posters) — treat exceeding the budget as a production outage.

Facts (measured 2026-07-05, cycle ending ~Jul 12):
- Cost driver is **RAM-minutes**: ~$1.38/mo of a $1.53/mo total. CPU/egress/disk are noise.
- Free plan grant: $1.00/mo, 0.5 GB RAM, 1 vCPU, 1 GB disk. Grant resets monthly, does NOT roll over.
- Hobby plan ($5/mo recurring) was paid for July 2026 as a stopgap; the goal is
  to optimize under $1.00/mo and downgrade back to Free.

Rules:
- Any new feature/service/cron must be checked against the RAM-minutes budget before shipping.
- No new always-on processes, no second Railway service, no RAM-hungry dependencies without owner approval.
- Check `railway.com/workspace/usage` (Current Usage vs Included Usage) during any deploy-related work; surface the number in the session report if it's past 50% mid-cycle.
- App Sleeping (scale-to-zero) is the intended mechanism to stay under budget — do not disable it once enabled. Known tradeoff: first request after idle takes ~3–10 s.

## Daily Telegram report

Fires automatically every day at **08:00 Tashkent (03:00 UTC)** via
`.github/workflows/daily-telegram-report.yml` (GitHub Actions). Manual run
from the GitHub Actions UI is available via the "Run workflow" button.
Endpoint hit: `POST /api/reports/daily` on the Railway production app.

If the report does not arrive one morning:
1. Check `https://github.com/Sanjar1/pinbox-alternative/actions/workflows/daily-telegram-report.yml` for the latest run status.
2. If red — inspect the response body in the log (printed by `curl --fail-with-body`).
3. If green but no message — check Railway logs for `/api/reports/daily`.

The report is grouped by territorial manager. The store→TM mapping is synced from
a Google Sheet before each report via `POST /api/admin/sync-managers` (reuses the
"Store managers task bot" service account; see `docs/MANAGER_SYNC_SETUP.md`).
Mapping changes need only a sheet edit, no redeploy. Fallback snapshot:
`app/data/manager-assignments.json`.

## Deploy (Railway, NOT Vercel)

Railway CLI from `app/` subdirectory: `cd app && railway up --service web`.
Never deploy from the repo root — `railway.json` path is wrong there.
Full notes: `RAILWAY_CHEATSHEET.md`.

## Tashkent time

Production uses Asia/Tashkent (UTC+5) for all user-facing timestamps. Daily
report range = previous full Tashkent day (00:00–24:00, see D-031 in
`DECISIONS.md`).

## Pointers

- Status snapshot: `STATUS.md`
- Decision log: `DECISIONS.md`
- Recent progress: `PROGRESS.md`
- Mistakes / lessons: `MISTAKES.md`
- Yandex / 2GIS API cheatsheets: `docs/YANDEX_API_CHEATSHEET.md`, `docs/2GIS_API_CHEATSHEET.md`
