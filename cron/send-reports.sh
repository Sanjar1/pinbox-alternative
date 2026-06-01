#!/usr/bin/env bash
#
# One-shot report dispatcher, run by the Railway "report-cron" service on a
# cron schedule (0 3 * * * = 03:00 UTC = 08:00 Asia/Tashkent).
#
# It reproduces the exact cadence of the three GitHub Actions workflows it
# replaces, but fires from Railway's scheduler, which is punctual to within a
# few minutes (GitHub's shared cron ran these 3.5-4 hours late, so reports
# arrived ~11:00-12:00 Tashkent instead of the promised 08:00).
#
#   daily   -> every day
#   weekly  -> Mondays         (UTC day-of-week == 1)
#   monthly -> 1st of month    (UTC day-of-month == 01)
#
# Firing at 03:00 UTC is what makes the day-of-week / day-of-month checks
# zone-safe: at 03:00 UTC the Tashkent calendar date (UTC+5, 08:00) is the same
# date, so "UTC Monday" == "Tashkent Monday" and "UTC 1st" == "Tashkent 1st".
# Do NOT move this near 00:00 UTC or the date checks would drift vs Tashkent.
#
set -euo pipefail

: "${REPORTS_API_KEY:?REPORTS_API_KEY is not set on the report-cron service}"
BASE="${REPORT_BASE_URL:-https://web-production-370c1.up.railway.app}"

post() {
  local period="$1"
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] POST ${BASE}/api/reports/${period}"
  # --fail-with-body: non-2xx -> non-zero exit AND prints the JSON error body,
  # so a failed report shows up as a failed cron run in Railway with the reason.
  curl --fail-with-body -sS \
    --retry 3 --retry-delay 30 --retry-all-errors \
    --max-time 60 \
    -X POST \
    -H "Authorization: Bearer ${REPORTS_API_KEY}" \
    "${BASE}/api/reports/${period}"
  echo
}

post daily

if [ "$(date -u +%u)" = "1" ]; then
  post weekly
fi

if [ "$(date -u +%d)" = "01" ]; then
  post monthly
fi

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] done"
