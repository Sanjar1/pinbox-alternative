# Batch Create Requests (2026-02-28)

## Summary

- Yandex: create=4, pending=0, with_id=31/35
- 2GIS: create=7, pending=8, with_id=20/35
- Google: create=30, pending=5, with_id=0/35

## Output files

- `data\platform_create_requests_2026-02-28.json`
- `data\platform_create_requests_2026-02-28.csv`

## API-first policy (batch changes)

- Use official/private API endpoints first for all bulk operations.
- Use browser UI only for flows without stable API coverage (for example: ownership claims and some listing creation flows).
- Keep a queue file (`data/platform_create_requests_*.json`) and execute in batches.
- Log each run and keep result snapshots in `data/`.

## Platform notes

- Yandex: no fully stable public listing-create API confirmed; creation is usually via `/sprav/add` UI flow.
- 2GIS: private cabinet APIs are available for updates; creation endpoint for new org/branch is not confirmed in current capture.
- Google: Business Profile APIs support location create/update/review reply when account is authorized.

## Next execution step

1. Process all `action=create_request` rows from CSV.
2. For Yandex/2GIS without create endpoint, submit via cabinet UI in batch sessions and update IDs in Excel.
3. After IDs appear, upload `data/roba_logo_only.jpg` for RUBA rows.
