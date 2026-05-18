# Progress Log

## 2026-05-18 - 41/41 QR Production Completion + Railway Deploy Fix

**Done:**
- Deployed new code to Railway (deployment `df05f88f` SUCCESS) via `railway up` from `app/` subdirectory.
- Root cause of previous deploy failures identified and fixed: 47MB of `test-output/` images were not gitignored, causing upload timeouts; root-level CLI deploys were using wrong `railway.json` path.
- `archivedAt DateTime?` added to Store model with Prisma migration — applies automatically on container start via `docker-entrypoint.sh`.
- Brand theming system deployed (`app/src/lib/brands.ts` + `brands.runtime.mjs`) with per-brand voting page (`kaas` / `glotok` / `ruba`).
- Admin API endpoints deployed: `/api/admin/repair-a5-links`, `/api/admin/qr-check`, `/api/admin/create-missing-stores`.
- Analytics/reports endpoints deployed: `/api/analytics/feedback`, `/api/reports/{daily,weekly,monthly}`.
- Called `POST /api/admin/repair-a5-links` with `clearFeedback: true` — result: 14 test votes cleared, Глоток Юнусабад (`4c5350`) and Глоток Панельный (`e96943`) created as separate DB stores.
- Full A5 health check confirmed: **41/41 posters = HTTP 200**, 41 unique slugs, 0 duplicates, 0 placeholders.
- `REPORTS_API_KEY=pinbox-reports-2026-secure` set in Railway variables.
- `RAILWAY_CHEATSHEET.md` updated with deploy lessons, admin endpoint docs, and post-deploy checklist.

**Found:**
- Railway's `startCommand` service override sends the command as a CMD argument to the ENTRYPOINT (does not bypass it). `prisma migrate deploy` ran correctly despite not appearing in the runtime logs Railway shows.
- GitHub auto-deploy integration did not trigger on push (delay or webhook issue). CLI deploy from `app/` is the reliable path.

**Next:**
- Enable Telegram daily report scheduler (M5) when vote volume is sufficient.
- Remove `scripts/tmp-*.cjs` helper scripts.

---

## 2026-05-17 - Scheduling + QR Health Audit + Report Logic Finalization

**Done:**
- Implemented and verified report ranking logic: sort by vote count first, then average score.
- Added analytics API endpoint for BI/Power BI use: `GET /api/analytics/feedback`.
- Created scheduled tasks:
  - `Pinbox-Railway-Night-Deploy` (daily `23:05`)
  - `Pinbox-Telegram-Daily-Report` (daily `22:00`, then intentionally disabled).
- Ran full QR URL audit for approved A5 batch (`41` posters).
- Auto-replaced placeholder QR slugs in `21` poster files.

**Found:**
- Initial A5 health check: `14/41` OK, `27/41` 404.
- After placeholder repair: `35/41` OK, `6/41` 404.
- Remaining 6 are blocked by missing production slugs, not template issues.

**Artifacts:**
- `docs/qr-url-health-check-a5-2026-05-17.json`
- `docs/qr-url-health-check-2026-05-17.json`

**Next:**
- Add the 6 missing stores/slugs in production DB.
- Re-run poster fix and confirm `41/41` health.

---

## 2026-05-17 - PM Scope Added for Gemini Execution

**Done:**
- Converted the next implementation wave into PM-controlled tasks.
- Added explicit tasks for:
  - poster text/Unicode correction
  - voting-page and poster design unification
  - 3-version consistent branding
  - regeneration and owner UAT sign-off
- Prepared a dedicated execution prompt file for Gemini.

**Found:**
- Railway should remain unchanged; work is UI/content/design-system + generation pipeline only.
- Main risk is style drift between poster and voting page if shared tokens are not enforced.

**Next:**
- Run Gemini prompt.
- Review Gemini evidence bundle (files changed, commands, screenshots).
- Move to owner testing and final approval.
