# Pinbox Alternative — Project Instructions

> **Mirror of `CLAUDE.md`** — keep CLAUDE.md, AGENTS.md, GEMINI.md in sync.
> If you edit one, edit all three. Or better: edit CLAUDE.md and copy the
> exact content here and to AGENTS.md.

These rules are specific to this project and override generic defaults.

## HARD RULE: QR slugs are frozen

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

## Daily Telegram report

Fires automatically every day at **08:00 Tashkent (03:00 UTC)** via
`.github/workflows/daily-telegram-report.yml` (GitHub Actions). Manual run
from the GitHub Actions UI is available via the "Run workflow" button.
Endpoint hit: `POST /api/reports/daily` on the Railway production app.

If the report does not arrive one morning:
1. Check `https://github.com/Sanjar1/pinbox-alternative/actions/workflows/daily-telegram-report.yml` for the latest run status.
2. If red — inspect the response body in the log (printed by `curl --fail-with-body`).
3. If green but no message — check Railway logs for `/api/reports/daily`.

## Deploy

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
