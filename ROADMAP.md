# Roadmap

## Current Milestone: M3 - Yandex-only MVP Execution

**Goal:** Ship a usable MVP focused only on Yandex store-card operations.

**Key tasks:**
- Build accurate store-to-owner account map for Yandex
- Finalize Yandex-only operating model for fragmented ownership
- Freeze Yandex connector mode (SEMI_AUTO or MANUAL per capability)
- Implement Yandex approval execution baseline
- Implement rollback baseline and operator workflow

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

## Upcoming Milestones

- **M4 - Diff + Approval Pipeline (Yandex)**
  Build per-field diff UI and approval execution flow.

- **M5 - Yandex Sync Execution**
  Controlled-account update flow, retry/backoff, failure state handling.

- **M6 - Federated Yandex Operations**
  For non-controlled stores, generate operator tasks and verification checklists.

- **M7 - Rollback + Operations Hardening**
  Snapshot-based rollback, alerts, dead-letter handling.

- **M8 - Pilot**
  Operator-run pilot on the baseline store set.

## Deferred/Archived Tracks

- Google integration track (archived)
- 2GIS integration track (archived)
