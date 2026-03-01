# Decisions Log

## D-020: Yandex-Only Active Platform Scope

- Date: 2026-02-25
- Decision: Concentrate active MVP delivery on Yandex only.
- Reason: Multi-platform execution diluted delivery focus while Yandex has the strongest operational fit and available data.
- Impact: Google and 2GIS tracks are archived/deferred. All active planning, specs, roadmap, and execution now target Yandex only.

## D-019: Federated Ownership Constraint (No Central Platform Accounts)

- Date: 2026-02-17
- Decision: Treat platform writes as federated operations because stores are controlled by many third-party accounts, not one unified Yandex/2GIS owner account.
- Reason: Direct centralized API automation is not legally/operationally possible for stores outside account ownership.
- Impact: MVP must support manual/semi-automatic workflows, owner outreach, and evidence-based verification for externally controlled stores.

## D-018: No-Google MVP Delivery Pivot

- Date: 2026-02-17
- Decision: Continue and finish MVP without Google Business Profile API dependency.
- Reason: Google rejected API application due to internal quality checks; timeline cannot wait for uncertain reapproval.
- Impact: Delivery priority shifts to Yandex/2GIS capability-based integration and manual/semi-auto operations. Google becomes deferred track.

## D-017: Gemini Follow-Up Accepted with Remaining Scope

- Date: 2026-02-10
- Decision: Accept Gemini follow-up as partial stabilization pass for build and discovery auth checks.
- Reason: Independent re-verification confirms build pass and discovery auth checks are present, while lint still has one blocking error.
- Impact: Remaining work is focused on lint fix, real connector integration, and approval/rollback execution hardening.

## D-016: Verification-First Documentation Policy

- Date: 2026-02-10
- Decision: Update project docs only from verified runtime/build evidence.
- Reason: Avoid drift between claimed and actual implementation state.
- Impact: Added verification report and aligned status/todo with measured results.

## D-015: Gemini Scaffold Accepted as Baseline, Not Final

- Date: 2026-02-10
- Decision: Accept Gemini implementation as a working scaffold and continue from it.
- Reason: Core models/discovery UI exist and runtime smoke checks pass.
- Impact: Next iteration must focus on lint fixes, auth guardrails, and production-grade connector execution.

## D-014: Google Access Workstream Started

- Date: 2026-02-10
- Decision: Google OAuth credentials configured and GBP support request submitted.
- Reason: Google is first target for live write sync.
- Impact: Request was later rejected on 2026-02-17; track moved to deferred reapplication.

## D-013: Testing Mode Without Login

- Date: 2026-02-10
- Decision: Allow auth bypass in development/testing via env flag.
- Reason: Speed up QA and owner-operated testing cycles.
- Impact: Must stay disabled in production.

## D-012: Platform Capability-Based Connector Strategy

- Date: 2026-02-10
- Decision: Implement connectors by capability mode (`FULL_AUTO`, `SEMI_AUTO`, `MANUAL`).
- Reason: Platform APIs have different write limitations.
- Impact: Google may be automated later if approved; Yandex/2GIS run guided-manual mode until access is granted.

## D-011: Missing Listing Creation Rule

- Date: 2026-02-10
- Decision: Missing location can be created only after explicit confirmation.
- Reason: Creating map listings has high operational and policy risk.
- Impact: Creation flow must support verification states and manual checkpoints.

## D-010: Write Safety Rules

- Date: 2026-02-10
- Decision: Every external write requires explicit dashboard approval.
- Reason: Prevent accidental cross-platform corruption and keep auditability.
- Impact: Sync pipeline must include approval tasks and traceable execution state.

## D-009: Matching and Approval Policy

- Date: 2026-02-10
- Decision: Use `30m` radius and always require manual candidate choice; no auto-linking.
- Reason: Reduce false matches and keep operator control.
- Impact: Higher manual review effort but lower data integrity risk.

## D-008: Yandex-First Unified Store Card Sync

- Date: 2026-02-10
- Decision: Product direction changed to unified store-card sync with Yandex as primary discovery source.
- Reason: User has the most complete real location coverage in Yandex.
- Impact: Matching/discovery order is Yandex -> Google -> 2GIS.

## D-007: MVP Security Baseline Implemented

- Date: 2026-02-07
- Decision: Completed secure auth/session, tenant-safe checks, URL/feedback validation, CSV import, notifications, and audit logging baseline.
- Reason: Required to move from prototype to pilot-ready foundation.
- Impact: Roadmap focus shifts to launch readiness items (rate limiting, monitoring, legal, pilot onboarding).

## D-006: Security and Authorization Before New Features

- Date: 2026-02-07
- Decision: Pause feature expansion until auth/session and tenant isolation are fixed.
- Reason: Current implementation has critical security and data-isolation risk.
- Impact: Near-term roadmap reordered; CSV/notifications/audit features proceed only after hardening.

## D-005: 30/60/90 Delivery Model

- Date: 2026-02-06
- Decision: Execute in phased gates with metric checks.
- Reason: Reduce delivery and market risk.
- Impact: Scope can be adjusted by milestone outcomes.

## D-004: MVP Roles Limited to Two

- Date: 2026-02-06
- Decision: Start with `Owner` and `Store Manager` only.
- Reason: Simpler permissions model and faster delivery.
- Impact: Regional/agency roles move to post-MVP.

## D-003: Private Feedback as Primary Differentiator

- Date: 2026-02-06
- Decision: Prioritize private feedback workflow, notifications, and service-quality visibility.
- Reason: Strong compliance-safe value and operational ROI.
- Impact: Product messaging shifts from "rating manipulation" to "quality improvement + review acceleration."

## D-002: MVP Without Write Integrations

- Date: 2026-02-06
- Decision: No automated write sync to Google/Yandex/2GIS in v1.
- Reason: Integration complexity and timeline risk.
- Impact: Faster time-to-market; manual link management required.

## D-001: Compliance-Only Review Flow

- Date: 2026-02-06
- Decision: Remove rating-gated routing from v1.
- Reason: High platform policy risk and business continuity risk.
- Impact: Safer launch, lower legal exposure, slightly weaker short-term review-volume promise.
