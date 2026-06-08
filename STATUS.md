# Status

**Updated:** 2026-06-08 (session 6 — TM-grouped reports built & merged; deploy timing fixed)

## Current Phase

`M5 — Reporting Activation — Territorial-manager-grouped daily/weekly reports are BUILT, fully unit-tested, and merged to main (12 commits), but NOT yet live: the nightly deploy had been silently peak-blocked for days (GitHub fired the 02:00 UTC cron ~4.5h late, into Railway's 06:00–18:00 UTC peak block), so prod still runs old pre-merge code (the /api/admin/sync-managers endpoint 404s). Fixed by moving the nightly deploy to 20:00 + 23:00 UTC (off-peak, GitHub-drift-tolerant). Awaiting tonight's automatic off-peak deploy; the new grouped report should first appear in the managers group at 08:00 Tashkent on the next day. Live verification (sync matched:41 + the grouped Telegram message) still pending.`

## What Is Done (2026-06-08, session 6)

### TM-grouped Telegram reports (built, merged to main, awaiting deploy)
- **New report format:** daily + weekly reports now open with a global summary (denominator 43) + 🏆 Top-5, then one block per **territorial manager** (4 TMs) — each with a monospace table of that TM's stores that got reviews, a `Молчат: …` list of silent stores, and one universal line «{silent} из {total} магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.». Monthly report unchanged.
- **Manager mapping synced from Google Sheet:** new `Store.territorialManager` column (additive migration, slug guard untouched), populated by `POST /api/admin/sync-managers` which reads the "Менеджеры" tab of the manager Google Sheet via the **reused `store-manager-tasks` service account** (already had sheet access; env `GOOGLE_SERVICE_ACCOUNT_JSON` set on Railway). Update-only (never creates a store). Committed fallback: `app/data/manager-assignments.json` (41 stores). Sync runs as the first, `continue-on-error` step of the daily/weekly report workflows.
- **Verified pre-deploy:** `next build` passes; tsc + ESLint clean; 13 vitest unit tests green — incl. **41/41 real stores match** (Глоток-Юнусабад/Юнусабад collision provably avoided) and the 5-June fixture reconciling to 60 / 12-of-43 / 31 silent. Rendered the exact message locally; matches the approved template.
- **Spec + plan + Sonnet review** in `docs/superpowers/specs|plans/2026-06-06-tm-grouped-telegram-reports*`. Setup notes: `docs/MANAGER_SYNC_SETUP.md`.
- **2 stores have no manager in the sheet** (Катортол, Чилонзор Торговый): they count in global totals but get no block (a quiet nudge to assign them).

### Deploy timing bug fixed (the reason the above wasn't live)
- Root cause (evidence via GitHub Actions API + Railway): the nightly deploy of our merge (`69ae6aa`) FAILED on Jun 7 & Jun 8 — the "Deploy to Railway" step failed in ~2s = Railway peak-hours rejection, because GitHub fired the `0 2 * * *` schedule at ~06:40 UTC (inside summer peak 06:00–18:00 UTC). Last success built old pre-merge code.
- Fix (`8044eb9`, `e403343`): nightly deploy cron `0 2 * * *` → **`0 20 * * *` + `0 23 * * *`** (two off-peak attempts, ~10h of GitHub-drift tolerance before peak resumes, both land before the 03:00 UTC report). See MISTAKES (recurring lesson) + D-046.
- **Quantified the reliability problem** (GitHub Actions run history): nightly deploy = 4 success / 10 failure overall, and **7 of the last 8 nightly runs FAILED** (Jun 1–8, all firing 06:35–07:06 UTC inside peak). The successful runs historically fired ~19:39–20:36 UTC — exactly the off-peak window the fix now targets. **OPEN DECISION (needs user):** stay on the free-tier fix (verify tomorrow) vs upgrade Railway (~$5/mo Hobby) to remove the peak block entirely and make deploys reliable at any time.

## What Is Done (2026-05-31, session 5)

### Deploy actually landed + real root causes found
- **Cloud deploy works & is verified:** GitHub Actions runs #5 and #6 were "Scheduled" (automatic) and succeeded (~1m25s full build+deploy). The login change is live (verified `/login` shows the single-password Russian UI).
- **Real build blocker (why 6 days of failure):** `app/src/lib/feedback-filters.ts` was imported by `admin/page.tsx` + `report-builder.ts` but **never `git add`-ed** → every cloud build failed `next build` with "Module not found: '@/lib/feedback-filters'". Now committed.
- **Build context fix:** Railway service **Root Directory = `app`**, so the cloud `railway up` must upload from the **repo root** (snapshot needs an `app/` subdir). Workflow updated to run from repo root. (App-relative `COPY` paths in the Dockerfile require context = `app/`.)
- **Schedule moved to 07:00 Tashkent (02:00 UTC):** off-peak in every season (fixes old winter risk), ~1h before the 03:00 UTC daily report. Added trigger-context logging (security-hardened: context via `env`, not inline `${{ }}`).

