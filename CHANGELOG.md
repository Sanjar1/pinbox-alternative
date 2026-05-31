# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed (2026-05-31 — session 5)
- **Production build** — committed `app/src/lib/feedback-filters.ts` (was imported but never `git add`-ed) that broke every cloud `next build` with "Module not found". This unblocked all deploys.
- **Daily Telegram report** — restored the detailed "Ежедневный отчет по QR-отзывам" format covering the previous full Tashkent day with summary + all 43 stores (`VOTE_ROW_FILTER` counts), replacing the old compact "Отчет за сегодня" table that covered today. (Was uncommitted working-tree code.)
- **Admin dashboard "Последние голоса"** — now lists all votes via `VOTE_ROW_FILTER` with the Сервис/Качество/Цены breakdown, instead of `COMMENT_ROW_FILTER` (which hid pure-rating votes and showed "Голосов за этот период нет").
- **CI security** — deploy workflow log step passes `github.*` context via `env` (not inline `${{ }}`) to avoid script injection.

### Changed (2026-05-31 — session 5)
- Nightly deploy cron `5 18 * * *` → `0 2 * * *` (02:00 UTC = 07:00 Tashkent), off-peak year-round, ~1h before the daily report.
- Cloud deploy runs `railway up` from the **repo root** (Railway Root Directory = `app`); `app/railway.json` sets `dockerfilePath: "Dockerfile"`.
- Committed all remaining live-but-uncommitted production source (analytics feedback/stores routes, store admin pages, google-real connector, platform-links, brands.runtime) so committed == deployed.

### Added (2026-05-31 — session 5)
- `app/src/app/api/analytics/stores/route.ts` — per-store analytics endpoint (was untracked, now committed).
- Deploy workflow "Log trigger context" step (schedule vs manual, UTC + Tashkent time, SHA).

### Added (2026-05-29 — session 4)
- `.github/workflows/nightly-railway-deploy.yml` — cloud nightly Railway deploy. Runs `railway up --service web --ci` at 18:05 UTC (23:05 Tashkent, off-peak) from a GitHub Actions runner; `workflow_dispatch` manual trigger. Requires repo secret `RAILWAY_TOKEN` (production-scoped Railway project token, added 2026-05-29). Now the reliable primary deploy path.
- `scripts/pinbox-night-deploy-task.xml` + `scripts/register-night-deploy-task.ps1` — versioned definition + installer for the local Windows deploy task, with battery + `WakeToRun` settings fixed.

### Fixed (2026-05-29 — session 4)
- Nightly deploy no longer silently fails. `scripts/railway-night-deploy.ps1` rewritten to detect the "Indexing…" crash, retry once, and send a Telegram alert on final failure (UTF-8 logs instead of UTF-16). Root cause of the 6-day stall: local `railway up` crashed at Indexing (memory) every night since 05-24 with no detection/alert, and the Windows task skipped nights on battery/sleep (`DisallowStartIfOnBatteries=true`, no `WakeToRun`) — both fixed.

### Changed (2026-05-24 — session 3)
- `app/src/app/login/login-form.tsx` — full rewrite. Email field removed. Single password input with Russian labels: header "Сырная Лавка — Команда", label "Пароль", button "Войти". `autoFocus` on the password field.
- `app/src/app/login/actions.ts` — full rewrite. Accepts `password` only. Compares to `process.env.TEAM_PASSWORD` (Railway env var). On match, lazy-creates/finds singleton `team@kaas.local` OWNER user. Creates session. Audit-logs LOGIN_SUCCESS / LOGIN_FAILED. All error messages in Russian.
- `TEAM_PASSWORD=12345` added to Railway web service env vars (set via `railway variables --set`; write confirmed via `--kv` grep).

### Fixed (2026-05-24 — session 2)
- Dashboard and reports no longer double-count votes. Root cause: the voting client writes two Feedback rows per customer visit (vote + free-text comment with `-comment` deviceHash). Telegram alert dedup via `sessionKey` masked the issue, but dashboard/report queries counted both rows. Solution: `app/src/lib/feedback-filters.ts` exports `VOTE_ROW_FILTER` and `COMMENT_ROW_FILTER`; dashboard counts and all report queries now filter by votes only. Verified on production DB: last 7 days went from 232 rows → 230 vote rows; affected stores (Юнусабад, Метро Чиланзар) now show correct counts.

