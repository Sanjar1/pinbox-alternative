# Design: Metric Card Trend Charts on Admin Dashboard

**Date:** 2026-05-24
**Owner:** sismatullaev@gmail.com (product owner) — implementation by Sonnet, reviewed by Opus
**Scope:** Single feature on `/admin` dashboard. Minimal-change.

---

## 1. Goal

Make three of the metric cards on the admin dashboard clickable. Clicking a card reveals a trend line chart below the metrics grid so the user can understand how that metric is changing over the selected period.

Approved interaction (from mockup `docs/mockups/dashboard-trend-charts-proposals.html`, proposal 1): **inline expand panel**.

---

## 2. Scope — explicit

### In scope (clickable cards, real trend data)

| Card | Metric trended |
|------|----------------|
| `Голосов` (period total) | Count of vote-rows per time bucket |
| `Средняя оценка` | Average rating per time bucket |
| `Магазины без голосов` | Number of stores with 0 votes in that bucket |

### Out of scope

- **`Сканов QR` card** — the `QRCode.scans` field is a counter with no per-scan history. The card stays non-clickable with a muted "—" hint. Adding scan-event logging is a separate future feature.
- **`Всего магазинов` card** — mostly static, no useful trend.
- New chart libraries. We render an inline SVG line chart (~80 lines).
- Drill-down per store. Period filter at the top still controls everything.
- Mobile-specific layout. The existing dashboard is desktop-first; the trend panel follows the same convention.

---

## 3. UX behavior

1. Three cards get a subtle "▸" affordance and a hover lift (matches existing card shadow style).
2. Clicking a card:
   - Highlights that card with an amber outline.
   - Renders a trend panel directly below the metrics grid (`<section>` between the cards row and the stores table).
3. Clicking a different card swaps the chart **without** collapsing/expanding (no network round-trip — data preloaded server-side).
4. Clicking the active card again, or the ✕ close button, collapses the panel.
5. Period selector at the top still controls the time range. Switching period reloads the page (existing behavior) and the trend panel collapses by default.

---

## 4. Bucket granularity by period

| Period | Bucket | Number of buckets |
|--------|--------|-------------------|
| Сегодня (daily) | 1 hour | 24 |
| Эта неделя (weekly) | 1 day | 7 |
| Этот месяц (monthly) | 1 day | 28–31 |
| Этот год (yearly) | 1 month | 12 |

All buckets are computed in **Asia/Tashkent** local time, consistent with the existing `nowTashkent` / `getPeriodRange` helpers in `app/src/app/admin/page.tsx`.

Buckets with zero feedbacks render as `0` for votes, `null` for avg rating (line drops to baseline gap — chart renders a soft tick with no point).

---

## 5. Data approach

**No new DB query.** The existing dashboard fetch already pulls every relevant `Feedback` (rating + createdAt) for the period via the `stores` query. Trend series are derived from that in-memory.

For "Магазины без голосов" trend per bucket: count stores whose `feedbacks` array contains zero rows whose `createdAt` falls in that bucket.

This keeps the change additive — no schema migration, no new queries, no new indexes.

---

## 6. Files touched

| File | Change |
|------|--------|
| `app/src/app/admin/page.tsx` | Compute three trend series alongside existing metrics. Replace the static `<section>` of metric cards with a new client component import. Pass metrics + trend series as props. |
| `app/src/app/admin/metric-cards-with-trends.tsx` *(new)* | `"use client"` component. Renders the four cards (3 clickable, 1 static) plus the toggleable trend panel. Owns its open/closed state and which-metric-is-active state. |
| `app/src/app/admin/trend-chart.tsx` *(new)* | Pure presentational client component. Receives `{ label, points: {x:string, y:number\|null}[], formatY }` and renders inline SVG. ~80 LOC. No deps. |

No changes to API routes, Prisma schema, or any other page. No new packages.

---

## 7. Visual style

- Reuse the existing palette (slate-50/100/200, amber-600 accent, white card backgrounds, `rounded-3xl`, `shadow-sm`).
- Chart line: amber-500 (`#f59e0b`), 2.5 px stroke.
- Area fill below line: amber gradient fading to transparent (same as mockup).
- Hover dot tooltip: bucket label + value, slate-900 text on white card.
- Active card outline: `outline outline-2 outline-amber-500 outline-offset-2`.

---

## 8. Edge cases & guarantees

| Case | Behavior |
|------|----------|
| Zero feedbacks in the period | Cards still render. Clicking a card opens an empty-state panel: "Нет данных за выбранный период". |
| Period = daily, fewer than 24 hours elapsed | Only past hours show; future hours are absent. |
| User switches period while panel is open | Panel collapses (page reload). Acceptable for v1. |
| Server Component still does all DB work | No client-side fetching introduced. |
| Touch / no-hover device | Tap-to-open still works; hover lift gracefully degrades. |
| Accessibility | Each card becomes a `<button>` with `aria-expanded` and `aria-controls` pointing to the panel. Close button has `aria-label`. |

---

## 9. Out-of-scope, but worth a note for later

- **Scan history.** If we add per-scan timestamps later, the `Сканов QR` card can join the clickable set with no further UX change.
- **Server-side date_trunc.** If feedback volume grows past ~50k/period, switch from in-memory aggregation to a raw `date_trunc` SQL query.
- **Compare vs previous period.** Could overlay a second line on each chart (delta vs last week, etc.). Not needed now.

---

## 10. Success criteria (behavioral, verified manually)

1. On `/admin`, the three target cards have a hover lift and a "▸ Нажмите для тренда" hint.
2. Clicking each one renders a chart with the correct title and a non-empty line (assuming there's data).
3. Switching cards swaps the chart without a network round-trip (verified via DevTools Network tab — no request).
4. Period selector still works; switching period collapses the panel and the page reloads with new totals.
5. `Сканов QR` card is visibly non-clickable and shows the explanation hint.
6. No new errors in browser console.
7. `next build` still passes, `eslint` clean.
