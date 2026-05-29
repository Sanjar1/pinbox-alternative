# Status

**Updated:** 2026-05-29 (session 4 — deploy reliability)

## Current Phase

`M5 — Reporting Activation — Deploy pipeline repaired. The nightly auto-deploy had been silently failing since 2026-05-24, so NONE of the 05-24 work (new Telegram template, simplified login, vote-count fix, dashboard trend charts) ever reached production — the live site has been running 05-23 code for ~6 days. Fixed both deploy paths; everything lands at the first off-peak deploy (23:05 Tashkent 2026-05-29).`

## What Is Done (2026-05-29, session 4 — deploy reliability)

### Root cause found: nightly deploy silently dead since 05-24
- The 23:05 Windows task ran `railway up`, which **crashed at "Indexing…"** (Rust out-of-memory) every night from 05-24 onward — it never uploaded. Logs proved it: `logs/railway-night-deploy-2026-05-23*.log` = full success; 05-24/26/27/28 = stop at "Indexing…". Some nights (05-19/20/25) had no log at all — the task was set `DisallowStartIfOnBatteries=true` + no `WakeToRun`, so it skipped on battery/sleep.
- The old script had **no failure detection, no retry, no alert** → 6 days of stale production with nobody noticing.

### Fix — two reliable deploy paths
- **NEW cloud path:** `.github/workflows/nightly-railway-deploy.yml` — GitHub Actions runs `railway up --service web --ci` at 18:05 UTC (23:05 Tashkent, off-peak) from a cloud runner. No laptop, no local-memory crash. Needs repo secret `RAILWAY_TOKEN` (production-scoped Railway project token) — **added & verified 2026-05-29**. This is now the reliable primary.
- **Hardened local task (backup):** `scripts/railway-night-deploy.ps1` now detects upload success vs the Indexing crash, retries once, and sends a Telegram alert on final failure (UTF-8 logs). Task re-registered (`scripts/pinbox-night-deploy-task.xml` + `register-night-deploy-task.ps1`) with `DisallowStartIfOnBatteries=false` + `WakeToRun=true` — verified live via `schtasks`.
- **Peak-hours fact (confirmed on dashboard):** free-tier deploys to EU West are blocked 08:00–20:00 Amsterdam; the dashboard "Deploy" button bounces during that window. Off-peak in Tashkent ≈ after 23:00 (summer) / 00:00 (winter).
- **Pending verification:** first off-peak run (23:05 Tashkent 2026-05-29) should land all pending commits and switch the bot to the «Мы подвели клиента» template. Scheduled to verify run-green + live behavior.

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
