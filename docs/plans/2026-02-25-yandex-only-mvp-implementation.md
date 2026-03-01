# Yandex-Only MVP Implementation Plan

> This document supersedes the earlier multi-platform no-Google plan.
> Active scope date: 2026-02-25.

## Goal

Complete a usable MVP with Yandex-only discovery and approval-gated sync execution, including rollback and operator workflows.

## Principles

1. Single active platform: Yandex.
2. No write without explicit approval.
3. Manual candidate choice always.
4. Safe degradation when API capabilities are limited.
5. Evidence-first verification after each phase.

## Working Directory

`C:\Users\99893\Documents\Pinbox alternative\app`

## Phase 1 - Foundation

### Task 1: Initialize repository metadata

- Ensure `.gitignore` exists and is aligned with app artifacts.
- Initialize git repo if missing.
- Capture baseline commit before feature work.

### Task 2: Add unit test baseline

- Add Vitest config and test scripts.
- Add first Yandex connector sanity tests.
- Verify `npm run test`, `npm run build`, `npm run lint`.

## Phase 2 - Yandex Discovery Hardening

### Task 3: Real Yandex geocoder integration

- Replace pure mock discovery with geocoder-backed search.
- Keep mock fallback when `YANDEX_GEOCODER_API_KEY` is missing.
- Apply ranking by distance + name + phone hints.

### Task 4: Capability matrix for Yandex

- Add capability registry for Yandex operations.
- Expose admin page with mode and field capability visibility.
- Freeze active mode (`FULL_AUTO`/`SEMI_AUTO`/`MANUAL`).

## Phase 3 - Approval Pipeline

### Task 5: Per-field diff UI and queue

- Build reusable field-diff component.
- Build approvals queue page with batch approve/reject.
- Ensure approval artifacts are traceable in database.

### Task 6: Approval execution engine

- Execute approved tasks through connector pipeline.
- Record SyncJob and SyncStep states.
- Write audit logs for each execution path.

## Phase 4 - Sync Reliability

### Task 7: Failure-state model and history

- Support `FAILED`, `PARTIAL`, and `PENDING_VERIFICATION` states.
- Add sync history page for operator visibility.

### Task 8: Closed-store handling

- Add `isClosed` to profile.
- Exclude closed stores from normal sync/discovery.
- Add explicit close/reopen workflow.

## Phase 5 - Rollback and Ops

### Task 9: Rollback execution

- Implement snapshot list and restore action.
- Perform write-back through connector mode where possible.
- Mark non-reversible fields clearly.

### Task 10: Alerts

- Add Telegram alert on failed sync steps.
- Include store, action, error, and job ID in alert payload.

## Phase 6 - UX and Bulk Operations

### Task 11: Cyrillic rendering fix

- Normalize candidate text rendering and encoding handling.

### Task 12: Bulk discovery for selected stores

- Add checkbox-based selection in store list.
- Add bulk discovery endpoint and result summary.

## Phase 7 - Test Coverage

### Task 13: Connector contract tests

- Validate Yandex connector contract behaviors.
- Ensure discovery, getLocation, create/update stubs behave safely.

### Task 14: FieldDiff unit tests

- Validate parse logic for changed/added/removed fields and null input.

### Task 15: Regression verification

- Run `npm run test`.
- Run `npm run build`.
- Run `npm run lint`.
- Record final evidence in progress docs.

## Definition of Done

1. Yandex discovery is real-capable with fallback.
2. Approval queue and execution are operational.
3. Sync history and failure states are visible.
4. Rollback is usable for supported fields.
5. Operator can run selected-store workflow without engineering help.

## Required Environment Variables

- `YANDEX_GEOCODER_API_KEY`
- `TELEGRAM_BOT_TOKEN` (optional, for alerts)
- `TELEGRAM_ADMIN_CHAT_ID` (optional, for alerts)

## Explicitly Out of Scope

1. Google Maps integration.
2. 2GIS integration.
3. Reapplication tracks for non-Yandex platforms.
