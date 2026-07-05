---
name: deploy-and-verify
description: Deploy to Railway from app/ subdirectory and run the full 41-link QR health check
disable-model-invocation: false
---

# Deploy and Verify

Automates the full deployment workflow: push code, deploy, verify build, run health check.

## Steps

1. **cd app/** - Move to app directory (Railway CLI requirement)
2. **Deploy** - Run `railway up -d -m "deploy"`
3. **Poll deployment** - Check `railway deployment list --limit 1` every 30s until STATUS = SUCCESS or FAILED
4. **Verify build log** - If SUCCESS, check `railway logs <DEPLOYMENT_ID> --build | grep api/admin` for critical routes
5. **Run health check** - Execute `node ../scripts/check-a5-qr.cjs` to verify all 41 links return 200
6. **Report** - Return deployment ID, status, and health check results

## Usage

Invoke with `/deploy-and-verify` when ready to deploy after code changes.

## Output Format

```
DEPLOYMENT: <id>
STATUS: <SUCCESS|FAILED>

Build verification:
✓ /api/admin/repair-a5-links present
✓ /api/admin/qr-check present
✓ /api/health present

Health check:
Total links: 41
HTTP 200: <count>
HTTP 404: <count>
Others: <count>
```

If any route is missing or health check fails, report the error and stop.