### Added (2026-05-24 — session 1)
- `.github/workflows/weekly-telegram-report.yml` — sends `POST /api/reports/weekly` every Monday at 08:00 Tashkent (03:00 UTC). Uses `REPORTS_API_KEY` secret + `workflow_dispatch` manual trigger.
- `.github/workflows/monthly-telegram-report.yml` — sends `POST /api/reports/monthly` on the 1st of each month at 08:00 Tashkent (03:00 UTC). Same pattern.
- `app/src/lib/feedback-alert-buffer.ts` — in-memory 30-second debounce buffer for low-rating Telegram alerts, keyed by `storeId:baseDeviceId`. Merges vote + follow-up comment into one alert; sends a short follow-up if comment arrives after the timer fires.
- `app/src/lib/feedback-filters.ts` — exports `VOTE_ROW_FILTER` and `COMMENT_ROW_FILTER` to distinguish vote rows from comment rows in queries.

### Changed (2026-05-24 — session 1)
- `app/src/lib/notifications.ts` — low-rating Telegram alert template completely rewritten: Russian language, shaming tone, per-question score breakdown (Сервис/Качество/Цены), Tashkent-formatted timestamp via `Intl.DateTimeFormat`, brand «KAAS Сырная Лавка», @sanjar676767 + @Alijon_87 mentions. Added `buildFollowUpCommentMessage` for late-comment follow-ups.
- `app/src/app/[slug]/actions.ts` — low-rating alert is now routed through the debounce buffer (`feedback-alert-buffer.ts`) instead of direct send.
- `app/src/app/admin/page.tsx` — counts and display now filter Feedback rows via `VOTE_ROW_FILTER` and `COMMENT_ROW_FILTER` to avoid double-counting.
- `app/src/lib/report-builder.ts` — daily, weekly, and monthly report queries now filter by `VOTE_ROW_FILTER` to avoid double-counting.

### Added (2026-05-21 — end of session)
- `bi_readonly` Postgres role with SELECT-only privileges on the `public` schema, accessible via the Railway public TCP proxy at `metro.proxy.rlwy.net:36355`, for Power BI analyst direct database access.

### Fixed (2026-05-21 — end of session)
- `scripts/railway-night-deploy.ps1` now runs `railway up` from the `app/` subdirectory (was running from repo root, silently failing every night with exit code `2147946720`).

