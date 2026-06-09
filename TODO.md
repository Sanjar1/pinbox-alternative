# TODO

**Updated:** 2026-06-09 (session 7)

## Priority 0 — Harden the prod migration pipeline (so a new column can't 500 prod again)
- [ ] **Make schema changes auto-apply on deploy.** Today's outage: `Store.territorialManager` shipped in code but was never in the prod DB → all 41 posters + the daily report 500'd (`P2022`). Prod has no `_prisma_migrations` table (db-push model); the entrypoint's `migrate deploy` is bypassed and would P3019 anyway (`migration_lock.toml` = `sqlite`). Carefully, in its own approved pass: set `migration_lock.toml` `sqlite`→`postgresql`, **baseline** `_prisma_migrations` against the already-db-push'd schema (`prisma migrate resolve --applied` per existing migration) so `migrate deploy` won't try to re-create existing tables, then confirm the entrypoint actually runs `migrate deploy`. Until then, **manually `prisma db push` any new column as part of its deploy.** (See memory `prod-db-migration-model`, MISTAKES 2026-06-09.)
- [ ] **Make `/api/health` do a `SELECT 1`** so a data-layer outage turns the health check red (it stayed green through today's total 500 outage).
- [ ] **DECIDE: upgrade Railway to paid (~$5/mo Hobby) or stay free-tier?** Nightly deploy was failing on free-tier peak drift; the 20:00/23:00 UTC fix should resolve it, but upgrading removes the peak block entirely. Needs user's spend approval.
- [ ] (Optional) Assign Катортол + Чилонзор Торговый to a manager in the "Менеджеры" sheet so they appear in a TM block instead of only the totals.

### Done this session (2026-06-09) — was Priority 0
- [x] Prod outage fixed — `Store.territorialManager` column added to prod DB; 41/41 posters back to HTTP 200.
- [x] `POST /api/admin/sync-managers` → `{matched:41, ...}` verified live (was 0; fixed the stale sheet-gid → resolve by title).
- [x] Daily report confirmed in the managers group with the new grouped format + explicit 0-row stores per TM (msg 63841).
- [x] TM-grouped reporting deployed & verified live → **M5 reporting activation closed in ROADMAP.**

## Priority 1 — Quick wins
- [x] Fix the `-comment` deviceId double-counting bug (read-side filter approach, deployed pending 23:05 Tashkent auto-task).
- [x] Simplify login to single password field (code + env var done; ships at 23:05 Tashkent auto-task).
- [ ] Add `workflow` scope to PAT `telegram-ai-agent deploy` (requires github.com/settings/tokens → email sudo-mode). Blocks future workflow file edits from CLI.
- [ ] Confirm the automatic 08:00 Tashkent GitHub Actions daily cron is still delivering (last verified 2026-05-21 run #1).
- [ ] If daily cron confirmed green for several days, mark M5 — Reporting Activation closed in `ROADMAP.md`.

## Priority 2 — Security hardening (MEDIUM — new from session 3)
- [ ] Add rate-limiting to `POST /login`. Trivial password (`12345`) on a public-internet URL (`web-production-370c1.up.railway.app/admin`) is a bot brute-force risk. Options: server-action-level counter keyed by IP hash, or a Railway/edge rule. No code change needed if password is changed first, but rate-limiting is good hygiene regardless.
- [ ] When the team's trust model changes, update `TEAM_PASSWORD` in Railway dashboard to a stronger value (no code deploy needed — just restart the service).

## Priority 3 — Cleanup (carried from 2026-05-21)
- [ ] Remove temporary helper scripts: `scripts/tmp-check-a5-qr.cjs`, `scripts/audit-a5-poster-links.cjs`, `scripts/tmp-extract-qr-links.cjs`, `scripts/tmp-fix-a5-placeholders.cjs`.
- [ ] Delete the stray file named `console.log(JSON.stringify(row)))` in repo root (created by an accidental shell redirect).
- [ ] Smoke-test a random handful of QR links.
- [ ] Add `* text=auto eol=lf` to `.gitattributes` to silence CRLF/LF warnings.

## Priority 4 — Optional hardening
- [ ] Add Telegram failure-alert step to `.github/workflows/daily-telegram-report.yml` (posts to Telegram on workflow failure in addition to GitHub email).
- [ ] Add expiration date to `bi_readonly` Postgres role (e.g. `VALID UNTIL '2026-08-21'`) so analyst access auto-expires after 3 months unless renewed.

## Stretch / future
- [ ] Add a Russian-language flag to the analyst-onboarding doc once English-speaking analysts join.

---

## Recently closed (see `PROGRESS.md` for the full story)

- 2026-05-24 — Simplified team login (single password field, Russian UI, `team@kaas.local` singleton, `TEAM_PASSWORD` env var).
- 2026-05-24 — Weekly + monthly Telegram report GitHub Actions crons added.
- 2026-05-24 — Low-rating Telegram alert rewritten to Russian/shaming-tone template.
- 2026-05-24 — In-memory debounce buffer added (one alert per customer visit, not two).
- 2026-05-21 — GitHub Actions daily cron live (run #1 green).
- 2026-05-21 — QR slug freeze (D-033) deployed.
- 2026-05-21 — Power BI runbook + Russian analyst message published.
- 2026-05-21 — Admin dashboard Russian translation done locally.
- 2026-05-18 — 41/41 A5 poster QR links HTTP 200 in production.
- 2026-05-18 — Repair endpoint + brand theming + archivedAt + admin/analytics endpoints deployed.
