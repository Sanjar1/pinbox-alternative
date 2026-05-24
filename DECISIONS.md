# Decisions Log

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
