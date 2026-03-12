# TODO

**Updated:** 2026-03-11

## Railway Deployment (2026-03-11) - PRIORITY 1

- [ ] Migrate Prisma schema from `sqlite` → `postgresql`
- [ ] Create GitHub repository and push code
- [ ] Create Railway project + add PostgreSQL plugin
- [ ] Set environment variables on Railway (DATABASE_URL, SESSION_SECRET, FEEDBACK_HASH_SALT, NEXTAUTH_URL)
- [ ] Run `prisma migrate deploy` on Railway
- [ ] Seed production database with stores data
- [ ] Test voting page on production URL
- [ ] Regenerate all QR posters with production URL

## QR Feedback Pilot (2026-03-11) - PRIORITY 1

- [x] Upgrade public QR page to 3-question feedback flow
- [x] Add Uzbek Cyrillic default + Russian language switch
- [x] Add anti-abuse protection for duplicate/self-voting
- [x] Add branded QR poster generator for printable PNG output
- [x] Fix 2-step flow: save vote first, then show platform links or comment form
- [x] Lock final question text (UZ + RU)
- [x] Fix poster: UPPERCASE store name, all-Russian text, remove URL, fix line breaks
- [x] Fix platform button colors and icons (correct brand colors)
- [ ] Generate QR posters for all 33 pilot stores (after production URL is live)
- [ ] Fix 2GIS + Yandex links for all stores in DB (currently search queries, not direct cards)
- [ ] Remove temporary QR debug scripts from `app/scripts/`

## QR Feedback Pilot (2026-03-08) - PRIORITY 1

- [x] Upgrade public QR page to 3-question feedback flow
- [x] Add Uzbek Cyrillic default + Russian language switch
- [x] Add anti-abuse protection for duplicate/self-voting
- [x] Add branded QR poster generator for printable PNG output
- [~] Iterate poster visual direction and brand colors (orange/white active version generated)
- [ ] Generate final QR posters for all pilot stores
- [ ] Remove temporary QR debug scripts from `app/scripts/`
- [ ] Normalize and verify UTF-8 text rendering across the public QR UI
- [ ] Decide final poster copy and lock the print template
- [ ] Pilot-launch stores even if some map listings are still disconnected
- [ ] Connect missing public review links incrementally after launch

## Google Business Profile Import (2026-03-08) - PRIORITY 1

- [x] Generate v5.csv (10 stores) with proper geocoding and admin areas
- [x] Upload v5.csv via Add business → Import businesses workflow
- [x] Create v6.xlsx (14 stores) - ready for upload
- [~] Monitor verification of batch 1: 4/10 verified, 6/10 in progress (expect 1-3 days each)
- [ ] **WAIT 24-48 hours** for Google's rate limit quota to reset (approx 2026-03-09 to 2026-03-10)
- [ ] Upload v6.xlsx (14 remaining stores) after quota reset
- [ ] Monitor verification of batch 2 (expect 1-3 days per store, approx 2026-03-11 to 2026-03-13)
- [ ] After batch 2 verified: update all 24 stores with:
  - [ ] Hours (Sun-Sat: 08:00-22:00 or custom hours from data)
  - [ ] Logo photo URL: `https://avatars.mds.yandex.net/get-altay/18150755/2a0000019c9af2e3ae35b3364448d95f4b1d/orig`
  - [ ] Business description: "Магазин качественных сыров и молочных продуктов. Широкий выбор отечественных и импортных сортов. Свежая продукция каждый день."
  - [ ] Phone: +998 78 555 15 15
  - [ ] Social links (Instagram, Facebook, Telegram) - gather from brand guidelines

## 2GIS Execution (2026-02-28)

- [x] Normalize active branch names in 2GIS to `Сырная Лавка` (without additions) via `PUT /api/1.0/branches/{branchId}`.
- [x] Apply confirmed hour fixes in 2GIS:
  - row `14` / branch `70000001094396147`: `08:00-20:00` -> `08:00-22:00`
  - row `18` / branch `70000001053172745`: `08:00-20:00` -> `08:00-19:00`
- [x] Rebuild `2gis` sheet in `data/stores_audit.xlsx` after updates.
- [x] Save execution artifact: `data/2gis_applied_updates_2026-02-28.json`.
- [ ] Remove technical pending branch `branch_69a09623d9e3f` (`TEST`) in 2GIS cabinet when moderation UI allows removal.
- [ ] Complete moderation follow-up for pending `branch_*` cards and then re-run `2gis` sheet rebuild.

## Google Maps Closure Sprint (2026-02-27)

