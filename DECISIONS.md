# Decisions Log

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
- Decision: Use `POST /api/admin/repair-a5-links` (Bearer auth) to create Глоток Юнусабад and Глоток Панельный stores and clear test feedback. The endpoint is idempotent — safe to re-run.
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
