# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added (2026-02-28)
- `scripts/sync_yandex_tracking_from_telegram.py` to map Telegram tracking JSON into Excel tracking columns.
- `data/stores_audit_tracking_2026-02-28.xlsx` generated as a tracking workbook copy with Yandex status columns.
- `data/yandex_tracking_sync_summary_2026-02-28.json` generated for machine-readable progress counts.

### Added (2026-02-26)
- Bulk store name update: all 33 stores renamed to "Сырная Лавка" (capital Л) via automated browser API.
- Shared access: dmigos95@gmail.com added as Представитель to all 24 owned stores.
- Store audit Excel: `data/stores_audit.xlsx` with all 33 stores (name, address, hours, map link, phone).
- `scripts/generate_stores_excel.py` for reproducible Excel generation.
- Yandex Business API documented in `docs/YANDEX_API_CHEATSHEET.md` (endpoints, CSRF flow, working payload format).
- Yandex Business account created (Sanjar Sanjar, ID: 1681626717).
- 33 of 36 Сырная лавка stores claimed and verified in Yandex Business.

### Changed
- Strategy narrowed on 2026-02-25 to Yandex-only active platform scope.
- Documentation set refreshed for single-platform execution.
- Google and 2GIS tracks moved to archived/deferred context.

### Added (2026-02-25)
- Yandex-only roadmap and acceptance criteria updates.
- Yandex-focused onboarding and request templates.

### Known Issues
- Approval execution and rollback are not yet fully operational.
- Telegram completion status is inconsistent across notes; tracker JSON currently reports `3/28` complete and needs reconciliation.
- `data/stores_audit.xlsx` is locked for in-place writing in the current environment.
- Workspace has no active git repository metadata for commit-based tracking.

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
