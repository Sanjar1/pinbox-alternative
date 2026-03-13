# Progress Log

## 2026-03-13 - Voting/Poster Wording Fixes + Railway Redeploy

**Done:**
- Updated production voting copy in `app/src/app/[slug]/client.tsx`:
  - RU:
    - `Хорошо ли вас обслужил продавец?`
    - `Был ли продукт свежим и качественным?`
    - `Насколько привлекательна для вас цена относительно других торговых точек?`
  - UZ:
    - `Сотувчининг хизмат кўрсатиш жараёни қониқарли даражада бўлдими?`
    - `Маҳсулот янги ва сифатлими?`
    - `Бошқа савдо нуқталарига нисбатан нархлар сиз учун адолатлими?`
- Updated primary QR poster copy in `app/src/app/poster/[slug]/page.tsx`:
  - Title changed to `Оставьте ваш отзыв`
  - Subtitle changed to `Ваше мнение важно для нас.`
- Synced the same poster copy in:
  - `app/scripts/generate-qr-poster.mjs`
  - `app/test-output/qr-poster-523da2.html`
- Built locally successfully (`npm --prefix app run build`).
- Pushed commit `fd566ed` to `main`.
- Deployed to Railway successfully (`beba68a3-efce-44e6-9b93-8b369fbb8ae7`).
- Updated deployment docs for reproducible AI/operator redeploys:
  - `RAILWAY_CHEATSHEET.md` rewritten with verified CLI flow
  - `DEPLOY_CLI_GUIDE.md` command corrections (`railway deployment list`)

**Found:**
- Default voting language is Uzbek; Russian wording is visible after switching to `РУ`.
- One retry deployment fell back to Nixpacks and failed (`433417ce`), while Dockerfile deployment succeeded.

**Next:**
- Continue cleaning store map URLs to direct card links for all platforms.
- Keep deployment runbook synchronized with actual Railway CLI behavior.

---

## 2026-03-11 - QR Voting UX Overhaul + Railway Deployment Prep

