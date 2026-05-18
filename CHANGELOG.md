# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
