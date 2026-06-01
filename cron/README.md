# report-cron — Railway-scheduled Telegram reports

Replaces the three GitHub Actions report workflows (daily / weekly / monthly),
which fired **3.5–4 hours late** because GitHub's shared cron is best-effort.
Railway cron is punctual to within a few minutes, so reports arrive at the
intended **08:00 Asia/Tashkent (03:00 UTC)**.

## What it does

A single Railway cron service runs `send-reports.sh` once per day at `0 3 * * *`
(03:00 UTC). The script POSTs the production report endpoints, reproducing the
old cadence exactly:

| Report  | When                       | Endpoint                  |
|---------|----------------------------|---------------------------|
| daily   | every day                  | `POST /api/reports/daily` |
| weekly  | Mondays (`date -u +%u`==1) | `POST /api/reports/weekly`|
| monthly | 1st (`date -u +%d`==01)    | `POST /api/reports/monthly`|

Firing at 03:00 UTC keeps the day-of-week / day-of-month checks aligned with the
Tashkent calendar (UTC+5 → 08:00 same day). Do not move it near 00:00 UTC.

## One-time setup / cutover (run OFF-PEAK — Railway EU-West deploys are blocked 08:00–20:00 Amsterdam)

```bash
# from repo root, with railway CLI linked to project "pinbox" / env "production"

# 1. Create the cron service and give it the report API key
railway add --service report-cron \
  --variables "REPORTS_API_KEY=<value from: railway variables --service web --kv | grep REPORTS_API_KEY>"

# 2. Deploy the cron image (builds the tiny alpine+curl Dockerfile in ./cron)
railway up ./cron --path-as-root --service report-cron --ci

# 3. Set the cron schedule (config-as-code via cron/railway.json already sets
#    "0 3 * * *"; confirm it took in the dashboard under report-cron > Settings >
#    Cron Schedule). If config-as-code did not apply, set it there manually.

# 4. TEST FIRE once, before trusting it — confirm it hits the endpoint and a
#    report lands in Telegram (do this on a non-report-due moment to avoid a dup,
#    or accept one test message):
railway run --service report-cron /usr/local/bin/send-reports.sh
#    (or use the dashboard "Run" button on the cron service)

# 5. ONLY after the Railway fire is confirmed working, stop the GitHub schedules
#    so the team does not get duplicate reports. Edit each of:
#      .github/workflows/daily-telegram-report.yml
#      .github/workflows/weekly-telegram-report.yml
#      .github/workflows/monthly-telegram-report.yml
#    and remove (or comment out) the `schedule:` trigger, keeping
#    `workflow_dispatch:` so manual runs remain available as a fallback.
```

## Rollback

If Railway cron misbehaves, re-enable the `schedule:` triggers in the three
GitHub workflows. Both must never run live at the same time, or reports double.
