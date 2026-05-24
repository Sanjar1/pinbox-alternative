# TODO

**Updated:** 2026-05-24

## Priority 0 — Verify tonight's deploy (no manual action until 23:05 Tashkent)
- [ ] After `Pinbox-Railway-Night-Deploy` fires at 23:05 Tashkent: scan any A5 poster QR → leave 1–2/5 rating → type a comment → confirm ONE merged Russian-template Telegram message arrives in the managers group (not two English messages).

## Priority 1 — Quick wins
- [x] Fix the `-comment` deviceId double-counting bug (read-side filter approach, deployed pending 23:05 Tashkent auto-task).
- [ ] Add `workflow` scope to PAT `telegram-ai-agent deploy` (requires github.com/settings/tokens → email sudo-mode). Blocks future workflow file edits from CLI.
- [ ] Verify tonight's auto-deploy (23:05 Tashkent) picked up the vote-count fix. Check dashboard: Юнусабад and Метро Чиланзар should show correct counts.
- [ ] Confirm the automatic 08:00 Tashkent GitHub Actions daily cron is still delivering (last verified 2026-05-21 run #1).
- [ ] If daily cron confirmed green for several days, mark M5 — Reporting Activation closed in `ROADMAP.md`.

## Priority 2 — Cleanup (carried from 2026-05-21)
- [ ] Remove temporary helper scripts: `scripts/tmp-check-a5-qr.cjs`, `scripts/audit-a5-poster-links.cjs`, `scripts/tmp-extract-qr-links.cjs`, `scripts/tmp-fix-a5-placeholders.cjs`.
- [ ] Delete the stray file named `console.log(JSON.stringify(row)))` in repo root (created by an accidental shell redirect).
- [ ] Smoke-test a random handful of QR links.
- [ ] Add `* text=auto eol=lf` to `.gitattributes` to silence CRLF/LF warnings.

## Priority 3 — Optional hardening
- [ ] Add Telegram failure-alert step to `.github/workflows/daily-telegram-report.yml` (posts to Telegram on workflow failure in addition to GitHub email).
- [ ] Add expiration date to `bi_readonly` Postgres role (e.g. `VALID UNTIL '2026-08-21'`) so analyst access auto-expires after 3 months unless renewed.

## Stretch / future
- [ ] Add a Russian-language flag to the analyst-onboarding doc once English-speaking analysts join.

---

## Recently closed (see `PROGRESS.md` for the full story)

- 2026-05-24 — Weekly + monthly Telegram report GitHub Actions crons added.
- 2026-05-24 — Low-rating Telegram alert rewritten to Russian/shaming-tone template.
- 2026-05-24 — In-memory debounce buffer added (one alert per customer visit, not two).
- 2026-05-21 — GitHub Actions daily cron live (run #1 green).
- 2026-05-21 — QR slug freeze (D-033) deployed.
- 2026-05-21 — Power BI runbook + Russian analyst message published.
- 2026-05-21 — Admin dashboard Russian translation done locally.
- 2026-05-18 — 41/41 A5 poster QR links HTTP 200 in production.
- 2026-05-18 — Repair endpoint + brand theming + archivedAt + admin/analytics endpoints deployed.
