# Railway CLI Cheatsheet (Pinbox Alternative)

**Last Updated:** 2026-03-13  
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

## 2) Normal Deploy (Recommended)

```bash
git add .
git commit -m "your change"
git push origin main
```

Railway GitHub integration auto-deploys from `main`.

## 3) Manual Deploy From CLI (when needed)

From repo root:

```bash
railway deployment up -d -m "manual deploy"
```

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

## 9) Known Pitfalls

1. `railway deployment up` from wrong directory may use wrong builder/settings.
2. A retry deploy can accidentally run with `NIXPACKS`; verify deployment meta uses Dockerfile.
3. If map links are non-direct URLs, buttons on voting page are hidden by design.
