# Decisions Log

## D-048: Reports Grouped by Territorial Manager, Synced From the Google Sheet

- Date: 2026-06-08
- Decision: The daily & weekly Telegram reports group stores by **territorial manager** (4 TMs). The store→TM mapping is the single source of truth in the "Менеджеры" tab of the manager Google Sheet, synced into a new nullable `Store.territorialManager` column by `POST /api/admin/sync-managers` (run as the first, `continue-on-error` step of the report workflows). Reads the sheet via the **reused `store-manager-tasks` service account** (it already had access) using env `GOOGLE_SERVICE_ACCOUNT_JSON`. Sync is **update-only** (never creates a store → never mints a QR slug). Fallback when the sheet is unreachable: committed `app/data/manager-assignments.json`.
- Reason: managers wanted accountability per region without manual upkeep; a sheet edit must flow to the next report with no redeploy. Reusing the existing SA avoided new Google Cloud setup. Name matching uses normalize + a small alias table, hard-gated to 41/41 with a duplicate-target guard (the Глоток-Юнусабад/Юнусабад collision is the cautionary case). Pure logic (`manager-match.ts`, `report-format.ts`) is unit-tested off the DB.
- Impact: `app/prisma/schema.prisma` (+migration), `manager-match.ts`, `manager-sync.ts`, `report-format.ts`, `report-builder.ts`, `sync-managers/route.ts`, both report workflows. Spec/plan in `docs/superpowers/{specs,plans}/2026-06-06-*`; setup in `docs/MANAGER_SYNC_SETUP.md`.

## D-047: Unassigned Stores Count in Totals but Get No Manager Block

- Date: 2026-06-08
- Decision: Stores with no TM in the sheet (currently Катортол, Чилонзор Торговый) are counted in the global summary + Top-5 (denominator stays **43**) but are NOT given their own block or named in any TM section. A footer lists them only if they actually received reviews.
- Reason: never silently drop a real review from the totals (honest math), while keeping the per-manager view clean. The 41-vs-43 gap is a quiet nudge to assign them in the sheet.
- Impact: `report-format.ts` grouping logic; covered by the 5-June unit fixture.

## D-046: Nightly Deploy Moved to 20:00 + 23:00 UTC (supersedes D-045)

- Date: 2026-06-08
- Decision: The GitHub Actions nightly deploy cron is now **`0 20 * * *` plus `0 23 * * *`** (two off-peak attempts), replacing the single `0 2 * * *` from D-045.
- Reason: D-045's 02:00 UTC was meant to be off-peak, but GitHub fired the schedule ~4.5h late (~06:40 UTC), landing inside Railway's free-tier peak block (06:00–18:00 UTC summer) → the deploy was rejected for days and prod kept serving stale, pre-merge code. 20:00 UTC sits at the very start of off-peak with ~10h of GitHub-drift tolerance before peak resumes, and still lands before the 03:00 UTC report; 23:00 UTC is an independent backup in case a run is skipped.
- Impact: `.github/workflows/nightly-railway-deploy.yml` (`8044eb9`, `e403343`). Lesson recorded in MISTAKES. On the free tier there is no way to deploy during peak — only off-peak or a paid plan removes the block.

## D-045: Nightly Deploy Rescheduled to 02:00 UTC (07:00 Tashkent)