### Reports + dashboard fixed (committed; ship next auto-deploy)
- **Daily report regression fixed:** the deployed (committed) daily report was the old compact "Отчет за сегодня" table covering TODAY. The detailed "Ежедневный отчет по QR-отзывам" (previous full Tashkent day, summary + all 43 stores, `VOTE_ROW_FILTER` counts) was uncommitted working-tree code — now committed (`a14dbf5`).
- **Dashboard "Последние голоса" fixed:** it used `COMMENT_ROW_FILTER` (only votes with a typed comment) so pure 5★ votes showed "Голосов за этот период нет". Switched to `VOTE_ROW_FILTER` + render the Сервис/Качество/Цены breakdown (`9a53319`).
- **Verified NO vote data loss:** queried prod DB directly — votes record in real time (Чилонзор 21, Метро Чиланзар, Food city, Фергана on 05-30). It was a display issue, not loss.
- **Committed all remaining live-but-uncommitted prod files** (`30659e9`): analytics feedback/stores routes, store admin pages, google-real connector, platform-links, brands.runtime. `tsc --noEmit` clean.

### Earlier this session (2026-05-29, deploy reliability) — historical
- Diagnosed the silent nightly-deploy failure (local `railway up` crashed at "Indexing…", Rust OOM ~2 GB the loaded laptop couldn't allocate). Built the cloud GitHub Actions deploy + `RAILWAY_TOKEN` secret; hardened the local Windows task (retry + Telegram alert; WakeToRun; runs on battery).
- Peak-hours fact: free-tier EU West deploys blocked 08:00–20:00 Amsterdam.

## Product Truth

- This app is QR voting + store/listing operations.
- Customers scan a poster QR, vote 1–5 stars + optional comment; data lands in Postgres for the admin dashboard, the daily/weekly/monthly Telegram reports, and external Power BI reporting.
- Brand name in Telegram copy: **«KAAS Сырная Лавка»**.

## What Is Done (as of 2026-05-24, session 3)

### Simplified team login — DONE today (ships at 23:05 Tashkent deploy)
- **What changed:** Removed email-field from the login page. Now a single password field. Russian UI: header "Сырная Лавка — Команда", label "Пароль", button "Войти".
- **Auth flow:** `app/src/app/login/actions.ts` accepts `password` only. Compares to `process.env.TEAM_PASSWORD`. On match, lazy-creates singleton `team@kaas.local` OWNER user (or finds existing one). Creates session as that shared user. Audit-logs LOGIN_SUCCESS / LOGIN_FAILED. All error messages in Russian.
- **Env var:** `TEAM_PASSWORD=12345` set in Railway via `railway variables --set`. Verified present via `railway variables --service web --kv | grep TEAM_PASSWORD`. Initial write appeared to fail (peak-hours redeploy block) but the write itself succeeded.
- **Tradeoffs accepted (D-040/D-041):** Trivial password on a public-internet URL; shared identity means audit log cannot distinguish individual team members; existing email-based users locked out. Change password anytime via Railway env var — no code change needed.
- **Deploy:** Both login change and vote-count fix ship together at 23:05 Tashkent via `Pinbox-Railway-Night-Deploy`.

### Dashboard vote double-counting bug — FIXED today (session 2)
- **Root cause:** `app/src/app/[slug]/client.tsx` calls the server action twice per low-score session: first writes `{comment: "[ratings] service:X;quality:Y;prices:Z;..."}`, second writes the user's free-text comment with `deviceId + "-comment"` to bypass the 35-day anti-abuse check. Dashboard + daily report both count both rows.
- **Verification:** Last 7 days: 232 rows → 230 vote rows (2 follow-ups correctly hidden). Юнусабад: 6 → 5 (the "Xama joy bardak" row was the comment follow-up). Метро Чиланзар: 6 → 5 (★3 "Сервис" follow-up).
- **Fix:** NEW file `app/src/lib/feedback-filters.ts` exports `VOTE_ROW_FILTER` + `COMMENT_ROW_FILTER`. Dashboard counts use `VOTE_ROW_FILTER`; "Latest feedback" display uses `COMMENT_ROW_FILTER`. Daily + weekly + monthly reports all filter by votes only.
- **Approach:** Option C — read-side filter (no migration on frozen production DB; corrects historical counts immediately). Chose over write-side dedup (A) or schema migration (B) per Opus subagent recommendation.
- **Deploy:** Manual `railway up` blocked by free-tier peak hours. Existing Windows Scheduled Task `Pinbox-Railway-Night-Deploy` at 23:05 Tashkent will deploy automatically. Flagged `WakeToRun = False` as a risk if laptop sleeps.
- `npx tsc --noEmit` exit 0; `npm run lint` clean.

### From session 2 (2026-05-24)
- **Telegram alert template** — Low-rating alert rewritten to Russian/shaming-tone template + per-question scores + Tashkent timestamp + @mentions. Commit `ddd384b`.
- **Debounce buffer** — `app/src/lib/feedback-alert-buffer.ts` merges two per-visit server calls into one alert. Late comments get a follow-up.
- **Weekly + monthly crons** — `.github/workflows/weekly-telegram-report.yml` + `.github/workflows/monthly-telegram-report.yml`. Commits `052bfbf`, `1010e89`.

### Existing infrastructure (from earlier sessions)
- **Daily Telegram report:** GitHub Actions cron fires daily at 08:00 Tashkent. Run #1 verified 2026-05-21.
- **QR slug freeze:** Prisma client extension blocks any update to `QRCode.slug`. 41 printed posters protected.
- **Admin dashboard:** Russian translation deployed. Daily/weekly/monthly/yearly analytics views (now with correct vote counts).
- **Analytics endpoints:** `GET /api/analytics/feedback` + `GET /api/analytics/stores` with Bearer auth, verified 200.
- **Power BI access:** `bi_readonly` role at `metro.proxy.rlwy.net:36355` (SELECT-only on `public` schema), provisioned and verified.
- **Vote cooldown:** 35 days per device per store.
- **41/41 A5 poster QR links:** HTTP 200 in production (verified 2026-05-18).
- **Deploy path (UPDATED 2026-05-29):** primary = GitHub Actions `nightly-railway-deploy.yml` (cloud, 18:05 UTC/23:05 Tashkent, needs `RAILWAY_TOKEN` secret); backup = hardened `Pinbox-Railway-Night-Deploy` Windows task (now runs on battery + wakes from sleep). Both deploy off-peak to dodge the free-tier peak-hours block. Local `railway up` can crash at "Indexing…" under machine memory pressure — prefer the cloud path or the dashboard Deploy button (off-peak).

## Current Blockers

- **Production is ~6 days stale** until the first successful off-peak deploy. The 23:05 Tashkent 2026-05-29 run (cloud + local) should clear it, deploying the template, login, vote-count fix, and dashboard trends together. Verification pending.

## Known Pre-existing Issue (different from today's fix)

The `-comment` deviceId append in `app/src/app/[slug]/client.tsx:136` + `app/src/app/[slug]/actions.ts:85` still exists. It creates two Feedback rows per visit, which today's read-side filter now correctly hides from counts. The write-side pattern itself (two rows per "one event") is a design smell and should be fixed in the future via write-time dedup or a `kind` column. For now, it's masked by the filter.

## Immediate Next Steps

1. **Tonight 23:05 Tashkent:** `Pinbox-Railway-Night-Deploy` auto-fires. Deploys the vote-count fix + simplified login. Both `TEAM_PASSWORD` env var and code will be live after this.
2. **After deploy:** (a) Open `/login` — verify single password field in Russian. Enter `12345` → should land on `/admin`. (b) Spot-check dashboard vote counts: Юнусабад and Метро Чиланзар should show correct lower counts.
3. **Next session:** Add `workflow` scope to PAT; optionally fix the two-rows-per-visit write pattern at the source; consider rate-limiting `/login` POST against bot brute-force.

## Verification Snapshot (2026-05-24, session 3)

- `TEAM_PASSWORD` env var: confirmed present in Railway via `railway variables --service web --kv` after `railway variables --set` (write succeeded despite peak-hours redeploy block).
- Login page: not yet verifiable against production (awaiting 23:05 deploy). Code reviewed: `login-form.tsx` has single password input; `actions.ts` reads `process.env.TEAM_PASSWORD`.
- Vote-count fix (from session 2): `npx tsc --noEmit` exit 0; `npm run lint` clean; production DB spot-checks correct.
