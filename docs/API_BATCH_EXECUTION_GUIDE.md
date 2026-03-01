# 🚀 Direct API Batch Execution Guide — Instagram + Facebook Links

**Method:** Direct Yandex Business API calls (No browser automation)
**Estimated Time:** 5-10 minutes (28 stores)
**Success Rate:** High (no page loading issues)

---

## ✅ Prerequisites

**Node.js Installation:**
```bash
node --version  # Should be v14 or higher
npm --version   # Should be v6 or higher
```

If not installed:
- Windows: Download from https://nodejs.org/
- Mac: `brew install node`
- Linux: `apt-get install nodejs npm`

---

## 📋 Setup Steps

### Step 1: Navigate to project directory
```bash
cd "C:\Users\99893\Documents\Pinbox alternative"
```

### Step 2: Verify script exists
```bash
ls scripts/batch-add-social-links.js
# Or on Windows:
dir scripts\batch-add-social-links.js
```

### Step 3: Create data directory for reports
```bash
mkdir -p data
# Or on Windows:
mkdir data
```

---

## 🎯 Run the Batch Script

### Option A: Simple execution
```bash
node scripts/batch-add-social-links.js
```

### Option B: With output logging to file
```bash
node scripts/batch-add-social-links.js > batch-execution.log 2>&1
```

### Option C: Real-time monitoring
```bash
node scripts/batch-add-social-links.js | tee batch-execution.log
```

---

## 📊 What the Script Does

### Per Store:
1. Fetch current company data via GET `/sprav/api/companies/{id}`
2. Check if Instagram/Facebook already exist
3. Prepare update payload with new social links
4. Send PUT request to `/sprav/api/update-company`
5. Handle CSRF token (488 response)
6. Retry if needed with CSRF token
7. Log result (success/failure/skip)

### Rate Limiting:
- 1 second delay between stores
- Respects Yandex API limits
- Safe for production use

### Error Handling:
- Skips stores that return 404 (inaccessible)
- Skips stores that already have links
- Retries on CSRF token missing (488)
- Logs all failures with reasons

---

## 📈 Expected Output

```
🚀 Starting batch Instagram + Facebook links addition...

Total stores to process: 28
Instagram: https://www.instagram.com/sirnayalavka.uz/
Facebook: https://www.facebook.com/sirnayalavka.uz/

Fetching initial CSRF token...
CSRF token obtained: TOKEN:TIMESTAMP...

[1/28] Processing store 2605231525
[2605231525] Fetching current company data...
[2605231525] Updating company with Instagram + Facebook...
[2605231525] ✓ SUCCESS: Links added

[2/28] Processing store 51521899757
[51521899757] Fetching current company data...
[51521899757] Updating company with Instagram + Facebook...
[51521899757] ✓ SUCCESS: Links added

... (continues for all 28 stores)

========== BATCH PROCESSING COMPLETE ==========

✓ Successful: 24 stores
✗ Failed: 1 stores
⊘ Skipped: 3 stores

SUCCESSFUL STORES:
  - 2605231525 (Instagram: true, Facebook: true)
  - 51521899757 (Instagram: true, Facebook: true)
  ... (more stores)

FAILED STORES:
  - 55688698857: HTTP 404 Not Found

SKIPPED STORES:
  - 56694713534: Instagram + Facebook already present
  ... (more stores)

📊 Full report saved to: ./data/batch-social-links-report.json
```

---

## 📊 Output Files

### batch-execution.log
Contains all console output from script execution. Useful for reviewing what happened.

### data/batch-social-links-report.json
Full JSON report with:
- `successful`: Array of stores that received links
- `failed`: Array of stores that failed with error messages
- `skipped`: Array of stores that were skipped (already have links, inaccessible, etc.)
- `startTime`: When batch started
- `endTime`: When batch completed

**Example report:**
```json
{
  "successful": [
    {
      "storeId": 2605231525,
      "instagram": true,
      "facebook": true
    }
  ],
  "failed": [],
  "skipped": [
    {
      "storeId": 56694713534,
      "reason": "Links already exist"
    }
  ],
  "startTime": "2026-02-28T14:30:00.000Z",
  "endTime": "2026-02-28T14:35:00.000Z"
}
```

---

## ⚠️ Troubleshooting

### Error: "ENOTFOUND yandex.ru"
**Cause:** Network connectivity issue
**Solution:** Check internet connection, try again

### Error: "HTTP 401/403"
**Cause:** Authentication issue (Yandex session expired)
**Solution:** Log into Yandex Business in browser first, then run script

### Error: "HTTP 404"
**Cause:** Store not accessible via API
**Solution:** Expected for representative stores. Script skips them automatically.

### Error: "ECONNREFUSED"
**Cause:** Cannot connect to yandex.ru
**Solution:** Check firewall, try with VPN if blocked, retry

### Script takes >20 minutes
**Cause:** Network timeout
**Solution:** Check internet speed, try again, use smaller batch

---

## ✅ Verification After Execution

### Step 1: Check report
```bash
cat data/batch-social-links-report.json | jq '.successful | length'
# Shows number of successful stores
```

### Step 2: Verify in Yandex Business (Manual)
For each successful store:
1. Go to: `https://yandex.ru/sprav/{storeId}/p/edit/`
2. Scroll to "Сайт и социальные сети"
3. Confirm Instagram + Facebook appear

### Step 3: Check on Yandex Maps (After 24-48 hours)
1. Search store on maps.yandex.ru
2. View store profile
3. Should show Instagram + Facebook links (after moderation)

---

## 🎯 Success Criteria

✅ **Batch Complete If:**
- Script runs without crashing
- data/batch-social-links-report.json is created
- "Successful" count > 20
- All attempted stores logged (successful/failed/skipped)

✅ **Links Verified If:**
- Instagram link visible in Yandex Business edit page
- Facebook link visible in Yandex Business edit page
- Links visible on Yandex Maps (after moderation)

---

## 📞 Next Steps After Execution

1. **Review Report:**
   ```bash
   cat data/batch-social-links-report.json
   ```

2. **Update Documentation:**
   - Add execution date to completion report
   - Document success metrics
   - Note any failures for manual processing

3. **Proceed to Task 2:**
   - Ownership claims on 9 representative stores
   - Estimated time: 15-20 minutes

4. **Parallel Task:**
   - New store setup (rows 29-35)

---

## 🚀 Quick Start Command

Copy and paste into terminal:

**Linux/Mac:**
```bash
cd "/Users/username/Documents/Pinbox alternative" && node scripts/batch-add-social-links.js | tee batch-execution.log
```

**Windows (PowerShell):**
```powershell
cd "C:\Users\99893\Documents\Pinbox alternative"; node scripts/batch-add-social-links.js
```

**Windows (CMD):**
```cmd
cd C:\Users\99893\Documents\Pinbox alternative
node scripts/batch-add-social-links.js
```

---

**Estimated Duration:** 5-10 minutes
**Automation Level:** 100% (no manual intervention needed)
**Reliability:** High (handles errors gracefully)

Ready to execute! 🚀

