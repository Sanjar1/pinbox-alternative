# Manager sync setup (Google service account)

The daily/weekly Telegram reports group stores by territorial manager. The
mapping is synced from the "Менеджеры" tab of the manager Google Sheet
(`1N7Ysr2C8ivoXAbU0fZc07_aDFAvDhny-M5Zg2yxDgkw`, gid 1105476357) into the
`Store.territorialManager` DB column.

## Credentials — reuse the existing service account
We reuse the service account already used by the "Store managers task bot"
project, which already has read access to this sheet. No new Google Cloud setup
is needed.

- Service account: `store-mangers-task-sheets-bot@store-manager-tasks.iam.gserviceaccount.com`
- Key file (local, NOT committed): `Store managers task bot/credentials/service-account.json`

### Production env var
Set `GOOGLE_SERVICE_ACCOUNT_JSON` on Railway (service `web`) to the FULL contents
of that JSON key file (as a single value). Then redeploy:
`cd app && railway up --service web`.

If the sheet is ever shared with a different account, re-share it (Viewer is
enough) with the email above.

## How it runs
- The report workflows POST `/api/admin/sync-managers` first (best-effort), then
  POST the report. The endpoint reads the sheet, matches names, and writes
  `Store.territorialManager`.
- If the sheet is unreachable or the key is missing, the sync falls back to
  `app/data/manager-assignments.json` (committed snapshot) and logs
  `manager_sync_fallback`. The report still sends.

## When you reshuffle managers
Just edit the sheet. The next report (or a manual
`POST /api/admin/sync-managers`) picks it up — no redeploy needed.

## Adding a brand-new store
Assign it in the sheet. If a sheet store name doesn't match any DB store, the
sync logs it under `unmatched` and does NOT create a store. If the spelling
differs from the DB, add an alias in `app/src/lib/manager-match.ts`
(`NORMALIZED_ALIASES` or `RAW_ALIASES`).
