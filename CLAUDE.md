# Pinbox Alternative — Project Rules

> All workflow, skill routing, verification, and communication rules are inherited from the global CLAUDE.md.
> This file contains ONLY rules specific to this project.

---

## QR slugs are frozen (HARD RULE)

**Never modify `QRCode.slug` in the production database.** 41 A5 posters were
printed and distributed on 2026-05-17/18 — every slug below corresponds to a
QR code on a wall in a real cheese store.

- Backup: `data/qr-links-frozen-2026-05-21.json`
- Application-level guard: `app/src/lib/db.ts` (Prisma extension blocks `update`/`updateMany`/`upsert` that touch `slug`)
- Full rule: `docs/QR_SLUG_PROTECTION.md`

Forbidden, no exceptions without first reprinting + redistributing the affected poster:
- `prisma.qRCode.update({ data: { slug: ... } })`
- `UPDATE "QRCode" SET slug = ...` in psql
- Migrations that alter the `slug` column on existing rows
- Re-running any `import-stores` / `regenerate-slugs` style script against production

Creating NEW `QRCode` rows for NEW stores added AFTER 2026-05-21 is fine.
Incrementing `scans` is fine. Only `slug` writes are blocked.

**The production DOMAINS are frozen too.** Since 2026-10-15 (D-053) the posters encode
`https://qr.sirnayalavka.uz/{slug}` — A record `qr` → `159.69.107.254` in the sirnayalavka.uz
zone (DirectAdmin `web5.webspace.uz:2222`, owner login). Never remove or repoint that record
except to a new server that serves the same paths. The zone stays because company mail lives
there. Until every May poster is swapped (TODO OWNER-6), the old domain
`https://web-production-370c1.up.railway.app/{slug}` must keep answering: the Railway `web`
service runs ONLY the forwarder in `forwarder/` (308 to the new domain). Never redeploy the
app to Railway; never cancel Railway before the owner confirms the swap.

## Hosting (HARD RULE — rewritten 2026-10-15, owner decision D-053)

The app runs on our Hetzner server (`~/.claude/SERVER.md` — read it first):

| | |
|---|---|
| App | container `pinbox-web`, image `pinbox-web:<git-short-sha>` built ON the server from `git archive HEAD app` into `/opt/pinbox/build`; started only by `/opt/pinbox/run.sh <tag>` (poster-domain router ON by default; `PINBOX_QR_DOMAIN=0` disables it — never in production) |
| Database | container `pinbox-db` (Postgres 17), volume `/opt/pinbox-pgdata`, no published port; in the nightly `/opt/backup.sh` |
| Secrets | `/root/pinbox.env`, `/root/pinbox-db.env` (600) — never print them |
| Names | `qr.sirnayalavka.uz` (posters) and `qr.159.69.107.254.nip.io` (spare, used by cron) |
| Logs | `docker logs pinbox-web`; reports `/var/log/pinbox/report.log`; switch-over `/var/log/pinbox/switchover.log` |

Deploy = commit → `git archive --format=tar HEAD app | ssh root@159.69.107.254 'rm -rf /opt/pinbox/build && mkdir -p /opt/pinbox/build && tar -x -C /opt/pinbox/build && cd /opt/pinbox/build/app && docker build -t pinbox-web:<sha> .'`
→ `/opt/pinbox/run.sh <sha>` → verify `https://qr.sirnayalavka.uz/api/health` + a poster URL on THAT name (the spare nip.io name staying green proves nothing about posters — MISTAKES 2026-10-15). Rollback =
`run.sh <previous tag>` (old images stay on the box). Migrations still auto-apply at container
start (D-051). Committed == deployed: never build from an uncommitted tree.

Railway history (2026-03 → 2026-10) — two silent outages from plan lapses — is in D-050/D-052.
The Railway rules there no longer apply except: keep the forwarder alive until the swap.

## Telegram reports

Server cron `/etc/cron.d/pinbox` runs `/opt/pinbox/report.sh daily|weekly|monthly` at 08:00
Tashkent (daily; weekly on Monday; monthly on the 1st). Each run first syncs the store→TM map
(`POST /api/admin/sync-managers`), then posts the report, logging START → steps → END/FAIL
to `/var/log/pinbox/report.log`. The GitHub report workflows are disabled (do not re-enable —
that would send every report twice).

If the report does not arrive one morning: `tail -20 /var/log/pinbox/report.log` on the server,
then `docker logs pinbox-web | grep reports`.

The report is grouped by territorial manager. The store→TM mapping comes from the
«Менеджеры» Google Sheet (reuses the "Store managers task bot" service account; see
`docs/MANAGER_SYNC_SETUP.md`). Sheet names that differ from DB names go in the alias table in
`app/src/lib/manager-match.ts` (e.g. «Лавка Чирчик Восемь» → «Чирчик Восьмой»).

## Who calls this app

- Customers: poster QR codes (above).
- `tm-checklist-bot` and `storeops-task-bot` (same server): `QR_API_BASE_URL=http://pinbox-web:3000`
  in their env files (internal Docker network).
- The app pushes each vote to the TM bot: `TM_BOT_VOTE_HOOK_URL` (fire-and-forget, no retries).
- Telegram webhook of the review bot: `https://qr.sirnayalavka.uz/api/telegram/webhook`.
- Power BI analyst: `GET /api/analytics/feedback` (tell them about any address change).

## Tashkent time

Production uses Asia/Tashkent (UTC+5) for all user-facing timestamps. Daily
report range = previous full Tashkent day (00:00–24:00, see D-031 in
`DECISIONS.md`).

## Pointers

- Status snapshot: `STATUS.md`
- Decision log: `DECISIONS.md`
- Recent progress: `PROGRESS.md`
- Mistakes / lessons: `MISTAKES.md`
- Yandex / 2GIS API cheatsheets: `docs/YANDEX_API_CHEATSHEET.md`, `docs/2GIS_API_CHEATSHEET.md`
