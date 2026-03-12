# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- CSV import support for lat/lng coordinates
- "Create & Update" mode for CSV import (upsert by store name)
- Lat/lng extraction script for Yandex data (`scripts/extract-yandex-latlng.mjs`)
- Bulk discovery action ("Run Discovery for All" button on stores page)
- Lat/lng status display on stores listing
- Better error messages when discovery blocked by missing coordinates
- Cyrillic store names in Yandex mock connector for proper testing

### Changed
- Updated `CsvStoreRow` type to include optional lat/lng fields
- Refactored stores page to client component with discovery controls
- Discovery error handling improved with specific messages
- Import form now shows both import modes to user

### Fixed
- Encoding artifact handling verified correct (no actual bugs found)
- Discovery UI properly renders Cyrillic text (UTF-8 throughout stack)

## [0.1.0] - 2026-02-28

### Added
- Initial MVP release
- Secure login with hashed passwords and server-side sessions
- Tenant-safe store access controls
- Store CRUD operations with address/phone/hours
- Public QR code feedback collection
- CSV import for bulk store creation
- Feedback notifications (Telegram/Resend)
- Audit logging for all key actions
- Google Business Profile connector with real OAuth2 integration
- Yandex and 2GIS mock connectors
- Discovery system for finding stores on platforms
- Admin dashboard with store overview
- Candidate linking UI for platform connections

### Technical Details
- Next.js 16.1.6 with App Router
- Prisma 5.22.0 with SQLite database
- React 19.2.3 with hooks
- TailwindCSS 4 for styling
- Server-side sessions for authentication
- Multi-tenant architecture with tenant isolation
- Connector interface for platform abstraction
- CSV parsing with validation

---

## Release History

### v0.1.0 - Initial Release (2026-02-28)
- MVP functionality for store profile management
- Focused on Yandex Business Profiles
- Google connector with real API integration
- Basic discovery and linking system
