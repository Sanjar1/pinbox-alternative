# Railway CLI Cheatsheet

Quick reference for common Railway operations.

## Authentication

```bash
# Login
railway login

# Check who you are
railway whoami

# Logout
railway logout
```

## Project Management

```bash
# List all projects
railway list

# Link to a project
railway link {PROJECT_ID}

# Check current project
railway status

# Unlink from current project
railway unlink
```

## Environment Variables

```bash
# List all variables
railway variables list

# Set a variable
railway variables set VAR_NAME "value"

# Set from file
railway variables set-file .env.local

# Delete a variable
railway variables delete VAR_NAME

# Export all variables
railway variables list > variables.txt
```

## Deployments

```bash
# List deployments
railway deployments list

# Redeploy latest commit
railway redeploy

# Check deployment status
railway status

# View deployment logs
railway logs --tail=50

# Follow logs in real-time
railway logs --tail

# Tail logs for specific service
railway logs --service web
```

## Database

```bash
# Connect to PostgreSQL
railway connect postgres

# Run a query
psql $DATABASE_URL -c "SELECT 1"

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Services

```bash
# List services
railway service list

# View service status
railway service info

# View service logs
railway logs --service web

# SSH into service (shell)
railway shell
```

## Domain & URLs

```bash
# Get app domain
railway domain

# List domains
railway domain list

# Add custom domain
railway domain add example.com

# Remove domain
railway domain remove example.com
```

## Environment Management

```bash
# List environments
railway environment list

# Switch environment
railway environment switch production

# Create new environment
railway environment create staging
```

## Monitoring

```bash
# View metrics (CPU, memory, etc.)
railway metrics

# Check service health
curl $(railway domain)/api/health

# Watch logs
watch "railway logs --tail=10"
```

## Debugging

```bash
# Full deployment logs
railway deployments logs latest

# Check build logs
railway logs --service web | grep -i error

# Check recent commits
git log --oneline | head -10

# See what will deploy
git diff origin/main..HEAD
```

## Integration with Scripts

```bash
# In bash scripts
APP_URL=$(railway domain)
echo "Deployed to: $APP_URL"

# In Node.js
const { execSync } = require("child_process");
const appUrl = execSync("railway domain", { encoding: "utf-8" }).trim();
```

## Common Workflows

### Deploy after code changes

```bash
git add .
git commit -m "feature: update voting page"
git push origin main
# Railway auto-deploys within 2-5 minutes
railway logs --tail  # Monitor
```

### Update environment variable and redeploy

```bash
# Update in Railway dashboard or:
railway variables set SESSION_SECRET "new-value"

# Redeploy to apply changes
railway redeploy

# Verify
railway logs --tail
```

### Scale up resources

```bash
# Via CLI (if supported by plan)
railway scale memory 1GB

# Otherwise use Dashboard: Service Settings → Scale
```

### View all configuration

```bash
# Service configuration
railway service info

# Environment variables
railway variables list

# Current environment
railway environment

# Deployment history
railway deployments list
```

## Helpful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Railway shortcuts
alias rw="railway"
alias rw-logs="railway logs --tail"
alias rw-deploy="railway redeploy"
alias rw-status="railway status"
alias rw-vars="railway variables list"
alias rw-url="railway domain"

# Deploy from Git
alias rw-push="git push origin main && echo 'Railway deploying...' && railway logs --tail"
```

Then use:

```bash
rw-logs
rw-deploy
rw-url
```

## Tips & Tricks

### Auto-deploy on every push

```bash
# Just push to GitHub!
# Railway is already watching for commits
git push origin main
```

### Reset to clean state

```bash
# View current deployment
railway deployments list

# Rollback to previous deployment
railway deployments rollback {DEPLOYMENT_ID}
```

### Monitor multiple services

```bash
# Terminal 1: Watch logs
railway logs --tail

# Terminal 2: Check metrics
watch railway metrics

# Terminal 3: Manual testing
curl $(railway domain)/api/health
```

### Sync local .env with Railway

```bash
# Export from Railway
railway variables list --json > railway-vars.json

# Or load into local .env
eval "$(railway variables list | grep -v '^$' | sed 's/^/export /')"
```

## Troubleshooting

### Port Issues

```bash
# Railway assigns PORT via environment variable
# Ensure your app uses: process.env.PORT || 3000
```

### Database Connection

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check DATABASE_URL is set
railway variables list | grep DATABASE_URL
```

### Deployment Timeout

```bash
# Check build logs
railway logs --tail=100

# Increase timeout in railway.json (if needed)
# Default is 100 seconds
```

### Memory Issues

```bash
# Check memory usage
railway metrics

# Scale up
railway scale memory 2GB
```

## Documentation Links

- [Railway Docs](https://docs.railway.app)
- [CLI Guide](https://docs.railway.app/guides/cli)
- [API Reference](https://docs.railway.app/api)
- [Next.js on Railway](https://docs.railway.app/guides/nextjs)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)

---

**Last Updated:** 2026-03-12
