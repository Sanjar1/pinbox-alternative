# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed (2026-08-13)
- **Production outage resolved (~21 h, all 41 posters dark).** Railway's 30-day trial expired by date on 2026-08-12 and Railway paused every deployment; the app itself was healthy (last build clean, healthcheck passed). Restored by subscribing to **Hobby $5/mo**. Verified live: `/api/health` -> `{"ok":true,"db":true}`, root `http=200`, `scripts/check-a5-qr.cjs` -> 41/41 HTTP 200, clean START->END log trace.
- **Removed the documented instruction that caused the outage.** `CLAUDE.md`, `STATUS.md`, `PROGRESS.md`, `DECISIONS.md` and `TODO.md` all told a future session to "cancel Hobby -> back to Free". This account is not offered a Free plan (`/workspace/plans` = Hobby/Pro only; API `hasExhaustedFreePlan: true`). All five rewritten; repo-wide grep confirms no live instruction remains.

### Changed (2026-08-13)
- **`CLAUDE.md` hard rule rewritten** - section renamed "Railway plan & usage budget". Rule 1 is now *never leave this workspace without a paid plan* and explicitly outranks the $1/mo cost budget; both outages (2026-07-05, 2026-08-12/13) are recorded; asserting Railway's plan catalog without reading `/workspace/plans` live is now forbidden. Old file backed up to the session scratchpad.
- Railway workspace: expired trial -> **Hobby $5/mo**, `sub_1U3rzECJoPsRzQsdkjfqfuC0`, billing period 2026-08-13 -> 2026-09-13. August usage $0.69 (cost was never the constraint).

### Verified, not changed (2026-08-13)
- **TM bot vote hook proven live end-to-end for the first time.** Previously only the URL was read; the push is fire-and-forget (2.5 s timeout, zero retries) so a break is invisible. Unauthenticated `POST /qr-vote` -> `401 {"error":"unauthorized"}` in 0.55 s (fails loudly); authenticated push with production's real credentials -> `200 {"ok":true}` in 0.646 s.
- **Voting works.** Real vote submitted through a poster page -> success screen; row in prod DB `2026-08-13T07:40:35 rating=5 status=NEW`; 13 real customer votes the same day. One synthetic 5/5/5 test row exists on RUBA BUHARA - discount it.

### Added (2026-07-09)
- **Admin dashboard date picker** — `/admin` now accepts `?from=&to=` (Tashkent dates) for any single day or custom range, alongside the daily/weekly/monthly/yearly presets. Pick one date or two; «Сбросить» resets; chart granularity auto-adjusts (hour/day/month by span). Pure unit-tested `resolveDashboardRange()` + `buildBuckets` `'custom'` mode (13 tests). (`app/src/app/admin/page.tsx`, `app/src/lib/dashboard-range.ts`, `app/src/lib/dashboard-trends.ts`; commit `f1749d0`) — not yet live (deploy peak-blocked at push time; ships next off-peak).

### Changed (2026-07-09)
- Nightly Railway deploy: **third off-peak schedule added** — now 20:00 / 21:30 / 23:00 UTC (was two) for cloud-side resilience against GitHub cron drift/skips; runs entirely on GitHub runners so deploys no longer depend on the local PC being on. (`.github/workflows/nightly-railway-deploy.yml`; commit `ceda193`)

### Fixed (2026-07-05 — session 9b)
- **`/api/health` was blind** — now runs a real `SELECT 1` (5s timeout): 200 `{"ok":true,"db":true}` or 503 with a sanitized error; full diagnostics go to server logs only. A data-layer outage can no longer hide behind a green health check. (`app/src/app/api/health/route.ts`)
- **Schema migrations never ran in production** — two root causes fixed: the Railway Custom Start Command override (bypassed the entrypoint) was cleared, and the 11 SQLite-dialect migrations were squashed into one PostgreSQL `0_init` with prod baselined (drift gate verified empty; metadata-only). Canary column added + dropped purely via git+deploy proves the June-9 P2022 outage class is gone. (D-051, commits `a5fbf0a`/`7c9bde3`/`a1f9493`)
- `scripts/check-a5-qr.cjs` (promoted from `tmp-check-a5-qr.cjs`) crashed when run from `app/` — paths now anchored to the script location; verified 41/41 = HTTP 200 from the deploy-and-verify skill's cwd.

