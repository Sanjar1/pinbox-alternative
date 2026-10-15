# Migration status — Pinbox (QR voting app)

**Status: MOVED to our Hetzner server on 2026-10-15 (owner decision D-053).**
The earlier exclusion ("stays on Railway", 2026-08-06) is superseded.

| | Before | After |
|---|---|---|
| App | Railway service `web` | `pinbox-web` on 159.69.107.254 |
| Database | Railway `Postgres-PlIz` (PG 17) | `pinbox-db` (PG 17), nightly backup, restore-tested |
| Poster domain | `web-production-370c1.up.railway.app` | `qr.sirnayalavka.uz` (+ spare `qr.159.69.107.254.nip.io`) |
| Old domain | served the app | Caddy forwarder (`forwarder/`), 308 to the new domain |
| Reports | GitHub Actions | `/etc/cron.d/pinbox` → `/opt/pinbox/report.sh` |
| Bots' QR API | Railway URL (code default) | `QR_API_BASE_URL=http://pinbox-web:3000` |

## What is left

1. Alijon's team swaps all 42 posters (PDF `posters/A5-PRINT-READY-2026-10-15/`).
2. Owner cancels Railway after that confirmation (TODO OWNER-6). Until then the forwarder is the
   only thing keeping the May posters alive — do not redeploy the app to Railway.
3. The final Railway dump stays in `/opt/pinbox/dumps/` and the pre-switch database as
   `pinbox_old` inside `pinbox-db` for 30 days, then may be dropped.

## Related

`~/.claude/SERVER.md` — server facts and rules. `CLAUDE.md` → "Hosting".
