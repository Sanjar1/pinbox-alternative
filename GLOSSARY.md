# Glossary

| Term | Definition |
|------|-----------|
| **Master Store Card** | The single source-of-truth profile for a store in the dashboard, containing all syncable fields |
| **Platform** | The external map service currently in active scope: Yandex Maps |
| **Discovery** | The process of searching Yandex by lat/lng plus helper signals to find matching listings |
| **Candidate** | A potential Yandex listing match found during discovery, scored by confidence |
| **Linking** | Manually confirming that a discovered candidate is the correct match for a store |
| **PlatformLocationLink** | The database record connecting a store to its Yandex listing |
| **Approval Task** | A pending action (link, create, update) that requires operator confirmation before execution |
| **Sync Job** | A queued execution unit containing one or more Yandex sync steps |
| **Sync Step** | A single write operation within a sync job |
| **Change Snapshot** | A read-before-write copy of platform data, used for rollback |
| **Connector** | Platform adapter implementing the `IConnector` interface; Yandex connector is the active target |
| **Capability Mode** | Automation level for connector behavior: FULL_AUTO, SEMI_AUTO, or MANUAL |
| **Capability Matrix** | Per-field table of supported operations (read/create/update/delete) |
| **Diff** | Per-field comparison between dashboard values and platform values shown before approval |
| **Rollback** | Restoring a listing to its pre-sync state using stored snapshots |
| **Tenant** | A business entity (chain) that owns stores and users in the system |
| **RBAC** | Role-Based Access Control: Owner (full access) and Store Manager (assigned stores only) |
| **QR Flow** | Customer path: scan QR -> rate store -> open review link -> optionally leave private feedback |
| **Compliant Mode** | Review flow that does not route users by rating and does not gate public review links |
