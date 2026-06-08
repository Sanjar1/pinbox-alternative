# TODO

**Updated:** 2026-06-08 (session 6)

## Priority 0 — Verify the TM-grouped reports go live (after tonight's off-peak auto-deploy)
- [ ] Confirm the nightly deploy ran off-peak (GitHub Actions "Nightly Railway Deploy" green; ~20:00 or 23:00 UTC) and `/api/admin/sync-managers` now returns 200 (not 404).
- [ ] `POST /api/admin/sync-managers` → expect `{ok:true, used:"live", matched:41, unmatched:[], cleared:2}`. If `used:"fallback"`, the service account isn't reaching the sheet — check `GOOGLE_SERVICE_ACCOUNT_JSON` + sheet sharing.
- [ ] Confirm the 08:00 Tashkent daily report in the managers group is the new grouped format (Top-5 + 4 manager blocks + `Молчат:` + universal line). Pull Railway logs `manager_sync_done matched:41` and `message_built` as proof.
- [ ] (Optional) Assign Катортол + Чилонзор Торговый to a manager in the "Менеджеры" sheet so they appear in a block instead of only the totals.

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