- Date: 2026-05-31
- Decision: The GitHub Actions nightly deploy cron is `0 2 * * *` (02:00 UTC = 07:00 Asia/Tashkent), replacing the earlier 18:05 UTC.
- Reason: 02:00 UTC is off-peak in EVERY season (03:00/04:00 Amsterdam, well before the 08:00 peak), fixing the winter risk of the old 18:05 UTC time (which was inside peak in winter). It also runs ~1h before the 03:00 UTC daily Telegram report, so the morning report always runs on freshly-deployed code.
- Impact: `.github/workflows/nightly-railway-deploy.yml`. Verified scheduled auto-deploy works (runs #5/#6 were "Scheduled" + succeeded). Added a trigger-context log step (event/time/SHA), with context passed via `env` to avoid GitHub Actions script injection.

## D-044: Committed Code Is the Single Source of Truth (committed == deployed)

- Date: 2026-05-31
- Decision: All code that should run in production must be committed. We no longer rely on deploying uncommitted working-tree changes.
- Reason: The old local `railway up` uploaded the working directory, so several never-committed files were silently live in production (daily report detailed format, vote-count filter, analytics routes, connectors, etc.). The cloud deploy builds only committed code, so switching to it reverted all of them — surfacing as the daily-report regression. Committing everything (commits `b70450f`, `9a53319`, `a14dbf5`, `30659e9`) makes committed == deployed and prevents silent drift.
- Impact: Cloud/phone deploys are now trustworthy. Future change: commit before expecting it in production; never depend on working-tree-only state.

## D-043: Cloud Deploy Uploads From the Repo Root (Railway Root Directory = "app")

- Date: 2026-05-31
- Decision: The GitHub Actions deploy runs `railway up --service web --ci` from the **repo root**, not from `app/`.
- Reason: The Railway `web` service has Root Directory = `app`, so it expects the uploaded snapshot to contain an `app/` subdirectory and cd's into it for the build context. Uploading from `app/` produced a snapshot with no `app/` subdir → build failed "lstat .../snapshot-target-unpack/app: no such file or directory". The Dockerfile's `COPY` paths are app-relative, so the build context must resolve to `app/`. (The local Windows task historically worked from `app/` only because the CLI link points at the repo-root path; the cloud runner has no such link, so explicit repo-root upload is required.)
- Impact: `.github/workflows/nightly-railway-deploy.yml` has no `working-directory: app`. `app/railway.json` also sets `dockerfilePath: "Dockerfile"`.

## D-042: Nightly Deploy Moves to GitHub Actions (Cloud) as Primary; Local Windows Task Becomes a Hardened Backup

- Date: 2026-05-29
- Decision: The reliable nightly Railway deploy now runs in GitHub Actions (`.github/workflows/nightly-railway-deploy.yml`, `railway up --service web --ci` at 18:05 UTC), authenticated by a production-scoped Railway project token in the `RAILWAY_TOKEN` repo secret. The local `Pinbox-Railway-Night-Deploy` Windows task is kept as a backup but hardened (retry + Telegram failure alert; runs on battery; `WakeToRun=true`).
- Reason: The local `railway up` had been crashing at "Indexing…" (Rust OOM) since 2026-05-24, silently, with no alert — leaving production ~6 days stale. A cloud runner has ample memory and no dependence on the laptop being awake/plugged-in, removing both failure modes. GitHub Actions infra already exists here (daily/weekly/monthly report crons).
- Impact: New secret `RAILWAY_TOKEN` must exist for the workflow to run (added 2026-05-29). Deploys still must fire off-peak (free-tier EU West block 08:00–20:00 Amsterdam) — 18:05 UTC = 23:05 Tashkent clears it in summer; revisit for winter DST (bump to 19:05 UTC). The local task no longer silently fails: it alerts Telegram if it can't upload.
- Trade-off: Two deploy mechanisms running nightly (cloud + local) could both fire — harmless (Railway just builds the same commit twice at worst). Token is a long-lived credential stored in GitHub secrets; rotate if exposed.

## D-041: `TEAM_PASSWORD` Env Var Is the Source of Truth for Auth; Singleton team@kaas.local User

- Date: 2026-05-24
- Decision: The shared team password is stored as `TEAM_PASSWORD` Railway env var only, not in the `User.password` DB column. On first successful login, the server action lazy-creates a singleton `team@kaas.local` OWNER user (under the first existing OWNER tenant, or creates a "KAAS" tenant if none exists). All team members share this one DB user.
- Reason: Changing the password requires editing one Railway env var and restarting the service — zero DB migration, zero code deployment. Simpler lifecycle than a DB-stored hashed password.
- Impact: `app/src/app/login/actions.ts` reads `process.env.TEAM_PASSWORD`. Audit log entries will all show `team@kaas.local` regardless of which team member logged in — individual identity cannot be traced from audit logs. Accepted trade-off for this trust model.
- Trade-off: Shared identity. No per-member traceability. Accepted by the product owner.

## D-040: Auth Simplified to Single Shared Password; Email Login Removed

- Date: 2026-05-24
- Decision: The admin dashboard login was simplified to a single password field ("Пароль") — email field removed. Password value: `12345` stored as `TEAM_PASSWORD` env var in Railway.
- Reason: Trusted local team. Simpler UX, fewer login frictions. Owner explicitly chose this after two rounds of security pushback from the engineering side (offered safer password and IP-allowlist alternatives; owner overrode both).
- Tradeoffs accepted: `12345` is trivially brute-forceable; dashboard is internet-facing at `web-production-370c1.up.railway.app/admin`. Risk mitigation: change password anytime by editing `TEAM_PASSWORD` in Railway dashboard and restarting the service — no code change needed. Rate-limiting `/login` is tracked as a medium-priority TODO.
- Impact: `app/src/app/login/login-form.tsx` and `app/src/app/login/actions.ts` fully rewritten. Any existing email-based admin users (created via old flow) are locked out — only the `team@kaas.local` singleton can log in after this deploy.

## D-039: Vote Double-Counting Fix Uses Read-Side Filter, Not Write-Side Dedup or Migration

- Date: 2026-05-24
- Decision: The dashboard/report vote double-counting issue (two Feedback rows per customer visit) is fixed via a read-side filter in `app/src/lib/feedback-filters.ts`, not by removing duplicate writes at source or migrating the schema.
- Reason: Three options were considered: (A) write-time dedup, (B) schema migration + backfill, (C) read-side filter. Opus subagent (debating with Sonnet) chose (C) because: (1) zero risk to production DB tied to frozen QR posters; (2) corrects historical counts immediately without any migration; (3) simple and reversible; (4) fixes both the dashboard and daily/weekly/monthly reports in one place. Options (A) and (B) had higher blast radius (touches the rate-limiter in `actions.ts`, requires downtime/backfill).
- Impact: `app/src/lib/feedback-filters.ts` is now the canonical place that distinguishes vote rows from comment rows. Dashboard, daily report, weekly report, and monthly report all import `VOTE_ROW_FILTER`. The `-comment` deviceId append pattern still exists in the write path but is now correctly hidden from all counts. This is acceptable until a future refactor switches to write-time dedup or adds a `kind` column.
- Trade-off: The two-rows-per-visit pattern remains a design smell (see lesson in MISTAKES.md). Revisit for a cleaner solution (write-side dedup or schema) if the write pattern becomes a blocker elsewhere.

## D-038: Don't Fix `-comment` deviceId Double-Counting Bug This Session

- Date: 2026-05-24
- Decision: The pre-existing bug where `deviceId + "-comment"` creates a second Feedback DB row per customer visit is tracked but not fixed today.
- Reason: Scope discipline. Today's task was the alert template rewrite. The fix touches the rate-limiter in `actions.ts` which has higher blast radius. The bug predates today's work and doesn't affect the new alert template.
- Impact: Analytics may over-count low-rating sessions. The 35-day anti-abuse check is bypassed for comment-only submissions. Fix tracked in TODO.

## D-037: Late Comment (>30s After Vote) Gets a Follow-Up Message, Not an Edit

- Date: 2026-05-24
- Decision: If a customer types a free-text comment more than 30 seconds after their vote (i.e., after the debounce timer has already fired and sent the vote-only alert), the comment is sent as a separate short follow-up message via `buildFollowUpCommentMessage`. The original alert is NOT edited.
- Reason: Simpler implementation — no need to track Telegram `message_id` for 5+ minutes. Managers see the comment immediately in context. Tradeoff: late-comment messages appear visually detached from the original alert, but current visit volume makes this acceptable.
- Impact: `app/src/lib/notifications.ts` has `buildFollowUpCommentMessage`. Reconsider (switch to edit-original) if the managers group becomes noisy.

## D-036: Brand Display Name in Customer-Facing Alerts Is «KAAS Сырная Лавка»

- Date: 2026-05-24
- Decision: The string «KAAS Сырная Лавка» (with «» quotes) is used as the brand name in all new Telegram alert templates and Telegram report messages.
- Reason: Owner requested the "KAAS" prefix to differentiate from competitors who also use "Сырная Лавка". The repo-wide brand name change is NOT in scope — only alert/notification messages use the new form for now.
- Impact: `app/src/lib/notifications.ts` hardcodes this spelling. Any new Telegram copy must use this form. Revisit when a broader brand rename is planned.

## D-035: Power BI Analyst Access Goes Through Railway Public TCP + bi_readonly Role

- Date: 2026-05-21
- Decision: External BI analyst access to production Postgres uses the Railway public TCP proxy (`metro.proxy.rlwy.net:36355`) and a dedicated `bi_readonly` Postgres role with SELECT-only privileges on the `public` schema. No separate read replica or new HTTP API surface was created.
- Reason: Free-tier compatible and requires zero additional infrastructure. Power BI connects natively to Postgres, so no middleware is needed. Analyst gets direct SQL access enabling arbitrary joins and aggregations that an HTTP API would have to re-implement endpoint by endpoint. Revocation is a single SQL statement (`ALTER ROLE bi_readonly WITH NOLOGIN` or `DROP ROLE bi_readonly`), making access management simple.
- Impact: `metro.proxy.rlwy.net:36355` is the production Postgres public endpoint. `bi_readonly` role exists and is verified in production. Rotation/revocation procedure is documented in `docs/ANALYST_POWER_BI_MESSAGE.md`. Password is held by owner only — not committed to any file in the repo.

## D-034: Cron For Daily Report Runs From GitHub Actions, Not Railway

- Date: 2026-05-21
- Decision: The daily Telegram report fires via a GitHub Actions scheduled workflow (`.github/workflows/daily-telegram-report.yml`), not via Railway cron.
- Reason: Railway free plan blocks new scheduled services ("Free plan resource provision limit exceeded"). GitHub Actions is free, sits next to the code, and includes manual-run + failure-email out of the box.
- Impact: `REPORTS_API_KEY` GitHub secret added; workflow hits `POST /api/reports/daily` at 03:00 UTC = 08:00 Tashkent daily. Run #1 verified green on 2026-05-21.

## D-033: QR Slugs Are Frozen After 2026-05-17 Print Run

- Date: 2026-05-21
- Decision: `QRCode.slug` is immutable in production. 41 A5 posters have been printed and distributed; any slug change breaks the physical QR code on a wall in a real store.
- Reason: Reprinting and redistributing 41 posters costs hours of work and store visits. Trust-based discipline isn't enough — past sessions have shown silent slug changes via repair scripts.
- Impact: `app/src/lib/db.ts` extends Prisma to throw on any `update`/`updateMany`/`upsert` that includes `slug` in the write payload. Backup of the frozen mapping is committed at `data/qr-links-frozen-2026-05-21.json`. Full rule: `docs/QR_SLUG_PROTECTION.md`.

## D-032: Vote Cooldown Is 35 Days Per Device Per Store

- Date: 2026-05-21
- Decision: A customer device can submit one vote per store once every 35 days.
- Reason: The previous 7-day window was too short for the desired feedback quality and repeat-vote control.
- Impact: `app/src/app/[slug]/actions.ts` now checks the last 35 days and shows a 35-day message.

## D-031: Morning Daily Report Uses Yesterday's Scores

- Date: 2026-05-21
- Decision: The daily Telegram report sent at 08:00 Tashkent must summarize the previous full Tashkent day, not the current partial day.
- Reason: Morning reporting should cover completed yesterday performance and avoid partial same-day counts.
- Impact: `getDailyRange()` now returns yesterday 00:00-24:00 Tashkent.

## D-030: Railway Function Scheduler Is Blocked On Current Resource Plan

- Date: 2026-05-21
- Decision: Do not claim the 08:00 Telegram report is automated until a scheduler is actually provisioned and verified.
- Reason: Creating Railway Function `daily-report-cron` failed with `Free plan resource provision limit exceeded`.
- Impact: Manual report sending works; automatic schedule requires Railway resource upgrade or external scheduler.
## D-029: Railway CLI Deploy Must Run from `app/` Subdirectory

- Date: 2026-05-18
- Decision: Always run `railway up` from within the `app/` directory, never from repo root.
- Reason: The service has `rootDirectory: app` in Railway settings. Running from repo root uploads the full snapshot with the root `railway.json`, which references `dockerfilePath: app/Dockerfile` but the snapshot context resolves incorrectly. From inside `app/`, Railway picks up `app/railway.json` (no explicit dockerfilePath) and finds the Dockerfile at snapshot root automatically.
- Impact: Manual CLI deploys are reliable. Documented in RAILWAY_CHEATSHEET.md.

## D-028: Soft-Delete Stores Instead of Hard-Delete (archivedAt)

- Date: 2026-05-18
- Decision: Stores are soft-deleted via `archivedAt DateTime?` field; never hard-deleted.
- Reason: Printed QR codes on physical posters must never return 404. If a store closes, its voting page shows a "store closed" message instead of a missing page.
- Impact: `Store.archivedAt` migration added. Voting page checks for archived state and shows graceful message.

## D-027: Repair Endpoint Is the Authoritative Way to Fix Glotok DB State

- Date: 2026-05-18
- Decision: Use `POST /api/admin/repair-a5-links` (Bearer auth) to create ������ �������� and ������ ��������� stores and clear test feedback. The endpoint is idempotent � safe to re-run.
- Reason: DB is on Railway's internal network; direct SQL access from local requires railway ssh with complex quoting. An HTTP endpoint is safer and auditable.
- Impact: Test votes cleared (14 removed). Both Glotok stores now have own DB records and unique slugs.

## D-026: Daily Report Ranking Uses Votes First, Average Second

- Date: 2026-05-17
- Decision: Sort store rows in daily/weekly/monthly Telegram reports by vote count descending, then by average score descending.
- Reason: A higher sample size is more reliable than a perfect score from a single vote.
- Impact: Report prioritization matches operational reality and owner preference.

## D-025: DB-First Pivot, No Active Map Integrations

- Date: 2026-05-17
- Decision: Remove Yandex, Google, and 2GIS integrations from active product scope.
- Reason: Team approved a direction where all operational data and marks are managed in our own database.
- Impact: Connector and map-link coverage work becomes historical/archived; active roadmap and specs now focus on internal DB + QR operations.

## D-024: Drive Map-Link Cleanup from Coverage Inventory (Historical)

- Date: 2026-03-15
- Decision: Use a generated per-store coverage inventory (`docs/store-link-coverage.csv`) as task source for missing links.
- Reason: At that stage map-link closure was active work.
- Impact: Historical only after D-025.

## D-023: Deploy to Railway (PostgreSQL)

- Date: 2026-03-11
- Decision: Deploy on Railway with PostgreSQL.
- Reason: Persistent DB is required for stable production data.
- Impact: Redeploy is safe for QR continuity when DB is preserved and destructive reseed/reset is avoided.

## D-022: Vote Saved Before Showing Platform Links

- Date: 2026-03-11
- Decision: Save vote first, then show next actions.
- Reason: Prevent data loss from early exit.
- Impact: Feedback capture reliability improved.
