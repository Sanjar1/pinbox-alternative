# Roadmap

## Current Milestone: M6 — Deploy/DB Pipeline Hardening (next)

**Status:** Active (opened 2026-06-09). M5 is closed (below). Original focus DONE 2026-07-05: migrations auto-apply on deploy and `/api/health` exercises the DB.

**Railway free-tier-vs-paid: DECIDED 2026-08-13 (D-052) — stay on Hobby $5/mo indefinitely.** This account is not offered a Free plan (`hasExhaustedFreePlan: true`); trying to return to Free is what caused the ~21 h outage on 2026-08-12/13. Never cancel Hobby without written confirmation from Railway.

**Remaining in M6 — the gap both outages exposed: nothing watches production.** Twice now the app has been down for most of a day and been found only because the owner scanned a poster. Next: uptime alerting on the poster domain, run from the Hetzner box so it survives a Railway outage, plus wiring the Telegram failure-alert step into `daily-telegram-report.yml` and `nightly-railway-deploy.yml`. See TODO Priority 0.

## Previous Milestone: M5 — Reporting Activation

**Status:** ✅ DONE & VERIFIED LIVE (2026-06-09). TM-grouped daily report confirmed firing in the managers group with per-manager blocks and every store shown as a row (0-review stores as `0  —`); `sync-managers` → `matched:41` verified against prod.

**Goal:** Reliable daily Telegram reports at 08:00 Tashkent with yesterday's store scores, plus self-service analytics access for the operations analyst, plus quality low-rating alerts.

**Completed in M5:**
- Dashboard updated with daily, weekly, monthly, yearly analytics views.
- Telegram daily report in Russian with all active stores (including 0-vote ones).
- Daily report window switched to yesterday's full Tashkent day.
- Power BI analytics endpoints (`/api/analytics/feedback`, `/api/analytics/stores`) live with Bearer auth.
- Vote cooldown changed to 35 days per device per store.
- **GitHub Actions cron** sends `POST /api/reports/daily` automatically every day at 08:00 Tashkent (worked around Railway free-plan limit). Run #1 verified 2026-05-21.
- **Weekly + monthly GitHub Actions crons** added 2026-05-24 (Mondays + 1st of month, 08:00 Tashkent).
- **Analyst Power BI onboarding** doc published in Russian with Railway runbook and message template. `bi_readonly` role created and verified.
- **Admin dashboard Russian translation** deployed via nightly task.
- **QR slug freeze** (D-033): Prisma client extension blocks any update to printed slugs.
- **Low-rating Telegram alert** rewritten 2026-05-24: Russian, shaming tone, per-question breakdown, debounce buffer (one alert per visit), brand «KAAS Сырная Лавка».

**Outstanding before closing M5:**
- Verify tonight's Railway deploy (23:05 Tashkent) ships `ddd384b` and the new alert template fires correctly in production.

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
