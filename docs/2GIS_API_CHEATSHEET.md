# 2GIS API Cheat Sheet

Last updated: 2026-02-27

This file tracks endpoints observed from an authenticated `account.2gis.com` session and used in project scripts.

## Scope

- Cabinet host: `https://account.2gis.com`
- Private API host: `https://api.account.2gis.com/api/1.0`
- Catalog API host: `https://catalog.api.2gis.ru`
- Working org in this project: `70000001036827089`

## Authentication model

- Browser session cookies are primary auth in cabinet.
- Scripted requests can work with `Authorization: Bearer <dg_session_token>` from active session.
- `401` = invalid/expired auth.

## 1) Confirmed READ endpoints (`api.account.2gis.com`)

- `GET /users`
- `GET /permissions`
- `GET /orgs?fields=orgDetails`
- `GET /orgs/{orgId}?fields=country,legalForm`
- `GET /orgs/{orgId}?fields=business,country,legalForm,cards`
- `GET /orgs/{orgId}?fields=advModel`
- `GET /orgs/{orgId}/permissions`
- `GET /orgs/{orgId}/permissions?orgId={orgId}`
- `GET /orgs/{orgId}/contacts?fields=contactGroupsWithSplittedPhone`
- `GET /branches?orgId={orgId}&pageSize=60&page=1`
- `GET /branches?orgId={orgId}&fields=schedule&pageSize=20&page=1`
- `GET /branches?orgId={orgId}&pageSize=1&page=1&isDashboard=1`
- `GET /branches/{branchId}`
- `GET /branches/{branchId}?fields=contactGroupsWithSplittedPhone`
- `GET /branches/{branchId}?fields=contactGroupsWithSplittedPhone,schedule,country,rubrics`
- `GET /branches/{branchId}/permissions`
- `GET /branches/{branchId}/special-days`
- `GET /featureViews/{orgId}?features=stories,vacancies,geometrActivity,geometrLocation,geometrReputation,mediaAlbumVideo,companyData,geoAdvertising,signboard,reviewspro,products,media`
- `GET /featureViews/{orgId}?features=competitors`
- `GET /media/{branchId}/albums/all/media`
- `GET /materials/dashboard?orgId={orgId}`
- `GET /banners/{orgId}/get`
- `GET /popup/{orgId}`
- `GET /cities/search?q=<city_name>`
- `GET /booklets?orgId={orgId}`
- `GET /microsite/{orgId}`
- `GET /microsite/{orgId}/canBeGenerated`

## 2) Confirmed WRITE endpoints (`api.account.2gis.com`)

- `PUT /orgs/{orgId}/contacts`
  - Used to update shared customer phone and remove company email.
- `PUT /branches/{branchId}`
  - Used for schedule/hours update.
  - Typical payload observed:
  - `{"schedule":{"days":{"Mon":{"from":"HH:MM","to":"HH:MM"},...},"comment":null}}`
- `POST /events/private`
  - Cabinet telemetry/event stream.

## 3) Catalog API endpoints observed (`catalog.api.2gis.ru`)

- `GET /2.0/catalog/branch/get?id=<id_list>&fields=items.point&key=<public_key>`
- `GET /2.0/region/get?id=<region_id>&fields=items.bounds&key=<public_key>`
- `GET /2.0/suggest/list?q=<query>&region_id=<id>&type=address&types=building&key=<public_key>`
- `GET /3.0/items/byid?id=<item_id>&fields=items.links.database_entrances,items.geometry.hover&key=<public_key>`

These are used by map/search UI assistance and coordinate checks.

## 4) Important response fields used in operations

- `org business info`: `result.businessInfo.logoUrl`, `brandName`, `branchesCount`
- `feature flags`: `geoAdvertising`, `signboard`, `reviewspro`, `media`
- `media moderation`: `items[].blockReason`

## 5) Known error patterns

- `401` - bad auth token/cookie.
- `403` - feature access denied (subscription/permissions).
- `404` - shell route exists, backend resource not provisioned.
- `400` on `PUT /branches/branch_<id>` for pending moderation branch IDs.
- Browser mixed-content warnings on occasional `http://api.account.2gis.com/...` calls from cabinet.

## 6) Practical notes for this project

- Company phone/email are org-level shared contacts when configured as common.
- Branches created from cabinet can appear as temporary IDs (`branch_<id>`) before moderation approval.
- Logo/media moderation is separate from contacts/hours changes.
- Public 2GIS catalog APIs are not a replacement for cabinet private management APIs.
