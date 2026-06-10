# Progress Log

## 2026-06-09 (session 7) — Prod 500 outage fixed; TM grouping fixed (wrong sheet tab); 0-row report format; deployed & verified live

**Done:**
- **Fixed a production outage** (user asked "check if deployed; if not, deploy"). Found prod was deployed but serving **HTTP 500 on all 41 QR poster pages and the daily report**, while `/api/health` stayed green. Railway logs → `P2022: column Store.territorialManager does not exist`. The TM code shipped expecting the column but **prod never got it**: there's no `_prisma_migrations` table → prod is managed by `prisma db push`, not `migrate deploy` (entrypoint's `migrate deploy` is bypassed and would P3019 anyway — `migration_lock.toml` says `sqlite`). Fixed with a direct additive `ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "territorialManager" TEXT` against the public DB proxy. **41/41 posters back to HTTP 200**; this also un-broke the daily report (same column).
- **Fixed the TM grouping** (user: "this report not what I want — everything under Без менеджера"). manager-sync was `matched:0` because the hardcoded `SHEET_GID = 1105476357` had been silently reassigned to an unrelated **"Audit_Categories"** tab; the «Менеджеры» tab is now gid `1309841635`. Changed `manager-sync.ts` to resolve the tab by **title** (survived the reorg), gid as fallback. Validated live: **41/41 stores match across 4 TMs**.
- **Changed the report format** (user: "stores with 0 points should be shown under TM subcategories" → chose explicit rows): every store now renders as its own row under its TM, 0-review ones showing `0   —`, replacing the compact «Молчат:» line. Updated unit tests (8/8 green); typecheck clean. Committed `89e9d2c`.
- **Deployed** via GitHub Actions `workflow_dispatch` (REST dispatch — `gh` not installed; local `railway up` still OOMs). Deployment `37e5e1af` SUCCESS in ~2 min.
- **Verified live end-to-end:** health 200, voting slug 200, `sync-managers` → `matched:41` (was 0), daily report sent and **confirmed in the managers group** (msg 63841) with the new TM-grouped / 0-row format — rendered the exact message locally beforehand against real June-8 data as proof.

**Found / lessons (see MISTAKES.md):**
- A green health check that doesn't touch the DB hides a total data-layer outage; health endpoints should exercise a trivial DB read.
- Prod schema drift is silent and dangerous here: migrations don't auto-apply (db-push model), so any new Prisma column added in code 500s prod until pushed manually.
- A hardcoded Google Sheet **gid is not stable** — a spreadsheet reorg reassigned it to a different tab and the sync failed silently (`matched:0`, no error). Resolve tabs by title.

