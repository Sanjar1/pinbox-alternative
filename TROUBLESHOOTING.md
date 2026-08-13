# Troubleshooting

## Common Issues

### Posters dead and Railway says the trial expired / deployments are paused
- **Symptom:** Every poster URL shows Railway's "Not Found - The train has not arrived at the station". `railway up` is rejected with `Your trial has expired. Please select a plan to continue using Railway.` The Railway dashboard reads "Your trial is over / 30 day trial expired / All deployments are paused".
- **Cause:** The workspace has no active paid plan. Seen 2026-08-12/13 (~21 h outage) after Hobby was cancelled: the workspace fell to a 30-day trial which then expired **by date** - not by spending; ~$4.31 of the $5 credit was still unused. Nothing is deleted (services and volumes survive), but every deployment is paused.
- **Solution:** The owner must select a plan at `railway.com/workspace/plans`. Railway rebuilds automatically once the subscription is active. Then verify: `/api/health` -> `{"ok":true,"db":true}`, `node scripts/check-a5-qr.cjs` -> 41/41 HTTP 200, and read the boot log for `migrations up to date` -> `Ready`. **Prevention: never cancel Hobby** - this account is not offered a Free plan (`hasExhaustedFreePlan: true`). See the `CLAUDE.md` "Railway plan & usage budget" hard rule.
- **Do not trust `railway status` here** - during this outage it reported a stale deployment from May and a misleading `Failed` state. Query deployments through the GraphQL API instead (`https://backboard.railway.com/graphql/v2`, `Authorization: Bearer <user.accessToken from ~/.railway/config.json>`, and a `User-Agent: railwayapp/4.0.0` header or Cloudflare returns error 1010).

### A customer says "my vote doesn't work" but the site is up
- **Symptom:** The poster page loads, but the owner's own vote is refused or seems to do nothing.
- **Cause:** Usually **by design**. `app/src/app/[slug]/actions.ts` allows **one vote per device, per store, per 35 days** and returns the Russian message "С этого устройства можно голосовать один раз в 35 дней." Other limits: >=5 votes from one IP in 10 minutes, >=25 per store per day, >20 per store per minute. Separately, App Sleeping makes the first load after idle take 3-10 s, which can feel like a dead page.
- **Solution:** Ask what exactly appeared (which red message / stuck button / nothing at all). Test from a **different store's poster** or a different network - if that works, it is the per-device rule and nothing is broken. To confirm the system overall, query the DB for today's rows (`SELECT COUNT(*) FROM "Feedback" WHERE "createdAt"::date = CURRENT_DATE`).

### The star buttons stop responding while automating the voting page
- **Symptom:** During browser automation the stars stop lighting up on every store, React `onClick` is attached but calling it changes nothing.
- **Cause:** The **automation browser tab is wedged**, not the app. The tell is `Page.captureScreenshot` timing out with "the renderer may be frozen or unresponsive" shortly beforehand.
- **Solution:** Re-test in a second, independent browser (Playwright) before reporting any bug. Seen 2026-08-13, where a clean browser ran the full star->submit flow perfectly.

