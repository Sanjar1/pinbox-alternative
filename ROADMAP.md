# Roadmap

## Current Milestone: M5 — Reporting Activation

**Status:** Active (unblocked 2026-05-21 via GitHub Actions). Closes after tomorrow's 08:00 Tashkent cron is verified.

**Goal:** Reliable daily Telegram reports at 08:00 Tashkent with yesterday's store scores, plus self-service analytics access for the operations analyst.

**Completed in M5:**
- Dashboard updated with daily, weekly, monthly, yearly analytics views.
- Telegram daily report in Russian with all active stores (including 0-vote ones).
- Daily report window switched to yesterday's full Tashkent day.
- Power BI analytics endpoints (`/api/analytics/feedback`, `/api/analytics/stores`) live with Bearer auth.
- Vote cooldown changed to 35 days per device per store.
- **GitHub Actions cron** sends `POST /api/reports/daily` automatically every day at 08:00 Tashkent (worked around Railway free-plan limit). Run #1 verified 2026-05-21.
- **Analyst Power BI onboarding** doc published in Russian (`docs/ANALYST_POWER_BI_MESSAGE.md`) with Railway runbook and message template.
- **Admin dashboard Russian translation** prepared (typecheck passed; awaiting deploy).
- **QR slug freeze** (D-033): Prisma client extension blocks any update to printed slugs.

**Outstanding before closing M5:**
- Deploy the Russian dashboard translation — **queued for tonight 23:05 Tashkent via `Pinbox-Railway-Night-Deploy`**.
- ~~Owner provisions `bi_readonly` and sends the message to the analyst.~~ **DONE** — `bi_readonly` role created and verified (`metro.proxy.rlwy.net:36355`), password held by owner.
- Verify tomorrow morning's automatic 08:00 Tashkent run actually delivers.

## Completed Milestones

- **M4 — QR Production Completion** (2026-05-18)
  - 41/41 A5 poster QR links return HTTP 200 in production.
  - All 41 stores have unique slugs and DB records.
  - Test votes cleared, Glotok stores split correctly.
- **M0 — Product Definition**
- **M1 — Security Foundation**
- **M2 — Sync/Connector Scaffold (historical)**
- **M3 — QR Feedback Pilot Launch Readiness**

## Upcoming Milestones

- **M6 — Analytics in Production**
  Goal: Analyst delivers the 6 default Power BI dashboards from the onboarding doc and we treat them as the operational source of truth for store performance.

- **M7 — Data Quality Operations**
  Keep store/slug inventory synchronized to avoid placeholder regressions. (Lower priority now that slugs are write-locked.)

## Deferred / Archived Tracks

- Yandex integration track (archived)
- Google integration track (archived)
- 2GIS integration track (archived)
- Social media publishing track (out of scope)
