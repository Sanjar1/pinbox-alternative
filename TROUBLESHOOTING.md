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