### QR scan shows Railway's "Not Found — The train has not arrived at the station" page
- **Symptom:** Every poster URL (and `/api/health`) returns Railway's own 404 page / `{"message":"Application not found"}` — this is Railway's edge, not our app (our app's errors look different).
- **Cause:** Railway has no running deployment bound to the domain. Seen 2026-07-05 when the Free-plan usage grant ran out ("You have used all your available resources" in the deploy log) and Railway removed the deployment. Other possible causes: service deleted, or a failed deploy left no active deployment.
- **Solution:** (1) Check the account badge / usage page at railway.com/workspace/usage — if out of resources, the plan needs credit (Hobby) or the monthly grant reset. (2) Once resources exist, redeploy: GitHub → Actions → `nightly-railway-deploy.yml` → Run workflow (branch `main`). (3) Verify: `/api/health` 200, then run the 41-link check against `data/qr-links-frozen-2026-05-21.json`. Prevention: $1/mo budget rule in CLAUDE.md + App Sleeping stays enabled.

### First QR scan after a quiet period takes ~3–10 seconds to load
- **Symptom:** A voting page hangs a few seconds before rendering; subsequent scans are instant.
- **Cause:** Not a bug. Serverless (App Sleeping) is enabled on the `web` service (D-050, 2026-07-05): after 10 idle minutes the container sleeps; the next request wakes it (requests queue during wake).
- **Solution:** None needed — this is the accepted cost of staying under the free tier. Do NOT disable Serverless to "fix" it (CLAUDE.md hard rule); that re-creates the $1.24/mo burn that caused the July 2026 outage.

### Daily Telegram report arrives around noon instead of 08:00 Tashkent
- **Symptom:** The report shows up in the group at ~12:00–13:30 Tashkent; the GitHub Actions runs are green.
- **Cause:** GitHub cron congestion — the 03:00 + 04:00 UTC schedules consistently fire 3.5–5h late (observed Jun 2026: e.g. Jun 11 fired 07:28 + 08:47 UTC). Nothing is broken: the at-most-once dedup guard ensures a single send whichever attempt runs first.
- **Solution:** This is delay, not failure — check the run list first (`.../actions/workflows/daily-telegram-report.yml`). To land closer to 08:00, move the crons to early off-peak odd minutes (e.g. `23 1 * * *` + `23 2 * * *`); they MUST stay after 19:00 UTC (Tashkent midnight) or the previous-full-Tashkent-day range (D-031) reports the wrong day. For a one-off immediate report, use the "Run workflow" button.

### Every QR poster page returns HTTP 500 with `P2022 column ... does not exist`
- **Symptom (historical — should be impossible since 2026-07-05):** `/{slug}` voting pages (and the daily report) all 500 with `P2022`.
- **Cause:** deployed code selects a Prisma column the prod DB doesn't have. Before 2026-07-05 this happened because migrations never ran (dashboard start-command override + sqlite-dialect migration files) and health was a static `{ok:true}`. BOTH are fixed: migrations auto-apply at container start (D-051) and `/api/health` does a real `SELECT 1` (goes 503 during such an outage).
- **Solution (if it somehow recurs):** check the deploy log for the entrypoint lines — healthy is `No pending migrations to apply.` / `[entrypoint] migrations up to date - starting server`. If a migration failed, the log shows the exact error and Railway keeps the previous version serving. Fix the migration in code and redeploy. Do NOT `db push` prod and do NOT re-add a dashboard Custom Start Command — both recreate the original disease. Never alter `QRCode.slug`. See D-051 + memory `prod-db-migration-model`.

### How to ship a database schema change (since 2026-07-05)
- Edit `app/prisma/schema.prisma` AND add a migration folder `app/prisma/migrations/<timestamp>_<name>/migration.sql` with the matching DDL (generate with `npx prisma migrate diff --from-url <prod-public-url> --to-schema-datamodel prisma/schema.prisma --script`).
- Keep migrations fast (healthcheck gate = 100s): no inline backfills on big tables.
- Anything touching `QRCode`/`slug` fails CI unless a reviewer adds `-- ALLOW-QRCODE-REVIEWED: <why>`.
- Push + deploy. Verify in the deploy log: `Applying migration <name>` then `[entrypoint] migrations up to date`.

### Daily report groups every store under «Без менеджера» (no TM blocks)
- **Symptom:** report shows TM grouping but all stores land in the «Без менеджера» footer; `POST /api/admin/sync-managers` returns `{matched:0, unmatched:[]}`.
- **Cause:** `manager-sync` is reading the wrong Google Sheet tab — a hardcoded gid was reassigned to a different tab by a spreadsheet reorg. With the fix in place it resolves by title `'Менеджеры'`, but a tab **rename** would break it again.
- **Solution:** verify the «Менеджеры» tab still exists with columns A=store, D=`MANAGER`, E=ТМ name. If renamed, update `SHEET_TAB_TITLE`/`SHEET_GID` in `app/src/lib/manager-sync.ts`. A healthy sync returns `matched:41`. After fixing, re-run `POST /api/admin/sync-managers`, then `POST /api/reports/daily`.

### Need to deploy on demand but local `railway up` OOMs
- **Symptom:** `railway up` from `app/` dies at "Indexing…" with `memory allocation of N bytes failed`.
- **Cause:** Known Railway CLI bug under local memory pressure (since 2026-05-24). Real deploys run on the clean GitHub Actions runner.
- **Solution:** push your commit to `main`, then trigger the deploy workflow manually. `gh` isn't installed here, so dispatch via REST: get the token with `printf 'protocol=https\nhost=github.com\n\n' | git credential fill | grep ^password=`, then `curl -XPOST -H "Authorization: Bearer $TOKEN" .../actions/workflows/nightly-railway-deploy.yml/dispatches -d '{"ref":"main"}'` (204 = accepted). Only succeeds off-peak (before 06:00 UTC summer / 07:00 UTC winter, or after 18:00/19:00 UTC).

### A5 poster QR returns 404 for part of the batch
- **Symptom:** Some posters open correctly, others return `404`.
- **Cause:** Poster HTML still contains `VOTING_URL_PLACEHOLDER` or uses a slug that does not exist in production DB.
- **Solution:**
  1. Run batch health check for all poster URLs.
  2. Replace placeholders with real slugs.
  3. If still 404, create missing store/slug in production DB and rerun health check.

### Railway CLI `railway up` times out during upload
- **Symptom:** `railway up` from `app/` hangs at "Uploading..." and eventually errors `operation timed out`.
- **Cause:** Large files not excluded by `.gitignore` are included in the upload snapshot. Most common culprit: `app/test-output/` (~47MB of poster PNG images).
- **Solution:** Ensure `app/.gitignore` contains `/test-output/` and any other generated output dirs. Verify with `git ls-files app --others --exclude-standard | head -20` — no large dirs should appear.

### Railway CLI deploy uses wrong builder (NIXPACKS instead of Dockerfile)
- **Symptom:** Build succeeds with NIXPACKS but deploy fails or runs the wrong app.
- **Cause:** Running `railway up` from the repo root picks up the root `railway.json` which has conflicting settings.
- **Solution:** Always run `railway up` from inside the `app/` subdirectory. The correct `app/railway.json` will be used automatically.

### `POST /api/admin/repair-a5-links` returns 401
- **Symptom:** `{"error":"Unauthorized"}` from the repair endpoint.
- **Cause:** `REPORTS_API_KEY` is not set in Railway variables, or the wrong value is used.
- **Solution:** Run `railway variables list | grep REPORTS_API_KEY`. If missing, set it: `railway variables set REPORTS_API_KEY="<REPORTS_API_KEY>"`.

### Railway free-tier redeploy blocked during daytime
- **Symptom:** `railway up` fails with peak-hours restriction.
- **Cause:** Free-tier deploy restriction window.
- **Solution:** Run scheduled redeploy after off-peak (`23:05` Tashkent task) or upgrade plan.

### Railway scheduled Function creation fails with resource provision limit
- **Symptom:** Creating `daily-report-cron` with `railway functions new --cron "0 3 * * *"` fails with `Free plan resource provision limit exceeded`.
- **Cause:** The current Railway plan/resource state cannot provision another Function/service.
- **Solution:** Upgrade/provision Railway resources, or use Windows Task Scheduler/external cron to call `POST /api/reports/daily` at `08:00` Tashkent.

### Daily Telegram report sends the wrong date window
- **Symptom:** Morning report shows today's partial votes instead of yesterday's completed scores.
- **Cause:** The daily report range is using current-day start through now.
- **Solution:** `getDailyRange()` must return yesterday `00:00-24:00` in Tashkent time. Verify the heading date before sending the 08:00 report.

### Two Telegram low-rating alerts fire for a single customer visit
- **Symptom:** Managers group receives two messages — one with just the star rating, one with the typed comment — for the same customer visit.
- **Cause:** Before 2026-05-24 this was the default behaviour (no debounce). If it recurs after that date, the debounce buffer in `app/src/lib/feedback-alert-buffer.ts` may have been bypassed or the Railway process restarted between the vote call and the comment call (the buffer is in-memory and resets on restart).
- **Solution:** Confirm Railway shows one replica running (`railway status`). If a restart happened mid-vote, nothing to do — one-off duplication is acceptable. If the buffer itself is broken, check that `submitFeedback` in `actions.ts` calls `scheduleFeedbackAlert` (not the old direct-send path).

### Analytics counts low-rating sessions twice
- **Symptom:** Feedback table shows two rows for the same customer visit: one with `[ratings] service:X;quality:Y;prices:Z;lang:LL` comment and one with the typed free-text comment.
- **Cause:** Known pre-existing bug (`app/src/app/[slug]/client.tsx:136`): the client appends `-comment` to `deviceId` for the comment submission. Both rows get different `deviceHash` values, so the server treats them as separate sessions.
- **Solution:** Not yet fixed. Tracked in TODO Priority 1. Workaround for analytics: count `Feedback` rows where comment does NOT match `^\[ratings\]` to exclude vote-only rows, or filter out any deviceHash ending in the `-comment` hash pattern.
