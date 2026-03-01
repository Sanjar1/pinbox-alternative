# Google Maps Closure Plan

**Date:** 2026-02-27  
**Workbook:** `data/stores_audit.xlsx` -> sheet `google map`

## Goal
Complete Google Maps ownership and cleanup work for all non-RUBA stores, with explicit handling for blocked cases.

## Current Baseline (after refresh)
- Total rows in baseline: `35`
- Processing claims: `4` rows -> `5, 8, 20, 28`
- Verified: `1` row -> `15`
- Verified + duplicate Processing: `1` row -> `25`
- Waiting claim/search work (non-RUBA): `24` rows -> `1, 3, 4, 6, 7, 9, 10, 11, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 29, 30, 31, 32`
- Covered-candidate rows (need mapping confirmation): `2, 12`
- RUBA separate track: `3` rows -> `33, 34, 35`

## Phase 1 - Close in-flight claims
1. Monitor rows `5, 8, 20, 28` until Google status changes from `Processing`.
2. For row `25`, merge duplicate profile after processing completes.
3. Acceptance: no `Processing` statuses remain in the managed account.

## Phase 2 - Fast wins from waiting list
1. Validate rows with prior `already_managed/duplicate` evidence:
- row `2` (`already_managed_match`)
- row `12` (`duplicate_of_managed`)
2. Confirm these rows map to an existing managed profile and close as duplicates if confirmed.
3. Acceptance: these rows move from waiting to duplicate-resolved.

## Phase 3 - Blocker resolution queue
1. `rpc_error_persists` rows: `1, 19, 32, 33`
- Retry in fresh browser session.
- If same error, escalate via Google Business support ticket with screenshots + time.

2. `not_found_search` rows: `4, 6, 29`
- Search by plus code, map pin, and nearby landmark variants.
- If still not found, create new profile with exact address/pin.

3. `ambiguous_place` rows: `3, 10, 11, 14, 16, 17`
- Get exact pin/share-link from owner and claim by direct listing URL.

4. `blocked_address_validation` row: `18`
- Use Google support-assisted claim (address validation bypass request).

5. `no_claim_cta` row: `7`
- Attempt claim from alternate Google account / direct listing URL, then request access transfer.

## Phase 4 - Data completeness and final QA
1. Fill `Внутренний ID` for all Google rows.
2. Fill rating column where publicly available.
3. Confirm for every managed row:
- phone = target hotline
- hours = baseline
- RU description is applied.
4. Acceptance: all non-RUBA rows are either managed or have a support-ticket ID.

## Done Definition
Google Maps track is considered complete when:
1. Every non-RUBA row has one of:
- managed verified profile, or
- active Google support case ID with owner follow-up date.
2. No unmanaged row remains without explicit next action.
3. `google map` sheet reflects latest ownership state.
