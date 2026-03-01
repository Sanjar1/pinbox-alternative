# Overview

## Product

Build a multi-location platform for chains to:

1. Maintain a unified store card for Yandex Maps.
2. Run approval-gated sync of store data to Yandex listings.
3. Generate QR links for in-store feedback and compliant review flow.
4. Collect private feedback and track quality metrics by store.

## Current Strategic Direction

1. Yandex-only active platform scope.
2. Compliant-only review flow (no rating gating).
3. Manual approval required before any external write.
4. 30m radius and always-manual candidate choice for linking.
5. Missing listing can be created only after explicit confirmation.

## Batch Operations Policy

1. For bulk changes in Yandex, 2GIS, or Google, use official or observed API endpoints first.
2. API-first is mandatory for speed, repeatability, and lower operator effort.
3. Browser UI automation is fallback only when API coverage is missing or blocked.

## Store Card Sync Scope

Master fields:

1. `name`
2. `address`
3. `lat/lng`
4. `phone`
5. `hours`
6. `description`
7. `photos`
8. `website`
9. `category`

## Current Build State

Already implemented:

1. Core app, auth/session, store CRUD, QR flow, feedback capture.
2. CSV import and Telegram-based store import.
3. Unified master profile model and store-level profile editor.
4. Discovery dashboard and manual candidate-linking workflow.
5. Connector architecture with Yandex as active execution target.
6. Baseline sync schema for approvals/jobs/snapshots.

Implementation maturity note:

1. Discovery/linking and data scaffold are working.
2. Approval queue execution and rollback flow remain partial.
3. Production-grade connector behavior and operator pipeline are still in progress.

## Target Users

1. Small and medium chains (5-200 locations).
2. Ops managers responsible for branch quality and profile accuracy.
3. Marketing managers tracking listing consistency and review funnels.
