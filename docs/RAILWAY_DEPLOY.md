# Railway Deployment Guide

**Updated:** 2026-03-11

## Overview

This app runs on Railway with:
- **Next.js** app (Node.js runtime)
- **PostgreSQL** database (Railway plugin)
- **Prisma** ORM (auto-migrates on deploy)

---

## What You Need to Provide

Before Claude can deploy, provide:

1. **GitHub repo URL** — push the project to GitHub first
2. **Railway project URL** — after creating the project on railway.app
3. **DATABASE_URL** — from Railway PostgreSQL plugin (copy from Variables tab)

---

## Step-by-Step Deploy

### Step 1 — Push to GitHub
```bash
cd "C:\Users\99893\Documents\Pinbox alternative"
git add app
git commit -m "Prepare for Railway deploy"
git push origin main
```

### Step 2 — Create Railway Project
1. Go to https://railway.com/dashboard
2. Click **New Project**
3. Click **Deploy from GitHub repo**
4. Select your repository
5. Set **Root Directory** to `app`

### Step 3 — Add PostgreSQL
1. In your Railway project, click **+ Add Service**
2. Choose **Database → PostgreSQL**
3. Railway automatically sets `DATABASE_URL` in your environment

### Step 4 — Set Environment Variables
In Railway dashboard → your app service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL plugin |
| `SESSION_SECRET` | Any random 32+ char string |
| `FEEDBACK_HASH_SALT` | Any random 32+ char string |
| `NODE_ENV` | `production` |

### Step 5 — Set Build Command
In Railway service settings:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Root Directory:** `app`

### Step 6 — Deploy
Railway auto-deploys on push. Watch the deploy logs for:
```
✓ Prisma migrations applied
✓ Next.js build complete
✓ Server listening on PORT
```

### Step 7 — Seed the Database
After first deploy, run via Railway shell:
```bash
npm run db:seed
```

---

## Environment Variables Reference

```env
# Required
DATABASE_URL=postgresql://...          # From Railway PostgreSQL plugin
SESSION_SECRET=your-random-secret-here
FEEDBACK_HASH_SALT=your-random-salt-here
NODE_ENV=production

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

---

## Post-Deploy Checklist

- [ ] App loads at Railway URL
- [ ] `/523da2` voting page opens
- [ ] Submitting a vote saves to DB
- [ ] Platform links (Google/Yandex/2GIS) open correctly
- [ ] Admin panel accessible at `/admin`
- [ ] Regenerate QR posters with production URL

---

## Regenerate QR Posters After Deploy

Once you have the Railway URL (e.g. `https://pinbox.railway.app`):

```bash
cd app
npx tsx scripts/generate-qr-poster.mjs --slug 523da2 --base-url "https://pinbox.railway.app"
```

Run for each store slug to generate all posters.
