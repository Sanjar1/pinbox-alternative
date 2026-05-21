# TODO

**Updated:** 2026-05-21 (afternoon)

## Priority 0 — Same-day shipping
- [x] Activate the 08:00 Tashkent daily Telegram report — **done via GitHub Actions** (`0 3 * * *` UTC, `.github/workflows/daily-telegram-report.yml`). Run #1 green.
- [x] Freeze the 41 printed QR slugs (DB write guard + backup + docs).
- [x] Write analyst Power BI onboarding doc (`docs/ANALYST_POWER_BI_MESSAGE.md`) in Russian.
- [x] Translate admin dashboard to Russian (code ready locally, typecheck passed).
- [ ] Deploy the Russian dashboard translation: `cd app && railway up --service web`.
- [ ] Owner runs the 4-step Railway runbook in `docs/ANALYST_POWER_BI_MESSAGE.md` (generate public TCP domain + create `bi_readonly` user) and sends the message to the analyst.

## Priority 1 — Tomorrow morning verification
- [ ] Confirm the automatic 08:00 Tashkent GitHub Actions run actually delivers to the managers Telegram group.
- [ ] If green, mark M5 — Reporting Activation closed in `ROADMAP.md`. If red, inspect the workflow log (`curl --fail-with-body` will show the response body).

## Priority 2 — Cleanup
- [ ] Remove temporary helper scripts: `scripts/tmp-check-a5-qr.cjs`, `scripts/audit-a5-poster-links.cjs`, `scripts/tmp-extract-qr-links.cjs`, `scripts/tmp-fix-a5-placeholders.cjs`.
- [ ] Delete the stray file literally named `console.log(JSON.stringify(row)))` in repo root (created by an accidental shell redirect).
- [ ] Smoke-test a random handful of QR links after the dashboard translation deploys.
- [ ] Add `* text=auto eol=lf` to `.gitattributes` to silence the CRLF/LF warnings on every commit.

## Priority 3 — Optional hardening
- [ ] Add Telegram failure-alert step to `.github/workflows/daily-telegram-report.yml` (optional Task 5 in `docs/superpowers/plans/2026-05-21-github-actions-daily-report-cron.md`). Posts to Telegram on workflow failure in addition to GitHub email.
- [ ] Add expiration date to `bi_readonly` Postgres role (e.g. `VALID UNTIL '2026-08-21'`) so analyst access auto-expires after 3 months unless renewed.

## Stretch / future
- [ ] Once vote volume is steady, add weekly + monthly automated reports (same GitHub Actions pattern, different cron + endpoint).
- [ ] Add a Russian-language flag to the analyst-onboarding doc once English-speaking analysts join.

---

## Recently closed (see `PROGRESS.md` for the full story)

- 2026-05-21 — GitHub Actions daily cron live.
- 2026-05-21 — QR slug freeze (D-033) deployed.
- 2026-05-21 — Power BI runbook + Russian analyst message published.
- 2026-05-21 — Admin dashboard Russian translation done locally.
- 2026-05-18 — 41/41 A5 poster QR links HTTP 200 in production.
- 2026-05-18 — Repair endpoint + brand theming + archivedAt + admin/analytics endpoints deployed.