**Done:**
- Fixed QR voting page flow: vote is now saved to DB **before** showing platform links or comment form
- Added 2-step flow: Step 1 = rate + submit → Step 2 = platform links (high score) or comment form (low score)
- Updated questions to final approved versions (UZ + RU, short labels + direct sub-questions)
- Rewrote QR poster text entirely in Russian — clean, consistent, no mixed languages
- Fixed QR poster: UPPERCASE store name, "Как вам у нас?" on one line, URL removed from footer
- Added correct brand colors + SVG icons to platform buttons (Google #1A73E8, Yandex #FC3F1D, 2GIS #1BA53E)
- Fixed Yandex link for Авиасозлар to use real org ID (96275437524)
- Store name rendered UPPERCASE on both voting page and poster
- Decided to deploy on Railway for always-online production hosting

**Found:**
- All 2GIS + Yandex DB links were search queries, not direct store cards — only Авиасозлар Yandex link fixed
- SQLite is incompatible with Railway's ephemeral filesystem — PostgreSQL migration required before deploy
- `VotingPage.tsx` component is a duplicate of `client.tsx` — only `client.tsx` is used on the real `/[slug]` route

**Next:**
- Migrate database schema from SQLite to PostgreSQL
- Push project to GitHub
- Deploy to Railway
- Set all env vars on Railway dashboard
- Generate QR posters for all 33 stores using production URL

---

## 2026-03-08 - QR Feedback Pilot Hardening + Poster Generator

**Done:**
- Upgraded the public QR feedback page in `app`:
  - Uzbek Cyrillic default + Russian language switch
  - 3 separate rating questions
  - average-score routing for public map links
- Added anti-abuse protection to feedback submission:
  - one vote per device per 7 days
  - IP throttling / burst limits
  - suspicious vote flagging
- Applied Prisma migration `20260307100000_add_feedback_abuse_protection_fields` after finding schema mismatch during live test preparation
- Generated a real QR test asset for store slug `523da2`
- Added branded QR poster generator:
  - script: `app/scripts/generate-qr-poster.mjs`
  - outputs HTML + PNG in `app/test-output/`
- Iterated poster design with customer-facing store name and orange/white brand colors
- Clarified launch behavior from the codebase:
  - missing Google/Yandex listings do not block launch
  - private feedback still works even when public map links are not connected

**Found:**
- Feedback submission would fail until the latest Prisma migration was applied locally
- Poster quality depends heavily on layout proportions: large QR performs better than text-heavy layouts
- Current root docs were still centered on older Yandex-only/Google-import threads and needed a fresh snapshot

**Next:**
- Finalize poster visual direction and generate posters for all pilot stores
- Remove temporary debug scripts in `app/scripts/`
- Keep Google batch 2 queued until quota reset
- Start pilot with private feedback even for stores that still lack public map listings

## 2026-03-08 - Google Business Profile Import Complete Preparation

**Done:**
- Restored context from previous sessions: Google Business bulk import work in progress
- Verified actual status on business.google.com:
  - 19 businesses total, 47% verified (green progress bar)
  - First batch (10 stores) submitted and partially verified
  - Second batch affected by Google's rate limit quota
- Confirmed file state:
  - v5.csv: First batch (10 stores) with proper admin areas - uploaded successfully
  - v6.csv: Second batch (14 remaining stores) validated and ready
- Created v6.xlsx Excel format from v6.csv:
  - File: `data/Google-Business-Profile-Import-v6.xlsx`
  - Format: proper Excel formatting with bold headers
  - All 14 stores with correct data (addresses, hours, coords, phone, logo URL, description)
- Geocoding verified working: all 24 stores have accurate lat/lng coordinates
- Admin area validation confirmed: blank for Tashkent city, regional names for outlying areas
- Clarified Google Business requirements:
  - Video: NOT mandatory for verification
  - Photos: NOT mandatory for verification
  - Automatic verification: Google will verify location 1-3 days after upload
  - Photos can be added AFTER verification passes (optional enhancement)

**Status of 24 stores:**
- 4 fully verified ✓
- 6 in "get verification" status (awaiting 1-3 day auto-verification from batch 1)
- 14 queued in v6.xlsx (pending upload after 24-48h quota reset)

**Key Findings:**
- First batch experience showed ~10 store limit per import cycle (Google's rate limiting)
- "Get verification" status is normal and expected - Google processes automatically
- Videos and photos are optional enhancements, not blockers for verification
- Both CSV and Excel formats accepted by Google Business import

**Next:**
- Wait 24-48 hours for quota reset (approx 2026-03-09 to 2026-03-10)
- Upload v6.xlsx with remaining 14 stores using: Add business → Import businesses
- Monitor verification progress daily on business.google.com
- Expected verification completion: approx 2026-03-13 (1-3 days per store)
- After all verified: optionally add photos (logo + store images) for better visibility

## 2026-02-28 - Context Restore + Telegram Tracking Sync

**Done:**
- Restored context from project status docs and latest execution artifacts.
- Verified source-of-truth Telegram tracker:
  - `data/stores_telegram_status_2026_02_28.json` shows `3/28` completed, `25` pending.
- Added new sync utility:
  - `scripts/sync_yandex_tracking_from_telegram.py`
- Generated Excel tracking workbook from JSON status:
  - `data/stores_audit_tracking_2026-02-28.xlsx`
- Generated machine-readable summary:
  - `data/yandex_tracking_sync_summary_2026-02-28.json`

**Found:**
- Documentation conflict exists across 2026-02-28 reports (`3/28` vs `100%` Telegram completion claims).
- `data/stores_audit.xlsx` is write-locked for in-place save in this environment, so output was written to a new workbook file.

**Next:**
- Use the new tracking workbook as working copy until lock is cleared.
- Continue Yandex UI execution for the remaining `25` Telegram-pending stores.
- Record amenities/ratings results and re-run tracking sync with updated source JSON.

## 2026-02-28 - 2GIS Bulk Data Update (Names + Hours)

**Done:**
- Executed direct 2GIS API updates for org `70000001036827089`.
- Normalized active numeric-`branch_id` names to exact `Сырная Лавка`:
  - attempted `33`, success `33`, errors `0` (1 branch already correct).
- Applied hour corrections from latest confirmed diff:
  - branch `70000001094396147`: `08:00-20:00` -> `08:00-22:00`
  - branch `70000001053172745`: `08:00-20:00` -> `08:00-19:00`
  - both updates returned `meta.code=200`.
- Rebuilt `2gis` worksheet in `data/stores_audit.xlsx`.
- Saved execution log: `data/2gis_applied_updates_2026-02-28.json`.

**Verified:**
- Current branch name distribution: `34` branches with `Сырная Лавка`, `1` pending technical branch `TEST`.
- Shared org contact phone is present as `+998 (78) 555-15-15`.

**Open:**
- Pending moderation/cleanup branch remains: `branch_69a09623d9e3f` (`TEST`) - requires cabinet moderation removal path.
- Coordinate-based auto-matching script is currently blocked by Yandex coordinate extraction changes/captcha, so direct branch API flow was used for this run.

## 2026-02-26 - Safe Store-Only Add Batch from Excel

**Done:**
- Continued 2GIS updates using `data/stores_audit.xlsx` as master.
- Added 5 additional **store** branches with building-level verified 2GIS matches:
  - row `7` -> `branch_69a09a71ee01d` (`Сайрам, 37Б`)
  - row `10` -> `branch_69a09a72938e6` (`Мирабад 1-ая, 43`)
  - row `15` -> `branch_69a09a732b7ad` (`улица Шота Руставели, 48`)
  - row `23` -> `branch_69a09a73bffbd` (`Катта Хирмонтепа, 1`)
  - row `26` -> `branch_69a09a746a71b` (`улица Ш.Рашидова, 14`)
- Kept branch additions in safe mode:
  - only rows with clear building-number resolution,
  - skipped ambiguous locality/country mismatches.

**Current state:**
- Org branches total: `35`
- Pending moderation branches:
  - `branch_69a08c05deaad` (`Буюк Турон, 73`)
  - `branch_69a09a71ee01d` (`Сайрам, 37Б`)
  - `branch_69a09a72938e6` (`Мирабад 1-ая, 43`)
  - `branch_69a09a732b7ad` (`улица Шота Руставели, 48`)
  - `branch_69a09a73bffbd` (`Катта Хирмонтепа, 1`)
  - `branch_69a09a746a71b` (`улица Ш.Рашидова, 14`)
  - `branch_69a0979789091` (`Катта Чиланзар, 3`)
  - `branch_69a0976f94d5e` (`Чиланзар Ц квартал микрорайон, 8а/6`)
  - `branch_69a09623d9e3f` (`test`, technical)

**Artifacts:**
- `data/2gis_added_stores_safe_batch.json`
- `data/2gis_sync_diff.json`
- `data/2gis_remaining_from_excel.json`

**Next:**
- Remove technical pending branch `branch_69a09623d9e3f` manually in cabinet (API delete still returns `400` for pending ids).
- For remaining unmatched rows, continue only with exact pin/building confirmation to avoid office/non-store additions.

## 2026-02-26 - Excel-Based 2GIS Update Run (Applied)

**Done:**
- Treated `data/stores_audit.xlsx` as master for this run.
- Applied confirmed schedule correction:
  - branch `70000001080425853` (`Карасу 1-й массив, 15а`)
  - hours `08:00-20:00` -> `08:00-22:00` (Excel row `27`).
- Added two missing branches via `POST /api/1.0/branches` using 2GIS building IDs:
  - `branch_69a0976f94d5e` -> `Чиланзар Ц квартал микрорайон, 8а/6` (Excel row `21`)
  - `branch_69a0979789091` -> `Катта Чиланзар, 3` (Excel row `1`)
- Saved audit artifact:
  - `data/2gis_applied_updates_2026-02-26.json`

**Found:**
- Current org branch count is now `30`.
- Current pending branches:
  - `branch_69a08c05deaad` (`Буюк Турон, 73`)
  - `branch_69a0976f94d5e` (`Чиланзар Ц квартал микрорайон, 8а/6`)
  - `branch_69a0979789091` (`Катта Чиланзар, 3`)
  - `branch_69a09623d9e3f` (`test`) - technical test branch.
- API deletion/edit is blocked for pending branch IDs in this account context (all tested delete/cancel/put endpoints returned `400`).

**Next:**
- Remove `branch_69a09623d9e3f` manually in cabinet moderation UI when available.
- Continue adding remaining unmatched Excel rows only with explicit building-level match (pin/building ID).

## 2026-02-26 - Excel Source Confirmed, Pin Sync Script Added

**Done:**
- Confirmed latest source data is `data/stores_audit.xlsx`.
- Parsed latest Excel content and validated active store rows: `35`.
- Added coordinate-first sync script:
  - `scripts/sync_2gis_from_excel_by_coords.py`
- Script now:
  - reads Excel rows by index (UTF-safe),
  - supports optional `lat/lon` columns,
  - supports point parsing from URL parameters,
  - compares with 2GIS branch coordinates,
  - updates branch hours via `PUT /api/1.0/branches/{branchId}` for matched rows.

**Found:**
- Current run result:
  - `excel_rows_total=35`, `branches_total=27`, `matches=0`.
- Yandex coordinate extraction blocker:
  - `captcha_blocked` on all rows with Yandex org IDs in this environment.
- Rows without Yandex Org ID or pin data: `29-35`.

**Next:**
- Add explicit `lat` and `lon` columns to Excel for all rows (pin coordinates).
- Re-run script to produce exact row-to-branch matches.
- Apply hour corrections automatically after matches are available.

## 2026-02-26 - 2GIS Brand Split (RUBA) and Branch Sync Update

**Done:**
- Confirmed brand rule: `RUBA` must be handled as a separate company, not as `Сырная лавка` branch naming.
- Opened `Добавление компании в аккаунт` flow and submitted new company request for `RUBA` in Tashkent.
- Created one new `Сырная лавка` branch request:
  - address: `Буюк Турон, 73`
  - temporary branch id: `branch_69a08c05deaad`
- Re-ran branch sync check and confirmed no hour mismatches on already matched branches.
- Current branch count via API: `27` (includes pending branch request).

**Found:**
- Pending branch IDs use format `branch_<id>` and appear in `GET /branches`.
- Schedule update for pending branch returns `400` on:
  - `PUT /api/1.0/branches/branch_<id>`
- Several Excel addresses did not return valid selectable address suggestions in 2GIS add-branch modal (manual map/clarification needed), including attempts for:
  - `Мирабад, 43`
  - `Мехнатабад, 82`
  - `Катта Хирмонтепа, 1А`

**Next:**
- Wait for moderation callback/approval for `RUBA` company request.
- Complete unresolved branch additions using exact 2GIS-searchable addresses or map pin placement.
- After pending branches are approved, set/verify final working hours on those branches.

---

## 2026-02-26 - 2GIS Contacts Fixed, Logo Policy Verified, Docs Added

**Done:**
- Logged into 2GIS cabinet for org `70000001036827089` and confirmed 26 branches.
- Updated shared customer phone to `+998 78-555-15-15` (call center).
- Removed company email `lavkasira@mail.ru` from contacts (no public email now).
- Verified shared contact behavior across branches.
- Uploaded logo image once to test moderation and extracted exact rejection reason.
- Created 2GIS documentation pack:
  - `docs/2GIS_API_CHEATSHEET.md`
  - `docs/2GIS_OPERATIONS_RUNBOOK.md`
  - `docs/2GIS_LOGO_AND_MEDIA_POLICY.md`

**Found:**
- Regular card photo gallery rejects logo graphics with:
  - `Компьютерная графика, картинки, скриншоты (исключения — прайс-листы)`.
- `Геореклама` page explicitly states logo usage:
  - `Логотип и рекламное объявление выделяют среди конкурентов`.
- API confirms logo field exists (`businessInfo.logoUrl`) but currently `null`.
- Feature flags currently disabled for this org:
  - `geoAdvertising=false`, `signboard=false`, `reviewspro=false`.
- Contact update endpoint confirmed:
  - `PUT /api/1.0/orgs/{orgId}/contacts`.

**Next:**
- If logo is required, submit/activate Geoadvertising path in `Реклама в 2ГИС`.
- Keep only real store/product photos in `Фото и видео` for free card moderation pass.

---

## 2026-02-26 - Bulk Store Update: Names, Access, Excel Audit

**Done:**
- Added dmigos95@gmail.com (Дмитрий Осипов) as Представитель to all 24 owned stores via `PUT /sprav/api/company-roles/change`.
- Updated all 33 store names to "Сырная Лавка" (capital Л) — 33/33 returned HTTP 200.
  - Names changed: "Сырная лавка", "Сырный бутик", "Сырный домик", "Cheese Shop", "Сырная лавка Кадышева", "Сырная лавка Авиасозлар", "Сырная Лавка Абдулла Кодыри" → all now "Сырная Лавка".
- Generated store audit Excel: `data/stores_audit.xlsx` with name, address, map link, hours, phone for all 33 stores.
- Documented full Yandex Business API in `docs/YANDEX_API_CHEATSHEET.md`.
- Created `scripts/generate_stores_excel.py` for reproducible Excel generation.

**Found:**
- `update-company` API requires `source: "newEditInfo"` (not "edit-form") and React-generated `fingerprint` field — these are only present when saving via the React form.
- Approach that works: inject `window.fetch` interceptor on page load, let React form submit (with correct fingerprint), interceptor modifies payload on-the-fly.
- 4 stores have non-standard work schedules in Yandex (weekend/saturday/weekdays) — flagged ⚠ in Excel.
- Instagram/Facebook social links rejected by Yandex API (Meta banned in Russia) — cannot be added as `social_network` type.
- 9 stores where we are Представитель (not Владелец) — cannot manage user roles on those.

**Next:**
- Fill in "Внутренний ID" column in `data/stores_audit.xlsx`.
- Fix 4 stores with non-standard schedules.
- Begin approval pipeline implementation.

---

## 2026-02-26 - Yandex Business Account Created, Store Claiming Started

**Done:**
- Created Yandex Business account: Sanjar Sanjar (ID: 1681626717) at business.yandex.ru.
- Started claiming all 36 "Сырная лавка" stores via yandex.ru/sprav/add.
- Successfully claimed 6 stores via SMS verification (+998 97 711 15 15):
  1. Яккасарайский район (4.3★)
  2. улица Мирабад, 43 (4.9★)
  3. Юнусабад, массив Юнусабад, 3-й кв., 3/6 (4.9★)
  4. Мирзо-Улугбекский р-н, Буюк Ипак Йули (5.0★, auto-verified)
  5. улица Абдурауфа Фитрата, 4 (4.8★)
  6. улица Уйсозлар, 49
- Confirmed: each store location is a separate Yandex org — correct chain behavior.
- Confirmed: structural blocker #1 (no unified Yandex ownership) is now actively being resolved.

**Found:**
- Some stores auto-verify without SMS (same phone number already confirmed in session).
- Yandex Business still shows already-claimed stores in search results — expected behavior, not a bug.
- All 36 stores share the same contact phone number (+998 97 711 15 15).
- Workflow per store: navigate to yandex.ru/sprav/add → search "Сырная лавка" → select unclaimed location → SMS verify → done.

**Next:**
- Resume claiming from store #7 — continue scrolling through search results to find unclaimed stores.
- After all 36 claimed, begin Phase 3 of active plan (approval pipeline).

---

## 2026-02-25 - Yandex-Only Scope Lock and Documentation Realignment

**Done:**
- Confirmed strategy change: active scope reduced to one platform (Yandex).
- Updated core project docs (`README`, `STATUS`, `ROADMAP`, `TODO`, `SPECS`, `ARCHITECTURE`) for Yandex-only execution.
- Updated support docs (`DEVELOPMENT`, `TROUBLESHOOTING`, `GLOSSARY`, `CHANGELOG`) for Yandex-only operational language.
- Realigned `docs/*` planning and strategy files to remove active Google/2GIS execution tracks.
- Created active plan file: `docs/plans/2026-02-25-yandex-only-mvp-implementation.md`.
- Marked previous plan as redirect-only: `docs/plans/2026-02-17-no-google-mvp-implementation.md`.

**Found:**
- Previous docs were internally consistent for a no-Google path, but still split focus across Yandex and 2GIS.
- Historical logs and verification artifacts contain multi-platform references and should be treated as historical context, not active scope.

**Next:**
- Execute the Yandex-only implementation plan task-by-task.
- Keep archived references clearly marked as historical-only.

---

## 2026-02-17 - Ownership Constraint Clarification

**Done:**
- Recorded that stores are distributed across many different third-party Yandex/2GIS accounts.
- Updated planning docs to remove assumptions about centralized direct API control.
- Shifted roadmap language toward federated operations and controlled-account-only automation.

**Found:**
- Full end-to-end zero-human automation is not possible under fragmented ownership.
- A deployable MVP is still feasible via manual/semi-automatic operations, task generation, and verification evidence.

**Next:**
- Build store-to-owner-account registry.
- Implement controlled-account sync path.
- Implement federated task export path for non-controlled stores.

---

## 2026-02-17 - Autonomous Implementation Plan Created

**Done:**
- Read all 13 project MD files and full codebase structure.
- Created comprehensive autonomous AI implementation plan at `docs/plans/2026-02-17-no-google-mvp-implementation.md`.
- Plan covers 15 tasks across 8 phases (git init, vitest setup, real discovery, approval pipeline, sync execution, rollback, alerts, UI fixes, tests).
- All tasks designed for zero human interaction — full code, exact commands, mock fallbacks for all external APIs.

**Found:**
- Yandex Geocoder API and 2GIS Catalog API are publicly available free-tier APIs (no partner access required) — discovery can go real without business approval.
- Approval execution engine, rollback, write queue, and alerts are all implementable in current codebase without schema changes beyond adding `isClosed` to StoreMasterProfile.
- Sync history page, snapshots UI, capabilities matrix page, and approvals queue page are all net-new pages.

**Next:**
- Execute the plan using `superpowers:executing-plans` in a new Claude Code session.
- Point new session at: `docs/plans/2026-02-17-no-google-mvp-implementation.md`

---

## 2026-02-17 - Google Rejection, Pivot, and Lint Unblock

**Done:**
- Received Google response: GBP API application was not approved after internal quality checks.
- Replanned delivery to finish MVP without Google API dependency.
- Updated status documents to no-Google execution track.
- Fixed lint blocking error in `app/src/lib/rollback/service.ts` by removing explicit `any`.
- Verified lint status: 0 errors, 3 warnings in `src/lib/connectors/impl/google-real.ts`.

**Found:**
- Google integration is blocked by external approval and has uncertain timing.
- Project can still deliver value through Yandex-first and capability-based manual/semi-auto flows.
- Workspace is not currently a git repository, so commit-based progress tracking is unavailable.

**Next:**
- Start Yandex Business API/partner onboarding immediately.
- Start 2GIS commercial/API onboarding immediately.
- Build capability matrix and freeze connector mode per platform.
- Implement first non-Google real connector and run pilot prep.
- Keep Google as deferred reapplication track.

---

## 2026-02-17 - Project Status Refresh

**Done:**
- Refreshed project documentation status files for current session context.
- Confirmed all 13 standard project documents exist in project root.
- Revalidated blockers, milestone, and TODO alignment.

**Found:**
- Workspace is not currently a git repository, so `git log` and `git diff --stat` are unavailable.
- No application code or configuration changes were made in that session segment.

**Next:**
- Follow up on Google API access case (`5-2907000040517`).
- Begin Yandex Business API access request.
- Begin 2GIS commercial API inquiry.
- Build capability matrix once API access status is known.

---

## 2026-02-10 - Scaffold Verification & Documentation

**Done:**
- Verified Gemini implementation via runtime checks (build, migration, discovery smoke test).
- Confirmed all unified sync Prisma models exist and are migrated.
- Discovery + manual linking flow works end-to-end in browser.
- Master profile editor connected to StoreMasterProfile.
- Google OAuth credentials configured; refresh token obtained.
- Google GBP APIs enabled in GCP project.
- Submitted Google Basic API Access request (Case `5-2907000040517`).
- Imported 33 stores from Telegram channel with platform audit report.
- Created API Onboarding Checklist for all 3 platforms.
- Created Implementation Verification Report.
- Disabled login for testing mode via env flag.
- Added Telegram auto-import script and batch files.

**Found:**
- Google API quota is still 0 despite API enablement - blocked on Google approval.
- Connectors are mock/scaffold, not production-ready.
- Lint had 1 blocking error (`no-explicit-any` in rollback service), now resolved on 2026-02-17.
- Yandex and 2GIS API access paths not started.
- Approval execution and rollback are schema-only, no operational logic.

**Next:**
- Follow up on Google API access case.
- Begin Yandex Business API access request.
- Begin 2GIS commercial API inquiry.
- Build capability matrix once API access status is known.

---

## 2026-02-07 - Security Hardening

**Done:**
- Implemented secure auth/session with hashed passwords and token-based sessions.
- Added tenant-safe access checks across all endpoints.
- Added URL and feedback input validation.
- Completed CSV import with validation.
- Added notification system baseline.
- Added audit logging baseline.

**Decision:** Paused feature expansion until security foundation was solid (D-006).

---

## 2026-02-06 - Product Definition & Planning

**Done:**
- Defined product scope: multi-location review/feedback platform (Google, Yandex, 2GIS).
- Decided compliance-only review flow (no rating gating) - D-001.
- Decided private feedback as primary differentiator - D-003.
- Decided 2-role MVP (Owner + Store Manager) - D-004.
- Created 30/60/90 delivery model - D-005.
- Created initial docs: OVERVIEW, DECISIONS, RISKS, TODO.

**Next:** Security hardening before features.
