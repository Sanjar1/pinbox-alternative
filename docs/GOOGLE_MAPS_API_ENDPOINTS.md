# Google Maps / Google Business API Endpoints

Last updated: 2026-02-27

This file contains endpoints used for the current audit/claim workflow.
It separates official public APIs from web claim URLs used in browser automation.

## Batch Changes Rule

- For bulk changes in Google Business/Maps data, use API endpoints first.
- Keep web flow automation as fallback for ownership/verification steps that are not exposed by public APIs.

## 1) Google Maps Platform APIs (official)

### 1.1 Places API (New)
Base: `https://places.googleapis.com/v1`

- `POST /places:searchText` - text search by free query.
- `POST /places:searchNearby` - search around coordinates.
- `POST /places:autocomplete` - place/query autocomplete.
- `GET /{name=places/*}` - place details.
- `GET /{name=places/*/photos/*/media}` - place photo bytes/redirect.

Required headers:
- `X-Goog-Api-Key: <MAPS_API_KEY>`
- `X-Goog-FieldMask: <comma-separated fields>`

### 1.2 Geocoding API
Base: `https://maps.googleapis.com/maps/api/geocode`

- `GET /json?address=<encoded>&key=<MAPS_API_KEY>` - forward geocode.
- `GET /json?latlng=<lat>,<lng>&key=<MAPS_API_KEY>` - reverse geocode.

## 2) Google Business Profile APIs (official)

### 2.1 Account Management API
Base: `https://mybusinessaccountmanagement.googleapis.com/v1`

- `GET /accounts` - list accessible business accounts.
- `GET /{parent=accounts/*}/invitations` - list pending invitations.
- `POST /{name=accounts/*/invitations/*}:accept` - accept invitation.
- `POST /{name=accounts/*/invitations/*}:decline` - decline invitation.

### 2.2 Business Information API
Base: `https://mybusinessbusinessinformation.googleapis.com/v1`

- `GET /{parent=accounts/*}/locations` - list locations.
- `POST /{parent=accounts/*}/locations` - create location.
- `GET /{name=locations/*}` - get location.
- `PATCH /{location.name=locations/*}` - update fields (name, phone, hours, address, etc.).
- `DELETE /{name=locations/*}` - delete location.
- `POST /{name=locations/*}:googleLocations.search` - find Google Maps match candidates.

### 2.3 Verifications API
Base: `https://mybusinessverifications.googleapis.com/v1`

- `GET /{name=locations/*}:fetchVerificationOptions` - available methods.
- `POST /{name=locations/*}:verify` - start/complete verification flow.

### 2.4 Business Profile Performance API
Base: `https://businessprofileperformance.googleapis.com/v1`

- `GET /{location=locations/*}/searchkeywords/impressions/monthly`
- `GET /{location=locations/*}:fetchMultiDailyMetricsTimeSeries`

### 2.5 Notifications API
Base: `https://mybusinessnotifications.googleapis.com/v1`

- `GET /{name=accounts/*/notificationSetting}`
- `PATCH /{notificationSetting.name=accounts/*/notificationSetting}`

### 2.6 Legacy v4 endpoints still seen in integrations
Base: `https://mybusiness.googleapis.com/v4`

- `GET /accounts/{accountId}/locations/{locationId}/reviews`
- `PATCH /accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply`

## 3) Web Claim URLs used in real ownership flow (browser)

These are not stable public APIs, but they are critical for operations and automation checkpoints:

- `https://business.google.com/create?fp=<feature_or_place_pointer>...`
  - opens claim/create wizard.
- `https://business.google.com/verify/l/<location_code>/p/<place_id>...`
  - verification wizard (phone/SMS/video/etc.).
- `https://business.google.com/complete/l/<location_code>/s/<step>...`
  - post-verification onboarding steps.
- `https://business.google.com/locations`
  - managed profile list and status (Verified/Processing).

## 4) Auth and scopes

- Maps Platform: API key.
- GBP APIs: OAuth 2.0 user auth + account access to location.
- Typical scopes used in GBP integrations:
  - `https://www.googleapis.com/auth/business.manage`

## 5) Important operational limits

- Verification destination phone/email (who receives SMS/code) is not fully discoverable via public GBP API and must be checked in the web flow.
- Ownership claim actions for third-party listings are primarily performed via web claim flow, not a single public "claim endpoint".

## Official references

- Google Maps Platform (Places + Geocoding):
  - https://developers.google.com/maps/documentation/places/web-service
  - https://developers.google.com/maps/documentation/geocoding
- Google Business Profile APIs:
  - https://developers.google.com/my-business/
  - https://developers.google.com/my-business/reference/businessinformation/rest
  - https://developers.google.com/my-business/reference/verifications/rest
  - https://developers.google.com/my-business/reference/performance/rest
  - https://developers.google.com/my-business/reference/notifications/rest
