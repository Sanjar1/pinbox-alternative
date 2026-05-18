# Status

**Updated:** 2026-05-18

## Current Phase

`Production complete: all 41 A5 poster QR links verified 200 in production`

## Approved Print Source

- Active print batch: `posters/A5-PRINT-READY-2026-05-17` (`41` HTML posters).
- All 41 posters have unique slugs → unique stores → unique DB records.

## What Is Done

- **41/41 QR poster links return HTTP 200** in production (confirmed 2026-05-18).
- Glotok Юнусабад (`/4c5350`) and Глоток Панельный (`/e96943`) are fully separate stores from Лавка Юнусабад (`/ac16ce`) and Лавка Панельный (`/34945c`).
- 14 test votes cleared from production DB.
- `repair-a5-links` admin endpoint deployed and executed successfully.
- Brand theming system live (`kaas` / `glotok` / `ruba`) with per-brand voting page colours.
- `Store.archivedAt` soft-delete column added (migration applied via entrypoint on deploy).
- Admin + analytics + reports API endpoints deployed with `REPORTS_API_KEY` auth.
- Railway deploy from `app/` CLI now works reliably (gitignore fixed for 47MB test-output).
- `REPORTS_API_KEY=pinbox-reports-2026-secure` set in Railway production variables.

## Current Blockers

None. M4 milestone is complete.

## Immediate Next Step

- Enable Telegram daily report scheduler when vote volume is sufficient (M5).
- Remove temporary `scripts/tmp-*.cjs` helper scripts.
