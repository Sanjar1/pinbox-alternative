# Google Cloud Project Audit — 2026-03-01

Project: **Pinbox Alternative** (`pinbox-alternative`)
Audited by: Claude (browser inspection)

---

## 1. Enabled APIs

Total enabled: 25 APIs

### Business Profile APIs (what we need)
| API | Status |
|-----|--------|
| Business Profile Performance API | ✅ Enabled |
| My Business Account Management API | ✅ Enabled |
| My Business Business Information API | ✅ Enabled |
| My Business Verifications API | ✅ Enabled |
| Places API | ✅ Enabled 2026-03-01 |

### Other enabled (infrastructure defaults)
BigQuery APIs, Cloud Logging, Cloud Monitoring, Cloud SQL, Cloud Storage, etc.

---

## 2. Credentials

| Type | Name | Created | Details |
|------|------|---------|---------|
| OAuth 2.0 Client ID | Pinbox GBP Web | Feb 10, 2026 | Web application |
| API Keys | — | — | None |
| Service Accounts | — | — | None |

**Full Client ID:**
`187930224484-j3f4e65u65bgrpj54j49m5kqjrcrj53k.apps.googleusercontent.com`

**Client secret:** exists (masked as `****9C6_`), status: Enabled, created Feb 10, 2026
Note: Google no longer allows viewing/downloading existing secrets. If lost, must create a new one.

**Authorized JavaScript origins:** NONE configured

**Authorized redirect URIs:**
- `https://developers.google.com/oauthplayground` — test-only, NOT the app callback

**Missing redirect URI (must add):**
- `http://localhost:3000/api/auth/google/callback`

**Last used:** February 10, 2026 (testing only, never used in production)

---

## 3. OAuth Consent Screen (Google Auth Platform)

| Setting | Value |
|---------|-------|
| App name | Pinbox GBP |
| Support email | sismatullaev@gmail.com |
| Publishing status | **TESTING** ← not Production |
| User type | External |
| OAuth user cap | 1 user (1 test, 0 other) / 100 user cap |
| Test users | 1 user added |
| App logo | Not uploaded |

**Testing mode means:** only explicitly added test users can run the OAuth flow.
This is fine for internal/operator use — no need to go to Production for our dashboard.

---

## 4. Data Access (OAuth Scopes)

| Scope category | Status |
|----------------|--------|
| Non-sensitive scopes | ✅ `business.manage` — added 2026-03-01 |
| Sensitive scopes | None (not needed) |

Scope added: `https://www.googleapis.com/auth/business.manage`
Description: "See, edit, create and delete your Google business listings"

---

## 5. Summary: What's Good vs What's Missing

### Good ✅
- All 4 core Business Profile APIs are enabled
- OAuth 2.0 client exists (correct type: Web Application)
- App is set up as External with 1 test user (sismatullaev@gmail.com)
- Testing mode is fine for internal dashboard use

### Missing / Must Fix ❌
1. ~~**`business.manage` scope**~~ — ✅ Fixed 2026-03-01
2. ~~**Places API**~~ — ✅ Enabled 2026-03-01
3. ~~**Redirect URI**~~ — ✅ Fixed 2026-03-01: `http://localhost:3000/api/auth/google/callback` added
4. ~~**Client Secret**~~ — ✅ Confirmed in `app/.env` as `GOOGLE_BP_CLIENT_SECRET`

---

## 6. Previous Basic API Access Application

- Submitted: ~2026-02-10
- Case: `5-2907000040517`
- Result: **REJECTED** (Feb 17, 2026) — "not approved after internal quality checks"

**Important note:** Since the app is in Testing mode and we are only using it
internally (1 user = the owner), Basic API Access approval may NOT be required.
We should first test the API in Testing mode. If it works → no reapplication needed.
If we get quota/access errors → reapply with stronger justification.

---

## 7. Next Actions (in order)

1. ~~**Add `business.manage` scope**~~ ✅ Done 2026-03-01
2. ~~**Enable Places API**~~ ✅ Done 2026-03-01
3. ~~**Check redirect URI**~~ ✅ Done 2026-03-01 — added `http://localhost:3000/api/auth/google/callback`
4. ~~**Save credentials to app/.env**~~ ✅ Already done — Client ID, Client Secret, Refresh Token all present
5. ~~**Test API live**~~ — ✅ Tested 2026-03-01. Result: OAuth works, but API returns 429 quota=0
   - Access token: ✅ obtained successfully
   - GET /accounts: ❌ 429 RATE_LIMIT_EXCEEDED — quota_limit_value=0
   - Root cause: Google Basic API Access approval required (quota stays 0 until approved)
6. ~~**Apply for Basic API Access**~~ ✅ Done 2026-03-01
   - Case ID: **8-2175000040120**
   - Submitted via: support.google.com/business/workflow/16726127
   - Business selected: Syrnaya Lavka (Yangi Shahar ko'chasi), Verified
   - Cloud project number: 187930224484
   - Company website: https://sirnayalavka.uz
   - Expected response: within 5 business days by email to sismatullaev@gmail.com
7. **Wait for approval email** — check sismatullaev@gmail.com (up to 5 business days)
8. **Re-run test** after approval: `node scripts/test-gbp-api.mjs` — should return accounts list
9. **Build GoogleConnector** — after quota is approved

## 8. app/.env Status (2026-03-01)

| Key | Status |
|-----|--------|
| `GOOGLE_BP_CLIENT_ID` | ✅ Present |
| `GOOGLE_BP_CLIENT_SECRET` | ✅ Present |
| `GOOGLE_BP_REFRESH_TOKEN` | ✅ Present (refreshed 2026-03-01 after scope change) |
| `DATABASE_URL` | ✅ Present |
| `DISABLE_AUTH_FOR_TESTING` | ✅ true (dev mode) |
| `GOOGLE_REDIRECT_URI` | ✅ Present — `http://localhost:3000/api/auth/google/callback` |
