# Pinbox Alternative App

Next.js + Prisma MVP for compliant QR feedback and Yandex-focused store profile operations.

## Implemented Core

- Secure login with hashed passwords
- Session-based auth (server-side session table)
- Tenant-safe store access checks
- Store create/edit with URL validation
- Public QR page and feedback submission
- Feedback alerts (Telegram/Resend via env config)
- CSV store import (owner-only)
- Audit logging for key actions
- Auto-generate missing links from store name/address

## Setup

1. Copy env template:
```bash
cp .env.example .env
```
2. Install dependencies:
```bash
npm install
```
3. Apply database migrations:
```bash
npx prisma migrate dev
```
4. (Optional) Seed demo user:
```bash
node prisma/seed.mjs
```
5. Start app:
```bash
npm run dev
```

## Credentials and Keys (Current Scope)

1. App auth credentials
- Source: your own database users (`User` table).
- Demo seed user email: `admin@demo.com`
- Demo seed password: `change-me` (change immediately).

2. Yandex listing links
- Source: Yandex Business dashboard per branch.
- Paste branch URL into store settings.

3. Telegram alert credentials (optional)
- Option A: webhook URL (`TELEGRAM_WEBHOOK_URL`)
- Option B: bot token + chat id (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)

4. Email alert credentials (optional)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ALERT_EMAIL_TO`

## Yandex-Only Sync Mode

Edit store page includes sync settings with Yandex as active platform.

Click **Sync To Platforms Now**:
- Yandex: active sync path (mode depends on connector capability)
- Other platforms: archived/not active in current scope

## Disable Login (Testing Only)

Set in `.env`:

```env
DISABLE_AUTH_FOR_TESTING="true"
```

Behavior:
- Admin pages open without login
- App uses first OWNER user (or first available user)

To re-enable normal login:

```env
DISABLE_AUTH_FOR_TESTING="false"
```

## CSV Import Format

Required header:
```csv
name,address,googleUrl,yandexUrl,twogisUrl
```

Template file: `public/stores-template.csv`

Note: CSV includes legacy columns for compatibility, but only Yandex is active in current scope.

## Telegram Auto-Import

If your store list is in Telegram channel `https://t.me/lokasiyasirnayalavka`:

```bash
npm run import:telegram
```

What it does:
- Pulls store posts from the channel
- Creates or updates stores in your tenant
- Uses direct links when found
- Auto-generates missing links
- Writes audit report: `../docs/LOCATION_PLATFORM_AUDIT.md`

## Quality Checks

```bash
npm run lint
npm run build
```

## Map Reviews to Telegram (Yandex + 2GIS)

This app now supports map review ingestion and Telegram workflow:

1. New review arrives -> send Telegram notification
2. Manager taps `Reply` -> status set to `REPLY_OPENED`
3. Manager replies in official cabinet (Yandex/2GIS) via `Open` button
4. Manager taps `Mark Done` -> status set to `DONE`

### 1) Configure env

```env
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="-1001234567890"
TELEGRAM_ALLOWED_USER_IDS="11111111,22222222"
TELEGRAM_WEBHOOK_SECRET="optional-shared-secret"
REVIEWS_INGEST_API_KEY="optional-ingest-key"
```

### 2) Set Telegram webhook

Use Telegram API (replace placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-domain>/api/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

### 3) Ingest review into app

`POST /api/reviews/ingest`

Headers (optional if key configured):
- `Authorization: Bearer <REVIEWS_INGEST_API_KEY>`
or
- `x-reviews-api-key: <REVIEWS_INGEST_API_KEY>`

Body example:

```json
{
  "source": "YANDEX",
  "externalReviewId": "y-12345",
  "reviewUrl": "https://yandex.ru/maps/org/2605231525/reviews/...",
  "reviewText": "Fast service and good coffee.",
  "authorName": "Ali",
  "rating": 5,
  "reviewTime": "2026-03-04T11:20:00Z",
  "placeId": "2605231525",
  "storeId": "optional-internal-store-id",
  "rawPayload": { "emailSubject": "New review" }
}
```
