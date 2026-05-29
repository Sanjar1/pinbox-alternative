# Progress Log

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
- **Security pushback → deferred to user judgment.** Flagged that dashboard is internet-facing (`web-production-370c1.up.railway.app/admin`) and `12345` is trivially brute-forceable. Offered three alternatives. User chose `12345`. Per the operating agreement ("Defer to user judgment"), implemented as requested after two rounds of pushback.
- **Set `TEAM_PASSWORD=12345` in Railway.** Used `railway variables --set TEAM_PASSWORD=12345 --service web`. Initial error appeared (peak-hours redeploy block) but verified the WRITE succeeded via `railway variables --service web --kv | grep TEAM_PASSWORD` (returned masked `TEAM_PASSWORD=*******`). Visual confirmation via Railway dashboard in claude-in-chrome.
- **Deploy plan unchanged:** Both vote-count fix code and simplified login code are unstaged in working tree. `Pinbox-Railway-Night-Deploy` at 23:05 Tashkent will deploy both together. Env var is already live.

**Found:**
- `railway variables --set` does TWO things: write the variable AND trigger a redeploy. During free-tier peak hours, the redeploy is blocked, but the WRITE succeeds. The error message ("Free-tier deploys not available during peak hours") makes the whole operation look like it failed. Verify writes with `railway variables --service X --kv | grep VAR` immediately after. Recorded in MISTAKES.md.

**Next session:**
- After 23:05 deploy: open `/login` — verify single-password Russian UI. Enter `12345` → confirm `/admin` loads.
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
- `REPORTS_API_KEY=pinbox-reports-2026-secure` set in Railway variables.
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
