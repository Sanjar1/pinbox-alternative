# 🚀 Railway Deployment — Quick Start

**Updated:** 2026-03-12

This is the **fastest path** to deploy and redeploy your Pinbox app to Railway via CLI.

---

## 🟢 First Time? Follow This

### 1. Install Railway CLI (5 minutes)

```bash
npm install -g @railway/cli
railway --version
```

### 2. Authenticate (2 minutes)

```bash
railway login
# Opens your browser for login
# Confirm and close
```

### 3. Generate Environment Secrets (1 minute)

```bash
cd /path/to/pinbox-alternative
node scripts/generate-env-secrets.mjs
# Generates SESSION_SECRET and FEEDBACK_HASH_SALT
# Saves to app/.env.local
```

### 4. Get Your Railway Project ID (1 minute)

Go to: https://railway.app/project/{PROJECT_ID}
Copy the **PROJECT_ID** from the URL

### 5. Run Automated Deployment (10 minutes)

```bash
bash scripts/deploy-railway.sh production
```

**The script will:**
- ✅ Verify your environment
- ✅ Build your app
- ✅ Push to GitHub
- ✅ Set environment variables on Railway
- ✅ Trigger deployment

### 6. Verify Deployment (2 minutes)

```bash
node scripts/verify-deployment.mjs
```

**You're done!** 🎉

---

## 🔄 Updating Your App? This Is Fast

### Option A: Automatic (Recommended)

```bash
# Make your changes
# ... edit files ...

# Push to GitHub
git add .
git commit -m "Your changes"
git push origin main

# Railway auto-deploys in 2-5 minutes
# Monitor at: https://railway.app/project/{PROJECT_ID}
```

### Option B: Manual Redeploy

```bash
# If you changed environment variables:
node scripts/generate-env-secrets.mjs

# Then redeploy:
bash scripts/deploy-railway.sh production
```

---

## 📋 What Got Deployed?

New files created for you:

| File | Purpose |
|------|---------|
| `scripts/deploy-railway.sh` | Full automated deployment (all steps in one script) |
| `scripts/railway-setup.mjs` | Interactive setup for first-time users |
| `scripts/generate-env-secrets.mjs` | Generate secure random secrets |
| `scripts/verify-deployment.mjs` | Check if deployment is working |
| `DEPLOY_CLI_GUIDE.md` | **Complete guide** (read this!) |
| `RAILWAY_CHEATSHEET.md` | **Quick command reference** |
| `app/railway.json` | Railway build config (already exists) |
| `app/.env.local` | Local environment variables (git-ignored) |
| `.railway/config.json` | Project link (auto-created) |

---

## ⚡ Most Common Commands

```bash
# Deploy
bash scripts/deploy-railway.sh production

# Check if app is running
node scripts/verify-deployment.mjs

# View logs
railway logs --tail

# Check environment variables
railway variables list

# Redeploy latest code
railway redeploy

# Get app URL
railway domain
```

---

## 🚨 Troubleshooting

### "Deployment still running..."
Wait 2-5 minutes. Railway is building.

```bash
railway logs --tail  # Watch the build
```

### "Build failed"
Check the logs:

```bash
railway logs --tail=100 | grep -i error
```

Most common issues:
- Missing environment variables → Run `railway variables list`
- Node version mismatch → Check `package.json` engines field

### "App is live but voting page 404"
The `/[slug]` dynamic route might not be deployed yet.

```bash
# Force redeploy
railway redeploy

# Wait 2 minutes and try again
curl https://your-app.railway.app/523da2
```

### "Can't find PROJECT_ID"
Get it from the URL:

```
https://railway.app/project/abc123def456...
                          ^^^^^^^^^^^^^^
                          This is the PROJECT_ID
```

---

## 📚 Full Documentation

For detailed explanations, see:

- **[DEPLOY_CLI_GUIDE.md](./DEPLOY_CLI_GUIDE.md)** — Complete step-by-step guide
- **[RAILWAY_CHEATSHEET.md](./RAILWAY_CHEATSHEET.md)** — Command reference

---

## 🎯 Next Steps

**After first deployment:**

1. ✅ Verify app is running: `node scripts/verify-deployment.mjs`
2. ✅ Test voting page: Visit `https://your-app.railway.app/523da2`
3. ✅ Generate QR posters:
   ```bash
   cd app
   npx tsx scripts/generate-qr-poster.mjs \
     --slug 523da2 \
     --base-url "https://your-app.railway.app"
   ```

---

## 💡 Pro Tips

### Save time with aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias rw-deploy="bash scripts/deploy-railway.sh production"
alias rw-logs="railway logs --tail"
alias rw-verify="node scripts/verify-deployment.mjs"
```

Then:

```bash
rw-deploy
rw-logs
rw-verify
```

### Monitor in real-time

```bash
# Terminal 1: Watch logs
railway logs --tail

# Terminal 2: Check metrics
watch "railway metrics"

# Terminal 3: Test the app
watch "curl -s https://your-app.railway.app/api/health"
```

### Scale up if needed

```bash
# List your current resources
railway metrics

# Scale up memory (if needed)
railway scale memory 2GB
```

---

## 🔗 Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Your Project:** https://railway.app/project/{PROJECT_ID}
- **Railway Docs:** https://docs.railway.app
- **GitHub Repo:** https://github.com/Sanjar1/pinbox-alternative

---

## Summary

```bash
# First time: 3 commands
npm install -g @railway/cli
railway login
bash scripts/deploy-railway.sh production

# Every update after: 3 commands
git add .
git commit -m "Your changes"
git push origin main
```

**Questions?** Check [DEPLOY_CLI_GUIDE.md](./DEPLOY_CLI_GUIDE.md)

---

**You're all set!** 🎉

Run: `bash scripts/deploy-railway.sh production`
