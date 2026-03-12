# Mistakes and Lessons Learned

## 2026-03-08 - Tried live QR testing before local schema was fully migrated

- **What happened:** The QR feedback flow was prepared for testing, but feedback queries hit a missing-column error because the local SQLite DB had not applied the newest feedback-protection migration.
- **Root cause:** Code and Prisma schema had moved ahead of the local database state.
- **Lesson:** Before any end-to-end test, explicitly verify local DB migrations against the active Prisma schema.

## 2026-03-08 - First poster draft gave too much space to copy and not enough to the QR

- **What happened:** The first printable QR poster looked correct technically but was not strong enough visually for in-store use.
- **Root cause:** Layout priority favored descriptive text over scanability.
- **Lesson:** For real-world print QR assets, make the code the dominant visual element first and compress instructions/copy aggressively.

## 2026-02-25 - Strategy scope stayed too broad for too long

- **What happened:** Active planning continued to include multiple external platforms after repeated access and ownership constraints were known.
- **Root cause:** Delivery planning favored optional future flexibility over immediate execution focus.
- **Lesson:** When external dependencies are unstable, narrow active scope aggressively and keep other tracks explicitly archived, not half-active.

## 2026-02-10 - Trusting scaffold claims without verification

- **What happened:** Gemini implementation was accepted based on completion claims. Independent verification showed connectors were mostly mock and some features were schema-level only.
- **Root cause:** No verification protocol for external AI-generated contributions.
- **Lesson:** Always run independent verification (build, lint, runtime smoke test) before marking implementation complete.

## 2026-02-10 - Google API access assumed to be instant

- **What happened:** OAuth credentials and APIs were configured, but usable quota was still zero.
- **Root cause:** Google Business Profile API required a separate approval process.
- **Lesson:** Validate onboarding timelines and real quota early for any external API dependency.

## 2026-02-10 - OAuth secrets shared in chat

- **What happened:** OAuth client secret and refresh token were shared during setup.
- **Root cause:** Credentials were treated as normal config in collaboration flow.
- **Lesson:** Never share credentials in chat or docs. Rotate compromised secrets immediately.

## 2026-02-07 - Building features before security

- **What happened:** Early prototype had CRUD/QR/feedback features without solid auth and tenant isolation.
- **Root cause:** Visible features were prioritized over security foundation.
- **Lesson:** Security and authorization must precede feature expansion in multi-tenant systems.

## 2026-02-06 - Initially planned review gating as core feature

- **What happened:** Product initially included rating-based routing, which conflicts with platform policies.
- **Root cause:** Value proposition copied before policy verification.
- **Lesson:** Validate policy compliance before committing to review-flow features.
