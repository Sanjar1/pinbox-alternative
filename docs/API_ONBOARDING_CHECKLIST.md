# API Onboarding Checklist

Date updated: 2026-03-01

## Active Platform: Google Business Profile API

Decision: Start with Google Business Profile API — the only official, stable REST API
among Yandex/2GIS/Google for business listing management.

Google Cloud project: **Pinbox alternative** (console.cloud.google.com)

---

## Step Checklist

### Step 1 — Verify APIs enabled in Google Cloud Console
- [ ] Google Business Profile API enabled
- [ ] My Business Account Management API enabled
- [ ] My Business Business Information API enabled
- [ ] My Business Verifications API enabled
- [ ] Places API enabled (for discovery/geocoding)

### Step 2 — Verify OAuth credentials exist
- [ ] OAuth 2.0 Client ID created (type: Web Application)
- [ ] Authorized redirect URIs configured
- [ ] Client ID and Client Secret saved in `app/.env`

### Step 3 — Apply for Basic API Access
- Previous application: Case `5-2907000040517` — REJECTED 2026-02-17
- Status: Must reapply with stronger justification
- Apply via: https://developers.google.com/my-business/content/prereqs
- Use business email (not gmail.com if possible)
- [ ] Application submitted
- [ ] Approval received

### Step 4 — Test API access after approval
- [ ] Call `GET /accounts` — verify account list returns
- [ ] Call `GET /accounts/{id}/locations` — verify store list returns
- [ ] Confirm OAuth flow works end-to-end

### Step 5 — Build Google connector in app
- [ ] Implement `GoogleConnector` implementing `IConnector`
- [ ] Read: list locations, get location fields
- [ ] Write: update name, phone, hours, address
- [ ] Diff: compare master card vs Google current values

---

## Env Keys (app/.env)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
YANDEX_GEOCODER_API_KEY=
DISABLE_AUTH_FOR_TESTING=
```

---

## Capability Matrix (fill after API access confirmed)

| Field       | READ | WRITE | Notes |
|-------------|------|-------|-------|
| name        |      |       |       |
| address     |      |       |       |
| lat/lng     |      |       |       |
| phone       |      |       |       |
| hours       |      |       |       |
| website     |      |       |       |
| description |      |       |       |
| photos      |      |       |       |
| category    |      |       |       |

Auth type: OAuth 2.0 (scope: `https://www.googleapis.com/auth/business.manage`)
Rate limit: TBD after approval
Moderation delay: TBD

---

## Secondary Platforms (after Google is live)

- **2GIS** — session-based API, endpoints in `docs/2GIS_API_CHEATSHEET.md`, no official partner API
- **Yandex** — no official API, MANUAL mode only (operator instructions + direct links)

---

## Security Rules

1. Never put credentials in docs, commits, or chat.
2. Store all secrets in `app/.env` only (not committed to git).
3. Rotate any credential that may have been exposed.
