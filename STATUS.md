# Status

**Updated:** 2026-05-24 (end of second session)

## Current Phase

`M5 — Reporting Activation — All alert templates deployed. Dashboard vote double-counting bug fixed (read-side filter). Awaiting tonight's automatic deploy.`

## Product Truth

- This app is QR voting + store/listing operations.
- Customers scan a poster QR, vote 1–5 stars + optional comment; data lands in Postgres for the admin dashboard, the daily/weekly/monthly Telegram reports, and external Power BI reporting.
- Brand name in Telegram copy: **«KAAS Сырная Лавка»**.

## What Is Done (as of 2026-05-24, session 2)

### Dashboard vote double-counting bug — FIXED today
- **Root cause:** `app/src/app/[slug]/client.tsx` calls the server action twice per low-score session: first writes `{comment: "[ratings] service:X;quality:Y;prices:Z;..."}`, second writes the user's free-text comment with `deviceId + "-comment"` to bypass the 35-day anti-abuse check. Dashboard + daily report both count both rows.
- **Verification:** Last 7 days: 232 rows → 230 vote rows (2 follow-ups correctly hidden). Юнусабад: 6 → 5 (the "Xama joy bardak" row was the comment follow-up). Метро Чиланзар: 6 → 5 (★3 "Сервис" follow-up).
- **Fix:** NEW file `app/src/lib/feedback-filters.ts` exports `VOTE_ROW_FILTER` + `COMMENT_ROW_FILTER`. Dashboard counts use `VOTE_ROW_FILTER`; "Latest feedback" display uses `COMMENT_ROW_FILTER`. Daily + weekly + monthly reports all filter by votes only.
- **Approach:** Option C — read-side filter (no migration on frozen production DB; corrects historical counts immediately). Chose over write-side dedup (A) or schema migration (B) per Opus subagent recommendation.
- **Deploy:** Manual `railway up` blocked by free-tier peak hours. Existing Windows Scheduled Task `Pinbox-Railway-Night-Deploy` at 23:05 Tashkent will deploy automatically. Flagged `WakeToRun = False` as a risk if laptop sleeps.
- `npx tsc --noEmit` exit 0; `npm run lint` clean.

### From previous session (2026-05-24, session 1)
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
- **Deploy path:** `Pinbox-Railway-Night-Deploy` Windows Scheduled Task → `cd app && railway up --service web` at 23:05 Tashkent.

## Current Blockers

None. Next Railway deploy via auto-task at 23:05 Tashkent will pick up the vote-count fix.

## Known Pre-existing Issue (different from today's fix)

The `-comment` deviceId append in `app/src/app/[slug]/client.tsx:136` + `app/src/app/[slug]/actions.ts:85` still exists. It creates two Feedback rows per visit, which today's read-side filter now correctly hides from counts. The write-side pattern itself (two rows per "one event") is a design smell and should be fixed in the future via write-time dedup or a `kind` column. For now, it's masked by the filter.

## Immediate Next Steps

1. **Tonight 23:05 Tashkent:** `Pinbox-Railway-Night-Deploy` auto-fires. This deploys the vote-count fix.
2. **After deploy:** Spot-check the dashboard and verify that vote counts match actual store visits (no more double-counting).
3. **Next session:** Add `workflow` scope to PAT; optionally fix the two-rows-per-visit write pattern at the source.

## Verification Snapshot (2026-05-24, session 2)

- `npx tsc --noEmit`: exit 0 on all changed files.
- `npm run lint`: clean on all changed files.
- Production DB spot-checks: Юнусабад (11:58/11:59 incident) now shows 5 votes instead of 6. Метро Чиланзар now shows 5 instead of 6. Filter is working correctly.
- Filter logic tested against sample Feedback rows with `comment.startsWith("[ratings] service:")` predicate.