- [x] Refresh `google map` sheet in `data/stores_audit.xlsx` from current ownership data.
- [x] Add missing managed mappings for rows `5` and `20` in `scripts/build_google_sheet_from_current.py`.
- [~] Google coverage now: managed rows `5, 8, 15, 20, 25, 28`; waiting non-RUBA rows reduced to `24` (+ covered-candidate rows `2`, `12`).
- [x] Completed Google row-by-row first-pass sweep across all `35` rows; each row now has a latest attempt result in `data/google_claim_attempts_2026-02-27.json`.
- [~] Google creation fallback started for `not_found_search` rows (`4, 6, 29`): prepared import files, but Google Business import UI is currently blocked in this session context.
- [~] Google direct creation fallback (`Add single business` + `/create`) is currently blocked by forced redirect to Google policy/help page for missing rows `4, 6, 8, 26, 29, 34, 35`.
- [ ] Complete Google closure plan in `docs/plans/2026-02-27-google-maps-closure-plan.md`.
- [ ] Execute row-by-row checklist in `docs/GOOGLE_MAPS_TODO_2026-02-27.md`.
- [x] Rebuild `2gis` sheet and add compliant review workflow columns: `Reviews Action (Real only)` and `Review Note`.
- [x] Create combined execution runbook: `docs/plans/2026-02-27-google-2gis-execution-plan.md`.
- [x] Compliance note applied: no fake 5-star posting; use only genuine customer-review requests in 2GIS workflow.

## Operational Answers (2026-02-27)

- [~] 2GIS status answer: public customer phone is still mostly **+998977111515** (26 published branches), while **+998785551515** is present only on 1 branch; **+998935496767** is not published on branches.
- [ ] 2GIS required fix: set customer-facing phone to **+998785551515** on all published branches (where branch is active).
- [ ] 2GIS account verification phone check: confirm in 2GIS cabinet security/profile settings that SMS verification phone is **+998935496767** (not available via public/catalog API).
- [ ] 2GIS business description: copy approved Russian store description from Yandex and apply to all relevant 2GIS branches.
- [~] Project search for ready Russian description text: checked repo + local DB on 2026-02-27, no ready RU text found (need source text from user or Yandex export).
- [~] Google Maps contact audit: found 10 relevant cards for "РЎС‹СЂРЅР°СЏ Р›Р°РІРєР°/РЎС‹СЂРЅС‹Р№ Р±СѓС‚РёРє"; phones detected, no public emails detected.
- [x] Google Business check (sismatullaev@gmail.com): account currently has **7** managed locations (2 Verified, 5 Processing) as of 2026-02-27.
- [ ] Google ownership recovery: for each target store in Google Maps, run `Claim this business / Request access` from the same Google account.
- [ ] Google ownership recovery follow-up: track requests, wait response window, then escalate through Google Business appeal/support for no-response/denied requests.
- [ ] Google verification channels to use during claim flow: `+998977111515`, `+998935496767`, `+998785551515`, and `sanjar6767@gmail.com` (request code from user when prompted).
- [x] Create Excel sheet `google map` in `data/stores_audit.xlsx` with full store list and columns for `known from Google` vs `unknown / pending` (2026-02-27).
- [x] Approved RU business description (for profile fields): `Магазин качественных сыров и молочных продуктов. Широкий выбор отечественных и импортных сортов. Свежая продукция каждый день.`
- [~] Google ownership coverage now: `7` managed profiles mapped to `6` non-RUBA rows in Excel, plus `2` covered-candidate rows (`2`, `12`); `24` non-RUBA rows still need claim flow.
- [ ] Batch execution confirmed by owner: continue claiming remaining `24` non-RUBA locations and request verification codes from user when prompted.
- [~] Google claim blockers recorded: row `1` (`76G3+Q3P`) and row `18` (`88WW+Q56`) fail address validation; row `19` (`Газалкент`) not found in Maps search.
- [~] Additional Google search blockers recorded: row `4` (`Сакичмон 1`), row `6` (`Паркент 74`), row `29` (`Навруз 7`) return only already-known cards in Maps search.
- [~] Additional Google ownership blockers recorded: row `7` candidate (`Cheese Shop at Buz Bazar`, phone `+998935496767`) has no visible `Claim/Manage` CTA for current account; row `16` query resolves to generic `Farkhad Bazaar` card (needs exact store pin/link).
- [~] New claim blockers (2026-02-27): row `19` (`Syrnaya Lavka Yalangoch`, `88WW+Q56`) and row `33` (`Syrnaya Lavka`, `9QRQ+G9M`) reach claim wizard but fail on contact step with Google `RpcError` (`Sorry, try again later`).
- [~] New redirect blockers (2026-02-27): rows `13` (`Syrnaya Lavka Sergeli`, `66H9+352`) and `32` (`Syrnaya Lavka`, `9QRQ+G9M`) show `Claim this business` but redirect to Google policy/help page instead of claim wizard.
- [~] Candidate requiring owner confirmation: row `10` found `Syrnyy Butik` (`76V6+5WX`, `+998909266856`) with brand/phone mismatch vs baseline.

