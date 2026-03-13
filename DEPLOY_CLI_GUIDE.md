# Railway Deployment Guide — CLI-Based Approach

**Last Updated:** 2026-03-12

> Automate deployment using the Railway CLI instead of the web UI. This guide covers initial setup and future redeployments.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Initial Setup](#initial-setup)
3. [Deploying Updates](#deploying-updates)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)
6. [Manual Steps (No Script)](#manual-steps-no-script)

---

## Quick Start

**For first-time deployment:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Authenticate
railway login

# 3. Run deployment script
bash scripts/deploy-railway.sh production
```

**For future updates:**

```bash
# Just push to GitHub, Railway auto-deploys
git add .
git commit -m "Your changes"
git push origin main

# Monitor at: https://railway.app/project/{PROJECT_ID}
```

---

## Initial Setup

### Step 1: Install Railway CLI

```bash
# macOS/Linux using npm (recommended)
npm install -g @railway/cli

# Or download from:
# https://docs.railway.app/guides/cli
```

Verify installation:

```bash
railway --version
```

### Step 2: Create Railway Project (One-Time)

Go to **https://railway.app/dashboard** and:

1. Click **+ New Project**
2. Select **Deploy from GitHub**
3. Select `pinbox-alternative` repo
4. Set **Root Directory** to `app`
5. Click **Deploy**

Railway will create:
- ✅ Web service
- ✅ PostgreSQL database
- ✅ `DATABASE_URL` environment variable

### Step 3: Authenticate CLI

```bash
railway login
```

This opens your browser for authentication. After login, the CLI is ready.

### Step 4: Get Project ID

```bash
railway list
```

Find `pinbox-alternative` and note the Project ID. Or get it from:
**https://railway.app/project/{PROJECT_ID}** (copy from URL)

### Step 5: Link Local Project to Railway

```bash
cd /path/to/pinbox-alternative

# Link to your Railway project
railway link {PROJECT_ID}
```

This creates `.railway/config.json` (auto-created by script).

### Step 6: Set Environment Variables

Create `.env.local` in the `app/` directory:

```bash
# Copy from .env.example
cp app/.env.example app/.env.local

# Edit and add required variables
nano app/.env.local
```

**Required variables:**

```env
DATABASE_URL=postgresql://user:pass@host:5432/db  # From Railway PostgreSQL
SESSION_SECRET=your-random-32-char-string-here    # Generate: openssl rand -hex 32
FEEDBACK_HASH_SALT=your-random-32-char-string     # Generate: openssl rand -hex 32
NODE_ENV=production
```

### Step 7: Run Automated Deployment

```bash
bash scripts/deploy-railway.sh production
```

The script will:
- ✅ Verify prerequisites (Git, Node, Railway CLI)
- ✅ Check git state
- ✅ Build Next.js app locally
- ✅ Push to GitHub
- ✅ Authenticate with Railway
- ✅ Set environment variables
- ✅ Trigger deployment

**Output:**

```
✓ SUCCESS: Deployment complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project:     pinbox-alternative
Environment: production
App URL:     https://pinbox-xxxxx.railway.app
Dashboard:   https://railway.app/project/{PROJECT_ID}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 8: Verify Deployment

Wait 2-5 minutes, then check:

```bash
# Get app URL
railway domain

# Or visit: https://railway.app/project/{PROJECT_ID}
```

Test the app:

```bash
# Replace with your actual URL
curl https://pinbox-xxxxx.railway.app/api/health
```

### Step 9: Generate QR Posters

Once deployed, generate QR codes with the production URL:

```bash
cd app

# Get your production URL first (from Step 8)
npx tsx scripts/generate-qr-poster.mjs \
  --slug 523da2 \
  --base-url "https://pinbox-xxxxx.railway.app"
```

QR posters saved to: `app/test-output/`

---

## Deploying Updates

### Option A: Automatic Deployment (Recommended)

Railway auto-deploys when you push to GitHub:

```bash
cd /path/to/pinbox-alternative

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Feature: add new voting questions"
git push origin main

# Railway auto-deploys within 2-5 minutes
# Monitor at: https://railway.app/project/{PROJECT_ID}
```

### Option B: Manual Redeploy

If you need to redeploy without code changes:

```bash
bash scripts/deploy-railway.sh production
```

Or via Railway CLI directly:

```bash
railway redeploy
```

### Checking Deployment Status

```bash
# List recent deployments
railway deployment list

# Watch logs in real-time
railway logs --tail

# Check environment variables
railway variables list
```

---

## Environment Variables

### Initial Setup

Created in `app/.env.local`:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=...
FEEDBACK_HASH_SALT=...
NODE_ENV=production
```

### Update a Variable

Via CLI:

```bash
railway variables set SESSION_SECRET "new-secret-value"
```

Via script:

```bash
# Edit app/.env.local
nano app/.env.local

# Re-run deployment to sync
bash scripts/deploy-railway.sh production
```

### View All Variables

```bash
railway variables list

# Or in Dashboard: Service → Variables tab
```

### Generate Random Secrets

When creating new secrets, generate random strings:

```bash
# 32-char hex (recommended for secrets)
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Troubleshooting

### Build Failed

**Check logs:**

```bash
railway logs --tail
```

**Common causes:**

- `DATABASE_URL` not set → [Set Variables](#environment-variables)
- Missing `NODE_ENV=production` → Add to `.env.local`
- Port binding error → Railway auto-assigns PORT via env var

### Deployment Stuck

**Check status:**

```bash
railway deployment list
```

**Redeploy:**

```bash
railway redeploy
```

**Or force new deployment:**

```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### Can't Connect to Database

**Verify connection:**

```bash
# Check DATABASE_URL is set
railway variables list | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### CLI Not Connected

**Re-authenticate:**

```bash
railway logout
railway login
railway link {PROJECT_ID}
```

---

## Manual Steps (No Script)

If the automated script doesn't work, here's the manual process:

### 1. Build and Push Code

```bash
cd app
npm run build
cd ..

git add app/.env.local docs/
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Authenticate with Railway

```bash
railway login
railway link {PROJECT_ID}
```

### 3. Set Environment Variables

```bash
railway variables set DATABASE_URL "$DATABASE_URL"
railway variables set SESSION_SECRET "$SESSION_SECRET"
railway variables set FEEDBACK_HASH_SALT "$FEEDBACK_HASH_SALT"
railway variables set NODE_ENV "production"
```

### 4. Trigger Deployment

**Option A: Push to GitHub (automatic)**

```bash
git push origin main
```

**Option B: Manual redeploy**

```bash
railway redeploy
```

### 5. Monitor Deployment

```bash
railway logs --tail
```

Watch for:
- ✅ "Prisma migrations applied"
- ✅ "Next.js build complete"
- ✅ "Server listening on"

---

## Post-Deployment Checklist

After deployment completes:

- [ ] App loads at `https://pinbox-xxxxx.railway.app`
- [ ] `/523da2` voting page works
- [ ] Vote submission saves to database
- [ ] No console errors
- [ ] Admin panel accessible at `/admin`
- [ ] QR posters generated with correct production URL

---

## Project Structure

```
pinbox-alternative/
├── app/                          # Next.js app (deployed to Railway)
│   ├── .env.local                # Local dev env vars (git-ignored)
│   ├── .env.example              # Template for .env.local
│   ├── package.json              # Dependencies + build scripts
│   ├── railway.json              # Railway build config
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (PostgreSQL)
│   │   ├── migrations/           # Database migrations
│   │   └── seed.mjs              # Seed script
│   └── scripts/
│       └── generate-qr-poster.mjs # QR code generator
├── scripts/
│   └── deploy-railway.sh         # Automated deployment script
├── .railway/
│   └── config.json               # Railway project link (auto-created)
└── DEPLOY_CLI_GUIDE.md           # This file
```

---

## Important Files

| File | Purpose |
|------|---------|
| `app/railway.json` | Railway build/deploy configuration |
| `app/.env.local` | Development env vars (git-ignored) |
| `app/prisma/schema.prisma` | Database schema (PostgreSQL) |
| `scripts/deploy-railway.sh` | Automated deployment script |
| `.railway/config.json` | CLI project link (auto-created) |

---

## Related Documentation

- [Railway Docs](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment/railway)
- [Prisma PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Project Architecture](./app/ARCHITECTURE.md)

---

## Summary

**Initial Deployment:**

```bash
railway login
bash scripts/deploy-railway.sh production
```

**Future Updates:**

```bash
git add .
git commit -m "Your changes"
git push origin main
# Railway auto-deploys within 2-5 minutes
```

**Monitor Anytime:**

```bash
railway logs --tail
railway variables list
```

---

**Questions?** Check the [Troubleshooting](#troubleshooting) section or read the [Railway Docs](https://docs.railway.app).