### Added (2026-05-21 — afternoon)
- `.github/workflows/daily-telegram-report.yml` — GitHub Actions scheduled workflow that fires `POST /api/reports/daily` every day at 03:00 UTC (08:00 Tashkent). Replaces the blocked Railway cron approach.
- `data/qr-links-frozen-2026-05-21.json` — versioned backup of all 41 printed slug → store mappings.
- `docs/QR_SLUG_PROTECTION.md` — full rule, restore procedure, and exceptions policy for printed slugs.
- `docs/ANALYST_POWER_BI_MESSAGE.md` — Russian-language Railway runbook + ready-to-send analyst onboarding message with 6 default Power BI report ideas.
- `docs/superpowers/plans/2026-05-20-voting-dashboard-and-reports.md` and `docs/superpowers/plans/2026-05-21-github-actions-daily-report-cron.md` — implementation plans.
- Project-level `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — surface the QR-freeze hard rule + project pointers to any AI tool on first read.

### Changed (2026-05-21 — afternoon)
- `app/src/lib/db.ts` — Prisma client now extends the base `PrismaClient` to reject any `update`/`updateMany`/`upsert` on `QRCode` that includes `slug` in the write payload. Deployed to Railway (exit code 0).
- `app/src/app/admin/page.tsx` — admin dashboard translated to Russian (15 string replacements + date locale `en-GB` → `ru-RU` in three formatters). Typecheck passes; deploy pending.

### Fixed (2026-05-21 — afternoon)
- The 08:00 Tashkent automatic cron is no longer blocked. Worked around Railway free-plan resource limit by moving the scheduler to GitHub Actions (free, includes manual-trigger button and failure email).

### Added (2026-05-21 — morning)
- Light admin analytics dashboard with daily, weekly, monthly, and yearly period views.
- `GET /api/analytics/stores` endpoint for store-level Power BI analytics.
- Telegram production variables for daily report delivery.

### Changed (2026-05-21 — morning)
- Daily Telegram report now summarizes yesterday's full Tashkent day for the 08:00 morning report.
- Daily Telegram report is Russian and includes every active store, including stores with `0` votes.
- Device vote cooldown changed from once per 7 days to once per 35 days per store.
- Railway Docker image now exposes port `8080` to match the runtime `PORT`.

### Fixed (2026-05-21 — morning)
- Production dashboard/reporting/API deploy verified on Railway.
- Missed daily Telegram report sent manually and returned `{"ok":true,"sent":true}`.

### Added (2026-05-18)
- `POST /api/admin/repair-a5-links` endpoint: idempotent repair for Глоток Юнусабад/Панельный slugs and optional full feedback clear.
- `GET/POST /api/admin/qr-check` diagnostic endpoint (list all QR codes/stores + run archivedAt migration).
- `POST /api/admin/create-missing-stores` utility endpoint.
- `POST /api/reports/{daily,weekly,monthly}` Telegram report trigger endpoints.
- Brand theming system: `app/src/lib/brands.ts` + `brands.runtime.mjs` supporting `kaas`, `glotok`, `ruba`.
- `/preview/voting-brand` preview page to inspect all brand themes.
- `Store.archivedAt DateTime?` soft-delete field with Prisma migration `20260518000000_add_store_archived_at`.
- Voting page shows graceful "store closed" message for archived stores (QR codes on printed posters never 404).
- `REPORTS_API_KEY` Railway variable (value: `pinbox-reports-2026-secure`).
- `npx prisma migrate deploy` added to `docker-entrypoint.sh` — migrations apply automatically on every deploy.

### Changed (2026-05-18)
- `store-access.ts`: admin store queries now filter `archivedAt: null` (exclude archived stores from admin UI).
- `app/.gitignore`: added `test-output/` and `data/generated-store-import.csv` to prevent 47MB upload bloat during Railway CLI deploys.
- `RAILWAY_CHEATSHEET.md`: updated with correct CLI deploy path, upload timeout root cause, admin endpoint docs, post-deploy checklist.

### Fixed (2026-05-18)
- A5 poster health: **41/41 poster QR links now return HTTP 200** (was 35/41).
- Глоток Юнусабад (`/4c5350`) and Глоток Панельный (`/e96943`) now have their own stores; no longer share slugs with Лавка locations.
- 14 test votes cleared from production DB.

### Added (2026-05-17)
- `GET /api/analytics/feedback` endpoint for external analytics/Power BI ingestion with Bearer auth.
- Ops automation scripts:
  - `scripts/railway-night-deploy.ps1`
  - `scripts/send-daily-report.ps1`

### Changed (2026-05-17)
- Daily/weekly/monthly report ranking logic now sorts by:
  1) vote count descending
  2) average score descending.
- `Pinbox-Telegram-Daily-Report` scheduled task created and then disabled by decision (activate later when votes accumulate).

### Fixed (2026-05-17)
- A5 poster pack `posters/A5-PRINT-READY-2026-05-17`: replaced placeholder QR slugs in 21 files.
- URL health improved from `14/41` to `35/41` working links.

## [0.2.0] - 2026-02-17

### Added
- Unified sync data model: StoreMasterProfile, PlatformLocationLink, MatchCandidate, ApprovalTask, SyncJob, SyncStep, ChangeSnapshot, CategoryMapping, StorePhoto, PlatformPhotoRef
- Discovery UI at `/admin/stores/[id]/discovery` with manual candidate linking
- Master profile editor connected to StoreMasterProfile
- Connector interface scaffolds
- Telegram channel auto-import script and platform audit report

### Changed
- Product direction shifted to Yandex-first unified store card sync.
- Matching radius set to 30m with always-manual candidate selection.
- Delivery strategy pivoted away from Google dependency.

### Fixed
- Lint blocker in `app/src/lib/rollback/service.ts` resolved.
- Build passing on verified baseline.

## [0.1.0] - 2026-02-07

### Added
- Core Next.js app with auth/session system
- Tenant isolation and RBAC
- Store CRUD with basic fields
- CSV import with validation
- QR code generation with unique slugs
- Public rating landing page at `/[slug]`
- Private feedback capture
- Notification system baseline
- Audit logging baseline
- Docker Compose with Postgres 15 and Redis 7

### Fixed
- Security hardening: hashed passwords, token sessions, tenant-safe checks
- URL and feedback input validation
