# Specifications and Requirements

## Project Goal

Enable multi-location businesses (chains with 5-200 stores) to maintain accurate Yandex Maps store profiles from a single dashboard, with approval-controlled sync and quality feedback collection.

## Functional Requirements

### Store Management
- [FR-1] One master store card per location with all syncable fields
- [FR-2] CSV and Telegram channel bulk import of stores
- [FR-3] Bulk edit for multiple stores (planned)
- [FR-4] Tenant > Region > Store hierarchy with RBAC

### Yandex Sync
- [FR-5] Discovery: search Yandex by lat/lng + name + phone within 30m radius
- [FR-6] Always-manual candidate selection (no auto-linking)
- [FR-7] Per-field diff view: dashboard values vs Yandex values
- [FR-8] Approval required for every external write (link/create/update)
- [FR-9] Missing listing creation only after explicit confirmation
- [FR-10] Sync execution with retry and failure handling
- [FR-11] Rollback via pre-write snapshots where possible
- [FR-12] Selected-store bulk sync (not only whole chain)
- [FR-13] Closed stores excluded from regular sync; dedicated "mark closed" workflow

### Connector Capabilities
- [FR-14] Yandex connector mode: FULL_AUTO, SEMI_AUTO, or MANUAL
- [FR-15] Capability matrix per field (read/create/update/delete)
- [FR-16] Semi-auto mode: provide operator instructions + dashboard link
- [FR-17] Manual mode: no API write, manual links only

### Feedback and QR
- [FR-18] QR code generation per store with unique slugs
- [FR-19] Public mobile-first rating landing page
- [FR-20] Platform review link on landing page (compliant, no gating)
- [FR-21] Private feedback capture with status tracking (NEW, RESOLVED, ARCHIVED)

### Audit and Operations
- [FR-22] Full audit trail: action, user, tenant, timestamp, details
- [FR-23] Sync job history with per-step status
- [FR-24] Change snapshots for rollback support

## Non-Functional Requirements

- **Performance:** Landing page < 2s load on mobile
- **Security:** Hashed passwords, token-based sessions, tenant isolation on all queries
- **Data residency:** TBD based on deployment location (Uzbekistan market)
- **Language:** Russian-first UI and data
- **Availability:** No SLA defined yet (pre-launch)

## Acceptance Criteria (Yandex MVP)

1. Yandex discovery works for selected stores.
2. Manual candidate choice is enforced in all cases.
3. Approval is required for every write.
4. Missing listing creation works only after explicit confirmation.
5. Rollback availability is clear and usable where possible.
6. Operator can run daily Yandex sync without engineering help.
7. Matching correctly identifies >90% of known Yandex links on the baseline test set.
8. 100% of writes are approval-gated (verified by audit log).
9. Sync failure rate <5% (excluding external platform outages).

## Out of Scope (Current)

- Google Maps integration
- 2GIS integration
- Automated scheduled sync without approval
- Regional manager or agency roles
- AI sentiment analysis of feedback
- CRM/helpdesk integrations
- Mobile admin app
