# Troubleshooting

## Common Issues

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
- **Solution:** Run `railway variables list | grep REPORTS_API_KEY`. If missing, set it: `railway variables set REPORTS_API_KEY="pinbox-reports-2026-secure"`.

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
