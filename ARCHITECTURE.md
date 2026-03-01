# Architecture

## Overview

Pinbox Alternative is a multi-location store management platform focused on Yandex Maps synchronization. It uses an approval-gated sync model where every external write requires explicit operator confirmation.

## System Components

```
+-----------------------------------------------------+
|                     Frontend                        |
|   Next.js 16 Admin Dashboard + Public Pages         |
|   - /admin/stores              Store CRUD + import  |
|   - /admin/stores/[id]         Store edit + sync    |
|   - /admin/stores/[id]/discovery Matching UI        |
|   - /[slug]                    Public QR page        |
+-----------------------------+-----------------------+
                              |
+-----------------------------v-----------------------+
|                    Backend (API)                    |
|   Next.js Server Actions + API Routes               |
|   - Auth/Session layer (token-based)                |
|   - Tenant isolation checks                          |
|   - Yandex discovery engine                          |
|   - Approval engine (partially implemented)          |
|   - Sync executor (partially implemented)            |
|   - Rollback service (scaffold/partial)             |
+-----------------------------+-----------------------+
                              |
+-----------------------------v-----------------------+
|                  Platform Connector                  |
|   - YandexConnector (active integration target)      |
|   Mode: FULL_AUTO / SEMI_AUTO / MANUAL              |
+-----------------------------+-----------------------+
                              |
+-----------------------------v-----------------------+
|                    External Platform                 |
|   - Yandex Business API / Dashboard                  |
+-----------------------------------------------------+
```

## Data Layer

- **Database:** SQLite via Prisma ORM (development), PostgreSQL path for production.
- **Docker Services:** Postgres 15 + Redis 7 in `docker-compose.yml`.
- **ORM:** Prisma 5.22 with generated client.

## Key Data Models

| Model | Purpose |
|-------|---------|
| Tenant > Store > User | Multi-tenant hierarchy with RBAC |
| StoreMasterProfile | Single source of truth for sync fields |
| PlatformLocationLink | Store-to-Yandex listing mapping with sync status |
| MatchCandidate | Discovery results with confidence scoring |
| ApprovalTask | Pending actions requiring operator approval |
| SyncJob > SyncStep | Execution tracking for sync operations |
| ChangeSnapshot | Pre-write snapshots for rollback |
| CategoryMapping | Internal-to-platform category translation |
| StorePhoto + PlatformPhotoRef | Photo management references |
| QRCode + Feedback | Customer-facing QR flow and feedback collection |
| AuditLog | All admin actions with tenant+user tracking |
| Session | Token-based auth sessions |

## Sync Flow (Target)

1. Operator edits master store card.
2. Discovery runs in Yandex within 30m radius.
3. Candidates are scored by distance + name + phone signals.
4. Operator manually selects the matching candidate.
5. System generates per-field diff (dashboard vs Yandex).
6. Operator approves/rejects each change.
7. Sync executor applies approved changes via connector mode.
8. Snapshot is taken before write for rollback.
9. Result is logged to audit trail.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, TypeScript 5
- **Backend:** Next.js Server Actions, Prisma ORM
- **Database:** SQLite (dev) / PostgreSQL 15 (prod path)
- **Cache:** Redis 7 (available via Docker)
- **Testing:** Playwright configured, test suite expansion pending

## Key Design Patterns

- **Approval-gated writes:** No external modification without explicit operator confirmation.
- **Capability-based connector mode:** Yandex behavior adapts to available API capabilities.
- **Snapshot-based rollback:** Read platform state before writing for potential restore.
- **Tenant isolation:** All data queries include tenant authorization checks.
