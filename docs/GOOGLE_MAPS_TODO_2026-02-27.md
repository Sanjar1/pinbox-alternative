# Google Maps TODO (Execution)

**Updated:** 2026-02-27
**Source of truth:** `data/stores_audit.xlsx` -> `google map`

## In Progress
- [ ] Wait and re-check Processing rows: `5, 8, 20, 28`
- [ ] Merge duplicate for row `25` after Processing finishes.
- [ ] Confirm covered-candidate rows map correctly: `2, 12`

## Next Actions (By Blocker Type)
- [ ] `rpc_error_persists`: rows `1, 19, 33` -> retry once in clean session, then open Google support case.
- [ ] `redirect_to_policy_help`: rows `13, 32` -> open claim flow from clean profile/browser and escalate to Google support if redirect persists.
- [ ] `not_found_search`: rows `4, 6, 8, 26, 29, 34, 35` -> search by plus-code/pin; if none, create new listing.
- [ ] `ambiguous_place`: rows `3, 9, 10, 11, 14, 15, 16, 17, 21, 22, 23, 24, 27, 28, 30, 31` -> collect exact map pin/share link from owner, then claim exact listing.
- [ ] `blocked_address_validation`: row `18` -> support-assisted claim.
- [ ] `no_claim_cta`: row `7` -> attempt via alternate account or direct listing URL and request access.

## Data / QA
- [ ] Fill `Внутренний ID` for all rows in `google map` sheet.
- [ ] Fill ratings for managed profiles.
- [ ] Verify phone/hours/description for managed rows `5, 8, 15, 20, 25, 28`.

## Tooling Blocker
- [ ] Account/session blocker: `Add business -> Add single business` and direct `https://business.google.com/create` redirect to Google policy/help page instead of creation form (no SMS step reachable).
- [ ] Google Business `Import businesses` UI did not accept/parse uploads reliably in current browser session context (stuck in Maps-embedded flow). Retry in a fresh local browser session.
- [ ] Use prepared files for retry:
- `data/google_import_missing_2026-02-27.csv`
- `data/google_import_missing_2026-02-27_v2.csv`

## Completed This Session
- [x] Refreshed `google map` sheet with latest managed mappings.
- [x] Added/updated managed profile mappings for rows `5` and `20` in `scripts/build_google_sheet_from_current.py`.
- [x] Added blocker-aware next actions from `data/google_claim_attempts_2026-02-27.json` into the generated sheet.
- [x] Rebuilt workbook sheet: now `24` waiting non-RUBA rows (was `28`), plus `2` covered-candidate rows (`2`, `12`).
- [x] Retried live claim flow for row `1` (`76G3+Q3P`): contact-step `Next` still returns Google `RpcError`, no SMS prompt reached.
- [x] Retried `not_found_search` rows `4, 6, 29` with direct EN queries (`Sakichmon 1`, `Parkent 74`, `Gulsanam 7`) - still only known cards, no distinct new listing found.
- [x] Executed full sweep for previously unattempted rows `8, 9, 13, 15, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 34, 35` and logged outcomes.
- [x] Row `13` (`Syrnaya Lavka Sergeli`) reaches a claimable card but redirects to Google policy/help page from claim URL (same pattern as row `32`).
- [x] Row `25` (`Abdurauf Fitrat 4`) opens directly and shows `Manage your Business Profile` for current account (already managed match).
- [x] Tried direct location creation path for missing rows (`4, 6, 8, 26, 29, 34, 35`), but creation is blocked by policy/help redirect before any form loads.