### Changed (2026-07-05 — session 9b)
- `docker-entrypoint.sh`: `migrate deploy` wrapped in a 5-attempt backoff retry, fail-hard after — a bad migration blocks the deploy instead of breaking production.
- Daily report crons `0 3`/`0 4` → **`23 1`/`23 2` UTC** — odd minutes at a quiet hour drift less; report should land ~08:00–09:00 Tashkent. Dedup guard unchanged. (D-031 margin kept)
- Nightly deploy workflow: new guard step fails the deploy if a new migration touches `QRCode`/`slug` without an `ALLOW-QRCODE-REVIEWED` marker.
- Postgres-PlIz: Serverless/sleep disabled (DB always-on so wake-time migrations always have a reachable DB); web keeps sleeping.

### Removed (2026-07-05 — session 9b)
- Dead `Postgres` Railway service (never ran, $0 usage, no volume) — canvas now has only `Postgres-PlIz` + `web`.
- `scripts/tmp-extract-qr-links.cjs`, `scripts/tmp-fix-a5-placeholders.cjs`, stray `console.log(JSON.stringify(row)))` file.
- The 11 SQLite-dialect migration folders (replaced by `0_init`; historical SQL preserved in git history).

### Fixed (2026-07-05 — session 9)
- **Total production outage** — Railway Free-plan usage grant ($1.00/mo) exhausted → Railway removed the deployment; all 41 QR posters served Railway's 404 page and the daily report failed. Restored by owner subscribing Hobby ($5/mo, July stopgap) + redeploy via GitHub Actions. Verified: health 200, 41/41 frozen QR links HTTP 200, manager sync `matched:41`, daily report delivered.

### Changed (2026-07-05 — session 9)
- **Serverless (App Sleeping) enabled on the Railway `web` service** — sleeps after 10 idle minutes, wakes on request (queued, not dropped; first request after idle ~3–10 s). Purpose: cut idle RAM-hours (76% of cost) to fit under the free $1/mo grant so Hobby can be cancelled in August. (D-050)
- Project CLAUDE.md: new hard rules — **$1/mo Railway usage budget** and **frozen production domain** (`web-production-370c1.up.railway.app`, printed on 41 posters; web app never leaves Railway). (D-050)

### Fixed (2026-06-09 — session 7)
- **Production outage** — all 41 QR poster voting pages and the daily Telegram report were returning HTTP 500 (`P2022: column Store.territorialManager does not exist`). The TM column was in the schema/code but never pushed to the prod DB (prod uses `prisma db push`, not `migrate deploy`). Added the column directly (`ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "territorialManager" TEXT`); 41/41 posters back to HTTP 200, daily report restored.
- **TM report grouping** — `manager-sync` matched 0 stores (report collapsed to «Без менеджера») because the hardcoded «Менеджеры» sheet gid had been reassigned to an unrelated tab by a spreadsheet reorg. `manager-sync.ts` now resolves the tab by **title** (gid as fallback) → `matched:41`. (`89e9d2c`, D-049)

### Changed (2026-06-09 — session 7)
- Grouped report now lists **every store as its own row under its TM**, with 0-review stores shown as `0   —`, replacing the compact «Молчат: …» line. Updated unit tests. (`report-format.ts`, D-049)

### Added (2026-06-08 — session 6)
- **Territorial-manager-grouped daily & weekly reports** — global summary + 🏆 Top-5, then a block per TM (4 managers) with a reviewed-stores table, a named `Молчат:` silent-store list, and one universal «…молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.» line. (`report-format.ts`, wired in `report-builder.ts`.)
- `Store.territorialManager` column (additive Prisma migration) + `app/data/manager-assignments.json` fallback seed (41 stores).
- `app/src/lib/manager-match.ts` (pure, tested: normalize + alias, 41/41 match, duplicate-target guard) and `app/src/lib/manager-sync.ts` (reads the "Менеджеры" Google Sheet via the reused `store-manager-tasks` service account; update-only; sheet→DB).
- `POST /api/admin/sync-managers` (REPORTS_API_KEY auth) — populates `territorialManager`; runs first (best-effort) in the daily/weekly report workflows.
- `vitest` for pure-unit tests (13 tests). Spec/plan: `docs/superpowers/{specs,plans}/2026-06-06-tm-grouped-telegram-reports*`; setup: `docs/MANAGER_SYNC_SETUP.md`.

### Changed (2026-06-08 — session 6)
- Nightly deploy cron `0 2 * * *` → `0 20 * * *` + `0 23 * * *` (two off-peak attempts) — the 02:00 UTC schedule was drifting ~4.5h late into Railway's peak block and failing every deploy. (D-046)
- Daily + weekly report builders now render the grouped format via the shared formatter; monthly report unchanged.

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
- `TEAM_PASSWORD=<redacted>` added to Railway web service env vars (set via `railway variables --set`; write confirmed via `--kv` grep).

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
- `REPORTS_API_KEY` Railway variable (value: `<REPORTS_API_KEY>`).
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