## Yandex Tracking Sync (2026-02-28)

- [x] Add script to sync Telegram tracker JSON to Yandex Excel tracking columns (`scripts/sync_yandex_tracking_from_telegram.py`).
- [x] Generate tracking workbook copy from latest Telegram status (`data/stores_audit_tracking_2026-02-28.xlsx`).
- [x] Generate status summary JSON (`data/yandex_tracking_sync_summary_2026-02-28.json`).
- [ ] Reconcile conflicting Telegram completion reports (`3/28` vs `100%`) by fresh UI verification run.
- [ ] Merge tracking columns into main workbook `data/stores_audit.xlsx` once file lock is cleared.

## High Priority

- [~] Claim all remaining РЎС‹СЂРЅР°СЏ Р»Р°РІРєР° stores вЂ” **33/36 claimed, 3 remaining (unknown phone numbers)**
- [ ] Claim 3 remaining stores using Yandex alternative verification (Р·РІРѕРЅРѕРє or support request)
- [ ] Apply for Yandex Business API access вЂ” needed to programmatically sync all store data (core Pinbox alternative goal)
- [ ] Add marketing department as shared users in Yandex Business account
- [x] Update all store names to **РЎС‹СЂРЅР°СЏ Р›Р°РІРєР°** (capital Р›) across all 33 stores вЂ” DONE 2026-02-26
- [ ] Build store ownership registry: each store -> actual Yandex owner/person/account
- [ ] Define and document Yandex-only federated operating model
- [ ] Create owner outreach workflow (invitation, consent, credentials handoff, fallback manual steps)
- [ ] Freeze connector mode for Yandex (SEMI_AUTO or MANUAL by capability)
- [ ] Finalize Yandex-only MVP scope and acceptance criteria in `SPECS.md`
- [ ] Implement first real Yandex integration for legally controlled accounts (requires API access)
- [ ] Build approval execution engine (currently partial/scaffold)
- [ ] Build rollback execution baseline with snapshot restore checks

## Medium Priority

- [ ] Build per-field diff UI for approval review
- [ ] Build selected-store bulk discovery action
- [ ] Build batch approve/reject for multiple stores
- [ ] Add write queue with retries and backoff
- [ ] Add failure states to sync steps (FAILED, PARTIAL, PENDING_VERIFICATION)
- [ ] Add closed-store exclusion from sync queue
- [ ] Add "mark closed" workflow for Yandex operations
- [ ] Fix encoding artifacts in discovery UI text
- [ ] Create operator SOP for Yandex MANUAL/SEMI_AUTO mode

## Low Priority

- [ ] Confirm final baseline dataset for pilot stores
- [ ] Set up git repository for version control
- [ ] Write integration tests for Yandex approval pipeline
- [ ] Write Yandex connector contract tests
- [ ] Archive or remove dormant Google/2GIS implementation docs after migration is complete

## Completed

- [x] Product definition and scope (D-001 through D-005)
- [x] Security hardening: auth, sessions, tenant isolation (D-006, D-007)
- [x] Unified sync schema migration
- [x] Discovery + manual linking UI
- [x] Master profile editor
- [x] Telegram channel store import and platform audit report
- [x] Pivot decision made: no-Google path (D-018)
- [x] Single-platform focus decision made: Yandex-only execution (D-020)
- [x] dmigos95@gmail.com added as РџСЂРµРґСЃС‚Р°РІРёС‚РµР»СЊ to all 24 owned stores (2026-02-26)
- [x] All 33 store names updated to "РЎС‹СЂРЅР°СЏ Р›Р°РІРєР°" (capital Р›) via bulk API (2026-02-26)
- [x] Store audit Excel generated: data/stores_audit.xlsx with all 33 stores (2026-02-26)
- [x] Yandex Business API endpoints documented in docs/YANDEX_API_CHEATSHEET.md
- [x] Google Maps + GBP API endpoints documented in docs/GOOGLE_MAPS_API_ENDPOINTS.md (2026-02-27)
- [x] Google Maps contact audit captured in docs/GOOGLE_MAPS_CONTACT_AUDIT_2026-02-27.md (2026-02-27)