**Next session:**
- **Harden the prod migration pipeline** so schema changes auto-apply (the next added column will otherwise repeat today's outage): baseline `_prisma_migrations` against the db-push'd schema + fix `migration_lock.toml` (`sqlite`→`postgresql`) + confirm the entrypoint actually runs `migrate deploy` — a careful, separately-approved change.
- Make `/api/health` do a `SELECT 1` so an outage like this turns the health check red.
- Still pending: Railway free-tier-vs-paid decision; optionally assign the 2 unassigned stores in the sheet.

---

## 2026-06-08 (session 6) — TM-grouped reports built & merged; deploy peak-block diagnosed & fixed

**Done:**
- **Designed + built territorial-manager-grouped daily & weekly Telegram reports** (brainstorm → spec → Sonnet review → plan → subagent-driven TDD implementation, 12 commits merged to `main`). New format: global summary + Top-5, then a block per TM (4 managers) with a reviewed-stores table, named silent stores, and one universal «…молчат — продавцы не просят оценить…» line. Monthly left unchanged.
- **Manager mapping is sheet-driven:** added nullable `Store.territorialManager` (additive migration), a pure tested matcher (`manager-match.ts`), a sync module (`manager-sync.ts`, update-only) reading the "Менеджеры" Google Sheet tab, and `POST /api/admin/sync-managers`. Reused the existing `store-manager-tasks` service account (already had sheet access) → set `GOOGLE_SERVICE_ACCOUNT_JSON` on Railway. Sync runs first (best-effort) in the daily/weekly workflows. Fallback seed: `app/data/manager-assignments.json`.
- **Verified pre-deploy:** `next build` passes; tsc + ESLint clean; 13 vitest tests green — **41/41 real stores match** (Глоток collision guarded) and the 5-June fixture reconciles to 60 / 12-of-43 / 31 silent. Rendered the exact message locally — matches the approved template.
- **Diagnosed why the new reports weren't appearing** (user reported "reports not as we wanted"): production was still running OLD pre-merge code — `/api/admin/sync-managers` → 404. GitHub Actions API showed the nightly deploy of our merge FAILED Jun 7 & Jun 8 (Deploy-to-Railway step failed in ~2s = Railway peak-hours rejection). The "02:00 UTC" cron was firing ~06:40 UTC, inside the 06:00–18:00 UTC summer peak block.
- **Fixed the deploy timing:** moved nightly deploy to `0 20 * * *` + `0 23 * * *` (two off-peak attempts, GitHub-drift-tolerant), pushed to main (`8044eb9`, `e403343`). Validated the workflow YAML.

**Found / lessons (see MISTAKES.md):**
- A GitHub "off-peak" cron is NOT reliably off-peak — schedule drift of several hours can shove it into a provider's peak/blackout window. Place such crons early in the off-peak window with hours of slack, never near a boundary. (This recurred from the 2026-06-01 observation; now fixed at the deploy layer.)

**Next session:**
- After tonight's off-peak deploy: verify `/api/admin/sync-managers` returns `matched:41`, then confirm the 08:00 Tashkent daily report in the group is the new grouped format (pull Railway `manager_sync_done` + `message_built` logs). (Task #0)
- Then tune wording/thresholds if the user wants, and consider the same grouping for monthly.

**Also (later in session):**
- Pulled the nightly-deploy run history from the GitHub Actions API to check the user's hunch that deploys "weren't working well." Confirmed: **4 success / 10 failure overall**, and **7 of the last 8 nightly runs failed** — all the recent failures fired 06:35–07:06 UTC (inside peak); the historical successes fired ~19:39–20:36 UTC (off-peak), validating the move to 20:00/23:00 UTC. The single Jun 6 success fired 05:58 UTC (2 min before peak) and shipped old code.

**Pending user input / decisions:**
- **Railway free-tier vs paid:** decide whether to upgrade Railway (~$5/mo Hobby) to remove the peak-hours deploy block entirely (bulletproof) vs rely on the free-tier time fix + verify. The 7/8 recent-failure rate makes a case for upgrading.
- Optional: assign Катортол + Чилонзор Торговый to a manager in the sheet so they appear in a TM block.

---

## 2026-05-31 (session 5) — Deploy landed; reports/dashboard fixed; schedule moved to 07:00 Tashkent

**Done:**
- **Got the cloud deploy actually working and verified it.** Found the real build blocker: `app/src/lib/feedback-filters.ts` was imported by the dashboard + report-builder but never committed, so every `next build` failed "Module not found: '@/lib/feedback-filters'" (this, not just the memory crash, is why 6 days of deploys failed). Committed it (`b70450f`). Also fixed the build context: the Railway service Root Directory is `app`, so the cloud `railway up` must run from the **repo root** (snapshot needs an `app/` subdir) — updated the workflow (`c75e408`). Run #4 then built+deployed successfully.
- **Verified the fixes live:** `/login` now shows the single-password Russian UI (proves the new code is live); `/api/health` → `{"ok":true}`. User deployed the login from their phone (Run workflow) — confirmed that phone/cloud deploy works end-to-end.
- **Confirmed auto-deploy triggers automatically:** GitHub Actions runs #5 and #6 were "Scheduled" (not manual) and succeeded (~1m25s).
- **Rescheduled nightly deploy to 07:00 Tashkent (02:00 UTC)** — off-peak year-round, ~1h before the 03:00 UTC daily report (`77792a9`). Added a "Log trigger context" step (schedule vs manual, time, SHA); hardened it against GitHub Actions script injection per security review (context via `env`) (`6a83870`).
- **Fixed daily report regression:** deployed daily report was the old compact "Отчет за сегодня" table covering TODAY; the detailed previous-day format was uncommitted. Committed it (`a14dbf5`).
- **Fixed dashboard "Последние голоса":** was filtered to comment-only rows (`COMMENT_ROW_FILTER`) so pure 5★ votes showed "нет"; switched to `VOTE_ROW_FILTER` + breakdown (`9a53319`).
- **Verified no vote data loss** by querying the prod DB directly (votes record in real time; it was a display issue).
- **Committed all remaining live-but-uncommitted prod source** (`30659e9`): analytics feedback/stores routes, store admin pages, google-real, platform-links, brands.runtime. `tsc --noEmit` clean throughout.

**Found / lessons (see MISTAKES.md):**
- Production had been running **uncommitted working-tree code** — the old local `railway up` uploaded the working folder, so improvements that were never committed were silently live. Switching to cloud deploys (committed code only) reverted them (the daily report was the visible symptom). Fixed by committing everything → committed == deployed.

**Next session:**
- After the 07:00 Tashkent auto-deploy: verify the daily report (08:00) is the detailed previous-day format and the dashboard "Последние голоса" lists all votes (Task #1).
- Optional: move weekly/monthly off the compact table if a detailed format is wanted (they're scheduled correctly: Mon 08:00 / 1st 08:00 Tashkent).

---

## 2026-05-29 (session 4) — Diagnosed & repaired the broken nightly deploy

**Context:** User reported the bot sent the OLD raw "New feedback received" messages today instead of the approved «Мы подвели клиента» template, and asked whether it was because nothing was deployed.

**Done:**
- **Diagnosed why the 05-24 template (and all later work) never went live.** The live deployment is `railway up · 6 days ago via CLI` (~05-23) — confirmed on the Railway dashboard. The nightly 23:05 `railway up` has crashed at "Indexing…" (Rust OOM) every night since 05-24; logs prove it (`logs/railway-night-deploy-2026-05-23*.log` succeeds with Uploading + Build Logs URL; 05-24/26/27/28 stop at "Indexing…"). Some nights had no log at all — task skipped on battery/sleep.
- **Confirmed the peak-hours block on-screen.** Railway dashboard shows free-tier deploys to `europe-west4-drams3a` blocked 08:00–20:00 Amsterdam. The dashboard Deploy button bounced when clicked during peak.
- **Confirmed the `web` service IS GitHub-connected** ("branch connected to production → changes auto-deployed"), but the project's own cheatsheet (05-18) already notes GitHub auto-deploy is unreliable — hence the local nightly task.
- **Set up reliable cloud deploy:** `.github/workflows/nightly-railway-deploy.yml` runs `railway up --service web --ci` at 18:05 UTC (23:05 Tashkent) from a cloud runner. Created Railway production project token, added it as repo secret `RAILWAY_TOKEN` (via browser; token moved by clipboard, never transcribed). Verified the workflow is registered in Actions with the `workflow_dispatch` button.
- **Hardened the local backup task:** rewrote `scripts/railway-night-deploy.ps1` (detect Indexing crash → retry once → Telegram alert on failure; UTF-8 logs). Re-registered the Windows task from `scripts/pinbox-night-deploy-task.xml` via `scripts/register-night-deploy-task.ps1` with `DisallowStartIfOnBatteries=false` + `WakeToRun=true`. Verified live settings via `schtasks /query`.
- Committed on branch `chore/nightly-deploy-reliability`, fast-forward-merged to `main`, pushed (`d8af121`). Updated CLI 4.31→4.65 along the way (still crashed at Indexing under session memory load, so the cloud path is the real fix).

**Found:**
- `railway up` on this laptop crashes at "Indexing…" with a Rust memory-allocation error under load — independent of `node_modules` and project size; the allocation shrank as the indexed tree shrank but still failed even at ~126 MB, pointing at local memory pressure. The cloud runner sidesteps it entirely. Lessons recorded in MISTAKES.md.
- `schtasks.exe` works where the `Get-/Register-ScheduledTask` CIM cmdlets hang on this machine — but git-bash mangles `/query`-style flags into paths unless `MSYS_NO_PATHCONV=1` is set.

**Next session:**
- **Verify the 23:05 Tashkent 2026-05-29 deploy** went green (GitHub Actions run + fresh Railway deployment replacing the 6-day-old one) and that the live bot now emits the «Мы подвели клиента» template. (Auto-verification scheduled.)
- Confirm the other stuck 05-24 work also went live: single-password login UI at `/login`, corrected dashboard vote counts, dashboard trend charts.
- Consider moving the daily/weekly/monthly + deploy crons fully off the laptop (they already are for reports; deploy now is too).
- Winter-DST note: 18:05 UTC is inside Amsterdam peak in winter — bump the workflow cron to `5 19 * * *` around November.

---

## 2026-05-24 (session 3) — Simplified team login, TEAM_PASSWORD env var set

**Done:**
- **Replaced email-based login with single-password login.** User requested removal of email field; single password field for the trusted local team. `app/src/app/login/login-form.tsx` fully rewritten: one password input, Russian labels ("Сырная Лавка — Команда" / "Пароль" / "Войти"), `autoFocus` on password field. `app/src/app/login/actions.ts` fully rewritten: reads `process.env.TEAM_PASSWORD`, lazy-creates `team@kaas.local` singleton OWNER user on first successful login (or finds existing one under the first OWNER tenant, creating a "KAAS" tenant if none exists), creates session, audit-logs LOGIN_SUCCESS / LOGIN_FAILED, all error strings in Russian.
- **Security pushback → deferred to user judgment.** Flagged that dashboard is internet-facing (`web-production-370c1.up.railway.app/admin`) and `<redacted>` is trivially brute-forceable. Offered three alternatives. User chose `<redacted>`. Per the operating agreement ("Defer to user judgment"), implemented as requested after two rounds of pushback.
- **Set `TEAM_PASSWORD=<redacted>` in Railway.** Used `railway variables --set TEAM_PASSWORD=<redacted> --service web`. Initial error appeared (peak-hours redeploy block) but verified the WRITE succeeded via `railway variables --service web --kv | grep TEAM_PASSWORD` (returned masked `TEAM_PASSWORD=*******`). Visual confirmation via Railway dashboard in claude-in-chrome.
- **Deploy plan unchanged:** Both vote-count fix code and simplified login code are unstaged in working tree. `Pinbox-Railway-Night-Deploy` at 23:05 Tashkent will deploy both together. Env var is already live.

**Found:**
- `railway variables --set` does TWO things: write the variable AND trigger a redeploy. During free-tier peak hours, the redeploy is blocked, but the WRITE succeeds. The error message ("Free-tier deploys not available during peak hours") makes the whole operation look like it failed. Verify writes with `railway variables --service X --kv | grep VAR` immediately after. Recorded in MISTAKES.md.

**Next session:**
- After 23:05 deploy: open `/login` — verify single-password Russian UI. Enter `<redacted>` → confirm `/admin` loads.
- Verify dashboard vote counts still correct post-deploy.
- Add `workflow` scope to PAT.
- Consider rate-limiting `/login` POST (trivial password + public URL = bot brute-force risk).

---

## 2026-05-24 (session 2) — Dashboard vote double-counting bug fixed

**Done:**
- **Investigated and fixed dashboard/report vote double-counting bug.** User reported: Юнусабад store at 11:58/11:59 showed 2 votes but was one customer. Root cause: `client.tsx` calls the server action twice per low-score session — first writes `{comment: "[ratings] service:X;quality:Y;prices:Z;..."}`, second writes the free-text comment with `deviceId + "-comment"` to bypass the 35-day check. Dashboard at `admin/page.tsx:136` counts both rows. Daily report + weekly + monthly also count both.
- **Created `app/src/lib/feedback-filters.ts`** exporting `VOTE_ROW_FILTER` (`comment.startsWith("[ratings] service:")`) and `COMMENT_ROW_FILTER` (inverse). Dashboard counts use `VOTE_ROW_FILTER`; "Latest feedback" display uses `COMMENT_ROW_FILTER`. Daily + weekly + monthly report queries all filter by votes only.
- **Verified against production DB** via `railway run` + Postgres public proxy. Last 7 days: 232 rows → 230 vote rows (2 comment rows correctly hidden). Юнусабад: 6 → 5 (the "Xama joy bardak" row confirmed as comment follow-up). Метро Чиланзар: 6 → 5 (★3 "Сервис" follow-up).
- **Approach chosen:** Option C — read-side filter. Rationale from Opus subagent: no migration needed on a frozen production DB; corrects historical counts immediately; zero risk to the nightly cron. Better than Option A (write-time dedup, touches rate-limiter, higher risk) or Option B (schema migration, requires production downtime/backwards compat).
- **Deploy:** Manual `railway up` blocked by free-tier 08:00–20:00 Amsterdam blackout. Confirmed Windows Scheduled Task `Pinbox-Railway-Night-Deploy` at 23:05 Tashkent will pick up the fix automatically tonight. Flagged `WakeToRun = False` as a risk.
- **Verified:** `npx tsc --noEmit` exit 0; `npm run lint` clean.

**Found:**
- Lesson recorded in MISTAKES.md: two-writer pattern (`vote` row + `comment` row from the same visit) masked by Telegram alert dedup (`sessionKey`) while counts silently inflated. When two code paths write to the same table for "one event," at least one read aggregation will eventually be wrong.

**Next session:**
- Verify tonight's deploy (after 23:05 Tashkent) — dashboard vote counts should match store visits.
- Add `workflow` scope to PAT.
- Optional: fix the two-rows-per-visit pattern at the source (write-time dedup or a `kind` column).

---

## 2026-05-24 (session 1) — Russian alert template, debounce buffer, weekly + monthly report crons

**Done:**
- **Rewrote low-rating Telegram alert template** (commit `ddd384b`). Old template: English "New feedback received" with plain Store/Rating/Comment lines. New template: Russian, shaming tone, per-question breakdown (Сервис/Качество/Цены), Tashkent-formatted timestamp, brand «KAAS Сырная Лавка», @-mentions of on-shift managers. Implemented in `app/src/lib/notifications.ts` (Intl.DateTimeFormat Asia/Tashkent formatter + new `buildMessage` + `buildFollowUpCommentMessage`). Wired to `app/src/app/[slug]/actions.ts`.
- **Added in-memory debounce buffer** (`app/src/lib/feedback-alert-buffer.ts`, new file). Customer's single visit generates two server calls (vote then comment), which previously caused two Telegram messages. The buffer keys by `storeId:baseDeviceId` and holds a 30-second timer: the comment call cancels the timer and sends one merged message. Late comments (>30s after vote timer fired) get a short follow-up `buildFollowUpCommentMessage`. Single-process assumption (Railway one replica via `next start`) documented in file.
- **Added weekly Telegram report cron** (commit `052bfbf`). `.github/workflows/weekly-telegram-report.yml` fires `POST /api/reports/weekly` at `0 3 * * 1` UTC (Mondays 08:00 Tashkent). Reuses `REPORTS_API_KEY` secret. `workflow_dispatch` for manual runs.
- **Added monthly Telegram report cron** (commit `1010e89`). `.github/workflows/monthly-telegram-report.yml` fires `POST /api/reports/monthly` at `0 3 1 * *` UTC (1st of month 08:00 Tashkent). Same pattern.
- **Verified:** 8 unit assertions on parser/formatter/debounce; `npx tsc --noEmit` clean; `npm run lint` clean on all 3 changed files; live `buildMessage` output previewed in managers group (message IDs 62913–62925).

**Found:**
- GitHub PAT `telegram-ai-agent deploy` lacks `workflow` scope — can't push `.github/workflows/` files via CLI. Worked around with GitHub web UI. Long-term fix: add `workflow` scope to the PAT.
- CodeMirror 6 auto-indent compounds on each newline during keystroke-based typing in the GitHub web editor; must use `execCommand('insertText')` for multi-line content.
- Railway free-tier deploy blackout runs 08:00–20:00 Amsterdam time. Existing `Pinbox-Railway-Night-Deploy` task (23:05 Tashkent = 20:05 CEST) already threads the needle.
- **Pre-existing bug discovered:** The voting client appends `-comment` to `deviceId` for the free-text comment submission. This creates two Feedback DB rows per visit with different `deviceHash` values. Consequences: (1) analytics over-count low-rating sessions; (2) the 35-day anti-abuse check never fires for the comment row, allowing unlimited free-text submissions per device. NOT fixed today — scope discipline.

**Next session:**
- Verify tonight's `Pinbox-Railway-Night-Deploy` (23:05 Tashkent) picked up commit `ddd384b`. After deploy: scan a real poster → leave 1–2/5 → type a comment → confirm ONE merged Russian-template message arrives in the managers group.
- Add `workflow` scope to PAT `telegram-ai-agent deploy`.
- Fix the `-comment` deviceId double-counting bug (two Feedback rows per visit, anti-abuse bypass).

---

## 2026-05-21 (end of session) — Power BI access provisioned, nightly deploy fixed, Russian dashboard queued

**Done:**
- **Power BI analyst access fully provisioned and verified end-to-end.** Generated Railway Postgres public TCP domain `metro.proxy.rlwy.net:36355`. Created `bi_readonly` Postgres role with SELECT-only privileges on the `public` schema via a one-off Prisma script (script deleted after run). Verified live: `SELECT count(*) FROM "Store"` = 43 rows, `SELECT count(*) FROM "Feedback"` = 35 rows; UPDATE attempt returns PostgreSQL `42501 permission denied for table Feedback`. Connection values handed to owner; password is NOT in any git-committed file.
- **Russian dashboard translation committed and queued for tonight's auto-deploy.** 15 user-facing English strings in `app/src/app/admin/page.tsx` translated to Russian; date locale switched from `en-GB` to `ru-RU` in three formatters; `npx tsc --noEmit` passes. Deploy queued via Windows Scheduled Task `Pinbox-Railway-Night-Deploy` at 23:05 Tashkent (20:05 CEST).
- **Night-deploy script bug fixed.** `scripts/railway-night-deploy.ps1` was running `railway up` from repo root instead of `app/` subdir (Railway requires `railway.json` in CWD; root has none). Fixed: script now does `Push-Location (Join-Path $ProjectRoot 'app')` before invoking `railway up`.

**Found:**
- Railway free-tier peak-hours block (8 AM – 8 PM CEST = approximately 13:00 – 01:00 Tashkent next day) prevents manual `railway up` during those hours. Attempting deployment mid-afternoon was silently failing. The nightly Windows Scheduled Task at 23:05 Tashkent (= 20:05 CEST) fires just after the block lifts and is the correct deployment path on the free plan.

**Next session:**
- Verify that tomorrow's 08:00 Tashkent GitHub Actions cron actually delivered to the managers Telegram group.
- Confirm Russian dashboard is live in production after the 23:05 deploy.
- Analyst connects Power BI to `metro.proxy.rlwy.net:36355` with `bi_readonly` credentials and sends first dashboards.

---

## 2026-05-21 (afternoon) — Cron Activation, QR Slug Freeze, Analyst Onboarding

**Done:**
- Created GitHub Actions scheduled workflow `.github/workflows/daily-telegram-report.yml` to fire `POST /api/reports/daily` at 03:00 UTC (08:00 Tashkent) every day. Bypasses Railway free-plan resource limit.
- Added `REPORTS_API_KEY` to GitHub repo secrets.
- Verified run #1: green in 10 seconds, log shows `{"ok":true,"sent":true}`, Telegram managers group received the report.
- Hardened the curl with `--retry 3 --retry-delay 30 --retry-all-errors --max-time 60 --fail-with-body` so transient Railway hiccups self-heal and failure bodies are visible in workflow logs.
- Froze the 41 printed QR slugs at the application layer: Prisma client extension in `app/src/lib/db.ts` rejects any `update`/`updateMany`/`upsert` that includes `slug` in the payload (deployed to Railway, exit code 0).
- Created `data/qr-links-frozen-2026-05-21.json` — versioned backup of every printed slug → store mapping. If the DB is ever lost, this file is the source of truth.
- Wrote `docs/QR_SLUG_PROTECTION.md` (full rule + restore procedure + exceptions policy) and added `D-033` to `DECISIONS.md`.
- Created project-level `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` (identical content) so any AI assistant sees the QR-freeze rule and other project rules on first read.
- Created `docs/ANALYST_POWER_BI_MESSAGE.md` — 4-step Railway runbook for owner + ready-to-send Russian message for the analyst, including 6 default Power BI report ideas. Backed by `app/scripts/create-bi-readonly.sql`-style SQL embedded in the doc.
- Verified all analytics endpoints in production: `GET /api/analytics/feedback`, `GET /api/analytics/feedback?from=…&to=…`, `GET /api/analytics/stores` all return 200 with Bearer auth; 401 without.
- Dispatched a Haiku subagent to translate the admin dashboard to Russian. 15 replacements applied to `app/src/app/admin/page.tsx`; locale changed from `en-GB` to `ru-RU` in three date formatters; typecheck passed. Awaiting deploy.

**Found:**
- GitHub PATs without the `workflow` scope cannot push files under `.github/workflows/`. Workaround used: created the file via GitHub web UI (uses browser cookies, not PAT).
- GitHub web editor (CodeMirror 6) auto-indents on every newline, which compounded indentation when typing the YAML via keystrokes. Workaround: `document.execCommand('insertText', false, content)` after select-all+delete, which inserts atomically and bypasses autoindent.
- 34 real customer votes already in the production database. Today alone: 5 fresh votes. Авиасозлар has 4 votes (avg 5.0) and 110 QR scans — the 110/4 ratio is normal because scans include staff testing, link-preview crawlers, and refreshes; only ~3-4% of scans typically convert to votes.

**Next:**
- Deploy the Russian dashboard translation (`cd app && railway up --service web`).
- Owner runs the 4-step Railway runbook in `docs/ANALYST_POWER_BI_MESSAGE.md` to generate `bi_readonly` password + public TCP domain, then sends the message to the analyst.
- Tomorrow morning: verify automatic 08:00 Tashkent cron actually delivers.
- Cleanup: remove `scripts/tmp-check-a5-qr.cjs`, `scripts/audit-a5-poster-links.cjs`, and the stray file literally named `console.log(JSON.stringify(row)))` in repo root.

---

## 2026-05-21 - Dashboard, Telegram Reports, Analytics, and 35-Day Vote Cooldown

**Done:**
- Reviewed and kept the product scope aligned: QR feedback plus store/listing operations, not social media publishing.
- Deployed dashboard/reporting/API changes to Railway from `app/`.
- Fixed Railway public runtime port alignment by exposing `8080` in `app/Dockerfile`.
- Verified Railway production deploys reached `SUCCESS`; latest verified deployment is `2910bbab-4695-4509-8235-1368130f4cad`.
- Verified production health from the Railway container: `/api/health` returned `200`.
- Updated the admin dashboard to a light analytics view with daily, weekly, monthly, and yearly period controls.
- Added `GET /api/analytics/stores` and kept `GET /api/analytics/feedback` Power BI-friendly with Bearer auth.
- Set Telegram production variables and manually sent the missed daily report; production returned `{"ok":true,"sent":true}`.
- Changed daily Telegram reports to cover yesterday's full Tashkent day, matching the 08:00 morning report requirement.
- Changed the device vote cooldown from once per 7 days to once per 35 days per store.
- Verified with `npm run lint` and `npm run build`.

**Found:**
- Railway scheduled Function creation for `daily-report-cron` failed with `Free plan resource provision limit exceeded`.
- The report can be sent manually through `POST /api/reports/daily`; only the automatic 08:00 schedule remains blocked.

**Next:**
- Choose scheduling path for the 08:00 Tashkent daily Telegram report: upgrade Railway resources or use Windows Task Scheduler/external cron.
- Commit or otherwise preserve the uncommitted deploy changes before the next large work session.

---
## 2026-05-18 - 41/41 QR Production Completion + Railway Deploy Fix

**Done:**
- Deployed new code to Railway (deployment `df05f88f` SUCCESS) via `railway up` from `app/` subdirectory.
- Root cause of previous deploy failures identified and fixed: 47MB of `test-output/` images were not gitignored, causing upload timeouts; root-level CLI deploys were using wrong `railway.json` path.
- `archivedAt DateTime?` added to Store model with Prisma migration � applies automatically on container start via `docker-entrypoint.sh`.
- Brand theming system deployed (`app/src/lib/brands.ts` + `brands.runtime.mjs`) with per-brand voting page (`kaas` / `glotok` / `ruba`).
- Admin API endpoints deployed: `/api/admin/repair-a5-links`, `/api/admin/qr-check`, `/api/admin/create-missing-stores`.
- Analytics/reports endpoints deployed: `/api/analytics/feedback`, `/api/reports/{daily,weekly,monthly}`.
- Called `POST /api/admin/repair-a5-links` with `clearFeedback: true` � result: 14 test votes cleared, ������ �������� (`4c5350`) and ������ ��������� (`e96943`) created as separate DB stores.
- Full A5 health check confirmed: **41/41 posters = HTTP 200**, 41 unique slugs, 0 duplicates, 0 placeholders.
- `REPORTS_API_KEY=<REPORTS_API_KEY>` set in Railway variables.
- `RAILWAY_CHEATSHEET.md` updated with deploy lessons, admin endpoint docs, and post-deploy checklist.

**Found:**
- Railway's `startCommand` service override sends the command as a CMD argument to the ENTRYPOINT (does not bypass it). `prisma migrate deploy` ran correctly despite not appearing in the runtime logs Railway shows.
- GitHub auto-deploy integration did not trigger on push (delay or webhook issue). CLI deploy from `app/` is the reliable path.

**Next:**
- Enable Telegram daily report scheduler (M5) when vote volume is sufficient.
- Remove `scripts/tmp-*.cjs` helper scripts.

---

## 2026-05-17 - Scheduling + QR Health Audit + Report Logic Finalization

**Done:**
- Implemented and verified report ranking logic: sort by vote count first, then average score.
- Added analytics API endpoint for BI/Power BI use: `GET /api/analytics/feedback`.
- Created scheduled tasks:
  - `Pinbox-Railway-Night-Deploy` (daily `23:05`)
  - `Pinbox-Telegram-Daily-Report` (daily `22:00`, then intentionally disabled).
- Ran full QR URL audit for approved A5 batch (`41` posters).
- Auto-replaced placeholder QR slugs in `21` poster files.

**Found:**
- Initial A5 health check: `14/41` OK, `27/41` 404.
- After placeholder repair: `35/41` OK, `6/41` 404.
- Remaining 6 are blocked by missing production slugs, not template issues.

**Artifacts:**
- `docs/qr-url-health-check-a5-2026-05-17.json`
- `docs/qr-url-health-check-2026-05-17.json`

**Next:**
- Add the 6 missing stores/slugs in production DB.
- Re-run poster fix and confirm `41/41` health.

---

## 2026-05-17 - PM Scope Added for Gemini Execution

**Done:**
- Converted the next implementation wave into PM-controlled tasks.
- Added explicit tasks for:
  - poster text/Unicode correction
  - voting-page and poster design unification
  - 3-version consistent branding
  - regeneration and owner UAT sign-off
- Prepared a dedicated execution prompt file for Gemini.

**Found:**
- Railway should remain unchanged; work is UI/content/design-system + generation pipeline only.
- Main risk is style drift between poster and voting page if shared tokens are not enforced.

**Next:**
- Run Gemini prompt.
- Review Gemini evidence bundle (files changed, commands, screenshots).
- Move to owner testing and final approval.
