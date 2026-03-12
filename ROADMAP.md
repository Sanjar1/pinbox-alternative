# Roadmap

## Current Milestone: M3 - QR Feedback Pilot Launch Readiness

**Goal:** Launch the customer QR/private-feedback flow while public map coverage is still being completed incrementally.

**Key tasks:**
- Finalize public QR page UX and text quality
- Generate branded printable QR posters for launch stores
- Keep private feedback operational even for disconnected stores
- Connect missing Google/Yandex/2GIS review links incrementally after launch
- Continue Google batch upload/verification in parallel where useful

## Completed Milestones

- **M0 - Product Definition** (2026-02-06)
  Scope, decisions, compliance stance, delivery model defined.

- **M1 - Security Foundation** (2026-02-07)
  Auth/session, tenant isolation, input validation, audit logging.

- **M2.0 - Unified Sync Scaffold** (2026-02-10)
  Data model migrated, discovery UI working, connector interface defined.

- **M2.1 - Scaffold Verification** (2026-02-10)
  Independent verification of implementation, lint/build stabilization, store import from Telegram.

- **M2.2 - No-Google Pivot** (2026-02-17)
  Strategy shifted away from Google dependency.

- **M2.3 - Single-Platform Focus** (2026-02-25)
  Active scope narrowed from multi-platform to Yandex-only delivery.

- **M2.4 - QR Feedback Pilot Hardening** (2026-03-08)
  Public feedback flow upgraded, anti-abuse checks added, branded poster generation started.

## Upcoming Milestones

- **M4 - Map Link Completion**
  Connect remaining stores to public review destinations without blocking QR launch.

- **M5 - Diff + Approval Pipeline (Yandex)**
  Build per-field diff UI and approval execution flow.

- **M6 - Yandex Sync Execution**
  Controlled-account update flow, retry/backoff, failure state handling.

- **M7 - Federated Yandex Operations**
  For non-controlled stores, generate operator tasks and verification checklists.

- **M8 - Rollback + Operations Hardening**
  Snapshot-based rollback, alerts, dead-letter handling.

- **M9 - Pilot Expansion**
  Expand operator-run pilot after QR launch and public link coverage stabilize.

## Deferred/Archived Tracks

- Google integration track (archived)
- 2GIS integration track (archived)
