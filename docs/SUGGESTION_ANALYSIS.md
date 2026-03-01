# Suggestion Analysis (Current Direction)

Date: 2026-02-25

## Locked Requirements

1. Yandex is the only active platform in scope.
2. Sync fields remain: `name`, `address`, `lat/lng`, `phone`, `hours`, `description`, `photos`, `website`, `category`.
3. Manual confirmation is required for every external write.
4. Missing listing creation requires explicit confirmation.
5. Confirmation channel is the web dashboard.
6. Matching priority is map pin with 30m radius.
7. Candidate selection is always manual.
8. Scope includes selected-store sync, rollback, and auditability.
9. Language priority is Russian.

## What Was Accepted

1. Capability-first connector design.
2. Discovery-first rollout before write automation.
3. Explicit diff and approval stages.
4. Snapshot-based rollback where reversible.
5. Measurable rollout gates and acceptance metrics.

## What Changed on 2026-02-25

1. Active scope reduced from multi-platform to Yandex-only.
2. Google and 2GIS tracks moved to archived/deferred context.
3. All active planning now optimizes for delivery speed and operational reliability on one platform.

## Current Direction

1. Build a Yandex-only, approval-gated, 30m-radius sync system.
2. No write happens without dashboard confirmation.
3. Missing listing creation is explicit and auditable.
4. Implement reliability features first: queueing, retry, rollback, alerts, and operator SOP.
