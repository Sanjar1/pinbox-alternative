# Risks and Mitigations

## Critical Risks

1. Yandex account ownership fragmentation
- Risk: Stores are controlled by many third-party accounts, blocking centralized automation.
- Mitigation: Federated operations model, owner registry, and approval-gated execution.

2. Yandex capability uncertainty for write operations
- Risk: API/account mode may not allow required create/update/close operations.
- Mitigation: Capability matrix first, connector mode freeze, manual/semi-auto fallback.

3. Incorrect location matching in dense zones
- Risk: Wrong listing link can corrupt public business data.
- Mitigation: 30m radius, always-manual candidate choice, signal-assisted review.

4. Irreversible external changes
- Risk: Some operations may not roll back cleanly.
- Mitigation: Snapshot before write, explicit rollback availability, manual recovery instructions.

5. False confidence from scaffold behavior
- Risk: Mock-like behavior may be mistaken for production readiness.
- Mitigation: Require live pilot evidence and explicit hardening gates before production sign-off.

## High Risks

1. Approval fatigue in bulk operations
- Risk: Too many manual approvals can slow operations.
- Mitigation: Batch approvals and grouped diffs.

2. Sync reliability and retries
- Risk: Partial updates create inconsistent data.
- Mitigation: Queue-based execution, retry policy, dead-letter handling, visible status states.

3. Data privacy and residency compliance
- Risk: Legal breach if consent and storage policies are incomplete.
- Mitigation: Compliance checklist before pilot, deletion/export process, legal sign-off gate.

## Medium Risks

1. Timeline optimism
- Risk: Underestimating integration hardening effort.
- Mitigation: Gate-based rollout with phase exit criteria.

2. Feature creep
- Risk: Building non-essential features before core sync reliability.
- Mitigation: Strict priority control in TODO and roadmap.

3. Documentation drift
- Risk: Claims diverge from actual implementation state.
- Mitigation: Keep verification-first documentation policy with dated evidence.
