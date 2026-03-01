# Final Plan: Yandex-Only Unified Store Card Sync

Date: 2026-02-25

## 0. Implementation Checkpoint

1. Core schema and discovery/linking UI scaffold are implemented.
2. Yandex is now the only active integration platform.
3. Build passes; approval execution and rollback hardening remain.

## 1. Objective

Deliver one central store card workflow in dashboard so each store can be discovered, matched, reviewed, approved, and synced to Yandex with rollback support.

## 2. Non-Negotiable Rules

1. Yandex is the only active platform in scope.
2. Matching radius is `30m`.
3. Candidate selection is always manual.
4. Every write requires explicit web approval.
5. Missing listing can be created only after explicit confirmation.
6. Closed stores are excluded from regular sync jobs.
7. Russian language is primary.

## 3. Sync Data Scope

Fields managed in master store card:

1. `name`
2. `address`
3. `lat/lng`
4. `phone`
5. `hours`
6. `description`
7. `photos`
8. `website`
9. `category`

## 4. Architecture

### 4.1 Core Components

1. Master Store Card (dashboard data source).
2. Yandex Connector.
3. Discovery Engine.
4. Diff and Approval Engine.
5. Sync Executor.
6. Rollback Engine.
7. Audit Trail.

### 4.2 Capability Modes

1. `FULL_AUTO`: search/read/create/update supported.
2. `SEMI_AUTO`: search/read supported, write is operator-assisted.
3. `MANUAL`: no API write, system generates operator instructions and links.

## 5. End-to-End Flow

1. Operator edits store card.
2. System runs Yandex discovery.
3. System builds candidate list within 30m and helper signals.
4. Operator manually selects candidate.
5. System renders per-field diff.
6. Operator approves or rejects each action.
7. Sync job executes approved actions.
8. Results are written to audit log and sync history.
9. Rollback is available where reversible.

## 6. Data Model Target

1. `store_master_profile`
2. `platform_location_link`
3. `match_candidate`
4. `approval_task`
5. `sync_job` and `sync_step`
6. `change_snapshot`
7. `category_mapping`
8. `store_photo` and `platform_photo_ref`

## 7. Rollout Plan

### Phase 0: Yandex Access and Capability Freeze

1. Confirm Yandex account access model.
2. Fill capability matrix by field.
3. Freeze connector behavior (FULL_AUTO/SEMI_AUTO/MANUAL).

Exit criteria:
1. Capability matrix approved.
2. Credentials path validated.

### Phase 1: Discovery and Matching Hardening

1. Complete real discovery path with safe fallback.
2. Validate matching quality on baseline store set.
3. Keep always-manual candidate selection.

Exit criteria:
1. Linking support >=90% correct decisions on baseline.
2. No auto-linking.

### Phase 2: Diff and Approval

1. Build per-field diff view.
2. Add approval states (`READY`, `APPROVED`, `REJECTED`, `SKIPPED`).
3. Add batch approval for selected stores.

Exit criteria:
1. Zero writes without approval.
2. Batch approval works reliably.

### Phase 3: Sync Execution

1. Implement Yandex update-existing flow.
2. Add queue, retry, and failure states.
3. Add selected-store sync controls.

Exit criteria:
1. Stable updates on pilot stores.
2. Failure and retry behavior visible and testable.

### Phase 4: Creation and Close Workflows

1. Implement explicit listing creation confirmation flow.
2. Implement close/reopen workflow.
3. Add verification states.

Exit criteria:
1. Missing-listing flow works end-to-end.
2. Closed-store workflow is operational.

### Phase 5: Rollback and Operations

1. Implement read-before-write snapshots.
2. Implement rollback command with availability checks.
3. Add monitoring and alerting.

Exit criteria:
1. Text-field rollback works in pilot.
2. Non-reversible fields are labeled clearly.

## 8. Onboarding Checklist (Yandex)

1. Confirm account ownership model for pilot stores.
2. Confirm supported operations (read/create/update/close).
3. Confirm auth model and limits.
4. Run test calls and document moderation timing.

## 9. Success Metrics

1. Matching workflow supports >=90% correct link decisions on baseline.
2. 100% of writes are approval-gated.
3. Sync failure rate <5% (excluding platform outages).
4. Rollback availability shown correctly per field.
5. Operator runs daily sync without engineering support.

## 10. Archived Tracks

- Google integration track
- 2GIS integration track
