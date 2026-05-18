# TODO

**Updated:** 2026-05-18

## Priority 0 - Production Poster Completion

- [x] Add 6 missing stores + QR slugs in production DB (done via repair endpoint)
- [x] Re-run A5 poster placeholder replacement for all stores
- [x] Re-run full QR health check and confirm `41/41` = `200` ✅

## Priority 1 - Deploy and Smoke Validation

- [x] Create Railway night redeploy scheduled task (`23:05`, Tashkent)
- [x] Fix Railway CLI deploy path (must use `app/` subdir, not repo root)
- [x] Fix gitignore to exclude `test-output/` (47MB causing upload timeout)
- [ ] Confirm next scheduled redeploy result from logs
- [ ] Smoke-test random QR links after nightly redeploy

## Priority 1 - Reports and Analytics

- [x] Implement daily report ranking: votes desc, average desc
- [x] Add analytics export endpoint `GET /api/analytics/feedback`
- [x] Add reports endpoints `POST /api/reports/{daily,weekly,monthly}`
- [x] Keep Telegram daily report scheduler disabled for now
- [ ] Enable Telegram daily report scheduler when vote volume is sufficient (M5)

## Priority 2 - Cleanup

- [ ] Remove temporary helper scripts: `scripts/tmp-check-a5-qr.cjs`, `scripts/audit-a5-poster-links.cjs`
- [ ] Push docs-only commits via `git push` to ensure GitHub is in sync
