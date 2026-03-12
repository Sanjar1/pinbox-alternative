# Changelog

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added (2026-03-11)
- 2-step QR voting flow: vote saved to DB on submit, then platform links or comment form shown
- Private comment form for low-score votes (avg < 4) with send button
- Platform buttons with SVG brand icons (Google, Yandex, 2GIS)
- Railway deployment documentation: `docs/RAILWAY_DEPLOY.md`

### Changed (2026-03-11)
- QR voting questions updated to final approved short versions (UZ + RU)
- QR poster: all-Russian text, UPPERCASE store name, URL removed, "Как вам у нас?" on one line
- Platform button colors corrected: Google #1A73E8, Yandex #FC3F1D, 2GIS #1BA53E
- Store name UPPERCASE on voting page (`page.tsx`) and poster generator
- Yandex link for Авиасозлар updated to real org card (was broken search query)

### Fixed (2026-03-11)
- Platform links were shown before vote was saved — fixed by saving vote first then showing links
- Mixed-language text in QR poster (was Russian + Latin Uzbek + Cyrillic Uzbek)
- URL breaking mid-number in poster footer

### Added (2026-03-08)
- QR feedback hardening in `app`:
  - 3-question public feedback flow
  - Uzbek Cyrillic default + Russian language switch
  - anti-abuse feedback protection with device/IP checks
- `app/scripts/generate-qr-poster.mjs` to generate branded QR poster HTML + PNG assets
- `app/test-output/qr-poster-523da2.html` and `app/test-output/qr-poster-523da2.png` as pilot poster outputs

### Changed (2026-03-08)
- Launch readiness policy clarified: stores without Google/Yandex listings do not block QR/private-feedback launch
- QR poster restyled toward orange/white brand colors with larger QR dominance

### Added (2026-03-08)
- Google Business Profile bulk import workflow documented and tested:
  - `data/Google-Business-Profile-Import-v4.xlsx` - geocoded version with Nominatim API lat/lng
  - `data/Google-Business-Profile-Import-v5.csv` - first batch (10 stores) with proper admin areas - uploaded
  - `data/Google-Business-Profile-Import-v6.csv` - second batch (14 stores) ready for upload
  - `data/Google-Business-Profile-Import-v6.xlsx` - Excel version of batch 2, formatted and ready (NEW)
  - `data/details-Ungrouped locations-20260308-121947-0cc4fb6a0b2cbf2598e2dcc7d3b5539c.csv` - downloaded from Google Business showing current status
- `scripts/geocode_v4.py` - Python geocoding script using Nominatim API + fixed coordinates for stores without results

### Changed (2026-03-08)
- Google Business import strategy: split into 2 batches due to Google's ~10 store per-session rate limit
- Admin area validation: blank for Tashkent city stores, regional names (Toshkent Viloyati, etc.) for outlying areas

### In Progress (2026-03-08)
- Batch 1 verification: 4/10 verified, 6/10 in "get verification" status
- Batch 2 upload: waiting for quota reset (24-48 hours)

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
