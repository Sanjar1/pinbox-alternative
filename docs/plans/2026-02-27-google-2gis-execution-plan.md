# Google + 2GIS Execution Plan (2026-02-27)

## Constraints
- No fake/manipulated reviews. Only genuine customer feedback is allowed.
- Keep `data/stores_audit.xlsx` as source of truth.

## Phase 1 - Spreadsheet Sync (Done)
1. Rebuild `2gis` tab from current `Yandex` source.
2. Rebuild `google map` tab from current ownership/claim state.
3. Verify row counts and status totals.

## Phase 2 - 2GIS Review Operations (Compliant)
1. Use new columns in `2gis` tab:
- `Reviews Action (Real only)`
- `Review Note`
2. For rows with active/pending 2GIS cards:
- ask real buyers for honest short reviews after purchase.
3. For rows without active card:
- finish listing creation/moderation first, then request reviews.

## Phase 3 - Google One-by-One Claim/Create
1. Continue direct attempts row-by-row from `google map` waiting list.
2. Priority:
- `rpc_error_persists` rows
- `not_found_search` rows
- `ambiguous_place` rows
3. If SMS prompt appears:
- stop and request code from owner immediately.
4. After each attempt:
- update `data/google_claim_attempts_2026-02-27.json`
- rebuild `google map` tab.

## Phase 4 - Documentation Hygiene
1. Keep `TODO.md` and `docs/GOOGLE_MAPS_TODO_2026-02-27.md` in sync with latest counts.
2. Record blockers with clear next action and owner dependency.
