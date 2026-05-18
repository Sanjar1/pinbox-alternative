# Railway CLI Cheatsheet (Pinbox Alternative)

**Last Updated:** 2026-05-18  
**Goal:** any AI/dev can redeploy this project from terminal only.

## 0) Project Assumptions

- Repo root: `Pinbox alternative`
- Next.js app root on Railway: `app`
- Service: `web`
- Builder: Dockerfile (`app/Dockerfile`)
- Healthcheck: `/api/health`

## 1) One-Time Setup

```bash
railway login
railway link
railway status
```

Expected `railway status` output should show:
- Project: `pinbox`
- Environment: `production`
- Service: `web`

## 2) Normal Deploy (Recommended) — Git Push

```bash
git add .
git commit -m "your change"
git push origin main
```

Railway GitHub integration auto-deploys from `main`.

**Note (discovered 2026-05-18):** GitHub auto-deploy has an occasional delay or
may not fire. If no new deployment appears within 2 minutes of a push, fall back
to the manual CLI deploy (Section 3).

## 3) Manual Deploy From CLI (when needed)

**MUST run from the `app/` subdirectory**, not from the repo root:

```bash
cd app
railway up -d -m "your message"
```

**Why `app/` only:** Railway's service has `rootDirectory: app` and uses
`app/railway.json` + `app/Dockerfile`. Running `railway up` from the repo root
uploads the whole repo and Railway resolves `dockerfilePath` against the
snapshot in a way that fails. From inside `app/`, the correct `railway.json` is
picked up automatically.

**Prerequisite:** ensure `app/test-output/` and other large generated dirs are
in `app/.gitignore`. If the upload times out, check for un-ignored large
directories (>10MB total).

**What gets ignored during upload** (as of 2026-05-18):
- `node_modules/`, `.next/` — standard Next.js ignores
- `test-output/` — poster PNG artifacts (~47MB)
- `data/generated-store-import.csv`

## 4) Check Deploy Status

```bash
railway deployment list --limit 5
railway deployment list --json --limit 3
```

## 5) Logs

```bash
# Build logs for specific deployment
railway logs <DEPLOYMENT_ID> --build --lines 200

# Runtime/deploy logs
railway logs <DEPLOYMENT_ID> --deployment --lines 200

# Latest logs stream
railway logs --latest
```

## 6) Quick Recovery Commands

If latest deploy is bad:

```bash
railway down -y
```

Redeploy latest stable input:

```bash
railway redeploy -y
# or
railway deployment redeploy -y
```

## 7) Variables

```bash
railway variables list
railway variables set KEY="value"
railway variables delete KEY
```

## 8) Live Verification URLs

```text
Base:   https://web-production-370c1.up.railway.app
Health: https://web-production-370c1.up.railway.app/api/health
Vote:   https://web-production-370c1.up.railway.app/523da2
Poster: https://web-production-370c1.up.railway.app/poster/523da2
```

## 9) DB Repair / Admin Endpoints

After a deploy, you may need to fix production DB state. Use the admin APIs:

```bash
# Check QR codes and stores in DB
curl "https://web-production-370c1.up.railway.app/api/admin/qr-check?key=pinbox-qr-diag-2026"

# Fix Glotok Юнусабад/Панельный slugs AND clear all feedback (test votes)
curl -X POST "https://web-production-370c1.up.railway.app/api/admin/repair-a5-links" \
  -H "Authorization: Bearer pinbox-reports-2026-secure" \
  -H "Content-Type: application/json" \
  -d '{"clearFeedback": true}'

# Fix slugs only, keep feedback
curl -X POST "https://web-production-370c1.up.railway.app/api/admin/repair-a5-links" \
  -H "Authorization: Bearer pinbox-reports-2026-secure" \
  -H "Content-Type: application/json" \
  -d '{"clearFeedback": false}'
```

Expected repair response (first run):
```json
{"clearedFeedback":14,"actions":[
  {"slug":"4c5350","action":"created-store-and-qr","store":"Глоток Юнусабад"},
  {"slug":"e96943","action":"created-store-and-qr","store":"Глоток Панельный"}
]}
```
On subsequent runs the action will be `"kept-existing"`.

## 10) DB Migrations

Migrations run automatically via `app/docker-entrypoint.sh` (`npx prisma migrate deploy`).
Railway's `startCommand` becomes the CMD argument to the ENTRYPOINT, so the entrypoint
DOES run and migrations are applied before Next.js starts.

**Important:** Railway's deployment logs show only npm/Next.js output, not the
prisma migrate lines. Don't assume migrations didn't run if you don't see them in logs.
To verify, hit the `/api/admin/qr-check` endpoint and check if queries succeed.

## 11) Post-Deploy Verification Checklist

```bash
# 1. Health
curl https://web-production-370c1.up.railway.app/api/health
# Expected: {"ok":true}

# 2. All 41 A5 poster links return 200
node scripts/tmp-check-a5-qr.cjs
# Expected: {"total":41,"summary":{"200":41},...}

# 3. Confirm 4 distinct Glotok/Lavka slugs
for slug in 4c5350 e96943 ac16ce 34945c; do
  echo -n "$slug: "; curl -s -o /dev/null -w "%{http_code}" \
    "https://web-production-370c1.up.railway.app/$slug"; echo
done
# Expected: all 200
```

## 12) Known Pitfalls

1. `railway up` from **repo root** fails: snapshot includes whole repo but Railway
   looks for Dockerfile at a path that doesn't resolve correctly. Always deploy
   from `app/` directory.
2. `railway up` upload **timeout**: caused by large un-ignored files in `app/`.
   Check `app/.gitignore` — `test-output/` must be excluded.
3. A retry CLI deploy from repo root accidentally uses `NIXPACKS` (from root
   `railway.json`). Always use the `app/railway.json` via deploying from `app/`.
4. If map links are non-direct URLs, post-vote map buttons are hidden by design.
5. `REPORTS_API_KEY` must be set in Railway variables for admin/analytics/reports
   endpoints to work. Current value: `pinbox-reports-2026-secure`.
