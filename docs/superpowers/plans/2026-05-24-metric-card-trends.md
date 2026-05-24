# Metric Card Trend Charts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline-expand trend line charts to 3 of the 4 metric cards on `/admin` (Голосов, Средняя оценка, Магазины без голосов). `Сканов QR` stays non-clickable because the schema has no scan-event history.

**Architecture:** Server Component `app/src/app/admin/page.tsx` computes three trend series in-memory from the feedback rows it already fetches (no new DB queries). A new client component renders the four cards plus a toggleable trend panel below them. Chart is an inline SVG component (~80 LOC, zero new dependencies).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Prisma 5. No test framework in this project — verification is `tsc`, `eslint`, `next build`, and behavioral browser screenshots via `claude-in-chrome`.

**Spec:** `docs/superpowers/specs/2026-05-24-metric-card-trends-design.md`
**Mockup:** `docs/mockups/dashboard-trend-charts-proposals.html` (proposal 1 was approved)

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/src/lib/dashboard-trends.ts` | Create | Pure functions: bucket boundaries for a period, aggregate feedback rows into 3 trend series. No React, no Prisma — easy to test/inspect. |
| `app/src/app/admin/trend-chart.tsx` | Create | Pure presentational client component. Renders an inline SVG line chart from `{ points, yFormat }`. |
| `app/src/app/admin/metric-cards-with-trends.tsx` | Create | `"use client"` component. Owns open/closed + active-metric state. Renders the 4 cards (3 clickable, 1 muted) and the toggleable trend panel. |
| `app/src/app/admin/page.tsx` | Modify | Compute trend series via `dashboard-trends.ts`. Replace the inline metric cards `<section>` with `<MetricCardsWithTrends ... />`. Delete the local `MetricCard` helper (moved into the new client component). |

No package additions, no schema changes, no API route changes.

---

## Task 1 — Pure data layer: bucket helpers and trend aggregation

**Files:**
- Create: `app/src/lib/dashboard-trends.ts`

This task produces all the data shaping logic in a pure-function file. The Server Component will call into this in Task 4. Splitting it out keeps `page.tsx` small and lets us reason about the bucket math in isolation.

- [ ] **Step 1: Create the file with bucket + aggregation helpers**

Create `app/src/lib/dashboard-trends.ts` with the exact content below:

```ts
// Pure helpers for dashboard trend charts.
// All times are interpreted in Asia/Tashkent (UTC+5) to match
// the existing nowTashkent / getPeriodRange helpers in app/admin/page.tsx.

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TrendPoint = {
  // x-axis label rendered under each bucket ("14:00", "Пн", "12 май", "Янв")
  label: string;
  // raw value; null = no data in bucket (chart renders a gap)
  value: number | null;
};

export type TrendSeries = {
  metric: 'votes' | 'rating' | 'zero';
  title: string;
  points: TrendPoint[];
  yFormat: 'int' | 'rating';
};

export type FeedbackForTrend = {
  rating: number;
  createdAt: Date;
};

export type StoreForTrend = {
  feedbacks: FeedbackForTrend[];
};

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

// Convert a UTC Date to a "Tashkent wall clock" Date whose UTC fields equal
// the Tashkent local-time fields. Re-converting via -TASHKENT_OFFSET_MS gives
// the original UTC instant back. This mirrors the helpers in page.tsx.
function toTashkent(utc: Date): Date {
  return new Date(utc.getTime() + TASHKENT_OFFSET_MS);
}
function fromTashkent(tashkent: Date): Date {
  return new Date(tashkent.getTime() - TASHKENT_OFFSET_MS);
}

const RU_MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];
const RU_WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// Returns ascending list of bucket-start instants (UTC) covering [start, end).
// Granularity is chosen by period:
//   daily  -> 1 hour buckets (Tashkent wall-clock hours)
//   weekly -> 1 day buckets
//   monthly -> 1 day buckets
//   yearly -> 1 month buckets
export function buildBuckets(
  period: DashboardPeriod,
  start: Date,
  end: Date,
): { startUtc: Date; label: string }[] {
  const buckets: { startUtc: Date; label: string }[] = [];
  const startT = toTashkent(start);
  const endT = toTashkent(end);

  if (period === 'daily') {
    const cursor = new Date(startT);
    cursor.setUTCMinutes(0, 0, 0);
    while (cursor < endT) {
      buckets.push({
        startUtc: fromTashkent(cursor),
        label: `${String(cursor.getUTCHours()).padStart(2, '0')}:00`,
      });
      cursor.setUTCHours(cursor.getUTCHours() + 1);
    }
    return buckets;
  }

  if (period === 'yearly') {
    const cursor = new Date(startT);
    cursor.setUTCDate(1);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor < endT) {
      buckets.push({
        startUtc: fromTashkent(cursor),
        label: RU_MONTHS_SHORT[cursor.getUTCMonth()],
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return buckets;
  }

  // weekly + monthly => day buckets
  const cursor = new Date(startT);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor < endT) {
    const label = period === 'weekly'
      ? RU_WEEKDAYS_SHORT[cursor.getUTCDay()]
      : `${cursor.getUTCDate()} ${RU_MONTHS_SHORT[cursor.getUTCMonth()]}`;
    buckets.push({ startUtc: fromTashkent(cursor), label });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}

// Returns the bucket index (in `buckets`) for a given feedback instant, or -1
// if it falls outside the range.
function bucketIndexFor(
  buckets: { startUtc: Date }[],
  instant: Date,
): number {
  // Linear scan is fine — at most 31 buckets for monthly view.
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (instant >= buckets[i].startUtc) return i;
  }
  return -1;
}

export function buildTrendSeries(
  period: DashboardPeriod,
  start: Date,
  end: Date,
  stores: StoreForTrend[],
): { votes: TrendSeries; rating: TrendSeries; zero: TrendSeries } {
  const buckets = buildBuckets(period, start, end);

  const voteCounts = new Array(buckets.length).fill(0) as number[];
  const ratingSums = new Array(buckets.length).fill(0) as number[];
  // Per-bucket set of store indexes that DID get a vote this bucket.
  const storesWithVotesByBucket: Set<number>[] = buckets.map(() => new Set());

  stores.forEach((store, storeIdx) => {
    for (const fb of store.feedbacks) {
      const idx = bucketIndexFor(buckets, fb.createdAt);
      if (idx < 0) continue;
      voteCounts[idx] += 1;
      ratingSums[idx] += fb.rating;
      storesWithVotesByBucket[idx].add(storeIdx);
    }
  });

  const votes: TrendSeries = {
    metric: 'votes',
    title: 'Тренд: Голосов',
    yFormat: 'int',
    points: buckets.map((b, i) => ({ label: b.label, value: voteCounts[i] })),
  };

  const rating: TrendSeries = {
    metric: 'rating',
    title: 'Тренд: Средняя оценка',
    yFormat: 'rating',
    points: buckets.map((b, i) => ({
      label: b.label,
      value: voteCounts[i] === 0 ? null : ratingSums[i] / voteCounts[i],
    })),
  };

  const totalStores = stores.length;
  const zero: TrendSeries = {
    metric: 'zero',
    title: 'Тренд: Магазины без голосов',
    yFormat: 'int',
    points: buckets.map((b, i) => ({
      label: b.label,
      value: totalStores - storesWithVotesByBucket[i].size,
    })),
  };

  return { votes, rating, zero };
}
```

- [ ] **Step 2: Type-check the new file**

Run: `cd app && npx tsc --noEmit`
Expected: PASS with no errors (the existing project may print some pre-existing warnings — the requirement is that none of them point at `dashboard-trends.ts`).

- [ ] **Step 3: Smoke-test the helpers from a tiny script**

Create a throwaway file `app/scripts/tmp-trend-smoke.mjs`:

```js
import { buildBuckets, buildTrendSeries } from '../src/lib/dashboard-trends.ts';

// quick smoke: weekly bucket count = 7
const start = new Date('2026-05-18T00:00:00Z');
const end   = new Date('2026-05-25T00:00:00Z');
const buckets = buildBuckets('weekly', start, end);
console.log('weekly buckets:', buckets.length, buckets.map(b => b.label));

const stores = [
  { feedbacks: [{ rating: 5, createdAt: new Date('2026-05-19T10:00:00Z') }] },
  { feedbacks: [] },
];
const series = buildTrendSeries('weekly', start, end, stores);
console.log('votes:', series.votes.points.map(p => p.value));
console.log('rating:', series.rating.points.map(p => p.value));
console.log('zero:', series.zero.points.map(p => p.value));
```

Run: `cd app && npx tsx scripts/tmp-trend-smoke.mjs`
Expected:
- 7 weekly bucket labels printed
- `votes` array has one non-zero entry
- `rating` array has one non-null entry equal to 5
- `zero` array has one entry of `1` and six of `2`

If `tsx` isn't installed, install it with `npm i -D tsx` for this smoke test only, then remove from package.json after. **Alternative:** rename to `.ts` and run via `npx ts-node`. If neither works locally, skip this step and rely on Task 4's behavioral verification.

- [ ] **Step 4: Delete the smoke-test file**

Delete `app/scripts/tmp-trend-smoke.mjs`. (Or leave it — it's gitignored under `scripts/tmp-*`.)

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/dashboard-trends.ts
git commit -m "feat(dashboard): add pure helpers for metric trend bucketing"
```

---

## Task 2 — Presentational chart component

**Files:**
- Create: `app/src/app/admin/trend-chart.tsx`

A pure inline-SVG line chart. Receives `{ points, yFormat, accentClass }`, renders an SVG. No state.

- [ ] **Step 1: Create `trend-chart.tsx`**

```tsx
'use client';

import type { TrendPoint } from '@/lib/dashboard-trends';

type Props = {
  points: TrendPoint[];
  yFormat: 'int' | 'rating';
};

const WIDTH = 720;
const HEIGHT = 240;
const PAD = 36;

function formatY(value: number, fmt: 'int' | 'rating'): string {
  return fmt === 'rating' ? value.toFixed(1) : String(Math.round(value));
}

export function TrendChart({ points, yFormat }: Props) {
  const numericValues = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null);

  if (numericValues.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
        Нет данных за выбранный период.
      </div>
    );
  }

  const rawMax = Math.max(...numericValues);
  const rawMin = Math.min(...numericValues);
  const max = yFormat === 'rating'
    ? Math.min(5, rawMax + 0.3)
    : rawMax * 1.15 + 1;
  const min = yFormat === 'rating'
    ? Math.max(0, rawMin - 0.3)
    : 0;
  const range = max - min || 1;
  const stepX = (WIDTH - PAD * 2) / Math.max(1, points.length - 1);

  const coords = points.map((p, i) => ({
    label: p.label,
    value: p.value,
    x: PAD + i * stepX,
    y: p.value === null
      ? null
      : HEIGHT - PAD - ((p.value - min) / range) * (HEIGHT - PAD * 2),
  }));

  // Build a path that skips null points by starting a new sub-path.
  let path = '';
  let pendingMove = true;
  for (const c of coords) {
    if (c.y === null) { pendingMove = true; continue; }
    path += `${pendingMove ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)} `;
    pendingMove = false;
  }

  // Area fill: only when we have an unbroken series.
  const hasGaps = coords.some((c) => c.y === null);
  let area = '';
  if (!hasGaps) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    area = `${path} L ${last.x.toFixed(1)} ${HEIGHT - PAD} L ${first.x.toFixed(1)} ${HEIGHT - PAD} Z`;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
      <defs>
        <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((t) => {
        const y = HEIGHT - PAD - t * (HEIGHT - PAD * 2);
        const v = min + t * range;
        return (
          <g key={t}>
            <line x1={PAD} x2={WIDTH - PAD} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
            <text x={PAD - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {formatY(v, yFormat)}
            </text>
          </g>
        );
      })}

      {area && <path d={area} fill="url(#trendGrad)" />}
      {path && <path d={path} fill="none" stroke="#f59e0b" strokeWidth="2.5" />}

      {coords.map((c, i) =>
        c.y === null ? null : (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="4" fill="#f59e0b" stroke="white" strokeWidth="2" />
            <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f172a">
              {formatY(c.value as number, yFormat)}
            </text>
          </g>
        ),
      )}

      {coords.map((c, i) => (
        <text
          key={`xl-${i}`}
          x={c.x}
          y={HEIGHT - PAD + 18}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          {c.label}
        </text>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd app && npx tsc --noEmit`
Expected: PASS for the new file.

- [ ] **Step 3: Commit**

```bash
git add app/src/app/admin/trend-chart.tsx
git commit -m "feat(dashboard): add inline SVG trend chart component"
```

---

## Task 3 — Client component: cards + toggleable trend panel

**Files:**
- Create: `app/src/app/admin/metric-cards-with-trends.tsx`

Renders the 4 cards plus the panel. Owns local state `activeMetric: 'votes' | 'rating' | 'zero' | null`. Three cards are buttons; the Сканов QR card is a static `<div>`.

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import type { TrendSeries } from '@/lib/dashboard-trends';
import { TrendChart } from './trend-chart';

type Metric = 'votes' | 'rating' | 'zero';

type Props = {
  periodLabel: string;
  totalStores: number;
  totalVotes: number;
  avgRating: number;
  zeroVoteStores: number;
  totalScans: number;
  trends: { votes: TrendSeries; rating: TrendSeries; zero: TrendSeries };
};

export function MetricCardsWithTrends({
  periodLabel,
  totalStores,
  totalVotes,
  avgRating,
  zeroVoteStores,
  totalScans,
  trends,
}: Props) {
  const [active, setActive] = useState<Metric | null>(null);

  const toggle = (m: Metric) => setActive((cur) => (cur === m ? null : m));
  const activeSeries = active ? trends[active] : null;

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Всего магазинов"
          value={String(totalStores)}
          note="Активные магазины в данном разрезе"
        />
        <ClickableMetricCard
          label={`${periodLabel} — голосов`}
          value={String(totalVotes)}
          note="Голосов получено за период"
          active={active === 'votes'}
          onClick={() => toggle('votes')}
          ariaControlsId="dashboard-trend-panel"
        />
        <ClickableMetricCard
          label="Средняя оценка"
          value={totalVotes === 0 ? '-' : avgRating.toFixed(1)}
          note="За выбранный период"
          active={active === 'rating'}
          onClick={() => toggle('rating')}
          ariaControlsId="dashboard-trend-panel"
        />
        <ClickableMetricCard
          label="Магазины без голосов"
          value={String(zeroVoteStores)}
          note="Видны в таблице ниже"
          active={active === 'zero'}
          onClick={() => toggle('zero')}
          ariaControlsId="dashboard-trend-panel"
        />
        <MetricCard
          label="Сканов QR"
          value={String(totalScans)}
          note="Всего за всё время (история сканов не датируется)"
          muted
        />
      </section>

      {activeSeries && (
        <section
          id="dashboard-trend-panel"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-950">{activeSeries.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{periodLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Закрыть тренд"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Закрыть ✕
            </button>
          </div>
          <div className="mt-6">
            <TrendChart points={activeSeries.points} yFormat={activeSeries.yFormat} />
          </div>
        </section>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  note,
  muted = false,
}: {
  label: string;
  value: string;
  note: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${muted ? 'opacity-80' : ''}`}
    >
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function ClickableMetricCard({
  label,
  value,
  note,
  active,
  onClick,
  ariaControlsId,
}: {
  label: string;
  value: string;
  note: string;
  active: boolean;
  onClick: () => void;
  ariaControlsId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-controls={ariaControlsId}
      className={`group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'outline outline-2 outline-amber-500 outline-offset-2' : ''
      }`}
    >
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
        {active ? '▾ Закрыть тренд' : '▸ Нажмите для тренда'}
      </p>
    </button>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd app && npx tsc --noEmit`
Expected: PASS for the new file.

- [ ] **Step 3: Commit**

```bash
git add app/src/app/admin/metric-cards-with-trends.tsx
git commit -m "feat(dashboard): add clickable metric cards with trend panel"
```

---

## Task 4 — Wire it into the dashboard page

**Files:**
- Modify: `app/src/app/admin/page.tsx`

Replace the inline `<section>` of metric cards (lines 210–216 of the current file) and the local `MetricCard` helper at the bottom with the new client component. Compute trend series via `buildTrendSeries` from the existing `stores` query.

- [ ] **Step 1: Add the new imports**

At the top of `app/src/app/admin/page.tsx`, alongside the existing imports, add:

```ts
import { buildTrendSeries } from '@/lib/dashboard-trends';
import { MetricCardsWithTrends } from './metric-cards-with-trends';
```

- [ ] **Step 2: Compute the trend series after `zeroVoteStores`**

After this line in the current file:

```ts
const zeroVoteStores = stores.filter((store) => store.feedbacks.length === 0).length;
```

Add:

```ts
const trends = buildTrendSeries(period, range.start, range.end, stores);
```

- [ ] **Step 3: Replace the inline metric `<section>` with the new component**

Find this block in the current file:

```tsx
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Всего магазинов" value={String(totalStores)} note="Активные магазины в данном разрезе" />
        <MetricCard label={`${periodLabels[period]} — голосов`} value={String(totalVotes)} note="Голосов получено за период" />
        <MetricCard label="Средняя оценка" value={totalVotes === 0 ? '-' : avgRating.toFixed(1)} note="За выбранный период" />
        <MetricCard label="Магазины без голосов" value={String(zeroVoteStores)} note="Видны в таблице ниже" />
        <MetricCard label="Сканов QR" value={String(totalScans)} note="Всего за всё время (история сканов не датируется)" />
      </section>
```

Replace with:

```tsx
      <MetricCardsWithTrends
        periodLabel={periodLabels[period]}
        totalStores={totalStores}
        totalVotes={totalVotes}
        avgRating={avgRating}
        zeroVoteStores={zeroVoteStores}
        totalScans={totalScans}
        trends={trends}
      />
```

- [ ] **Step 4: Delete the local `MetricCard` helper**

Remove this block at the bottom of the file (lines ~312–328 of the original):

```tsx
function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}
```

- [ ] **Step 5: Type-check and lint**

Run: `cd app && npx tsc --noEmit`
Expected: PASS.

Run: `cd app && npm run lint`
Expected: no errors related to admin/page.tsx, trend-chart.tsx, metric-cards-with-trends.tsx, or dashboard-trends.ts.

- [ ] **Step 6: Build**

Run: `cd app && npm run build`
Expected: build completes successfully. `/admin` appears in the route summary.

- [ ] **Step 7: Commit**

```bash
git add app/src/app/admin/page.tsx
git commit -m "feat(dashboard): wire trend charts into admin metric cards"
```

---

## Task 5 — Behavioral verification (mandatory — there are no unit tests)

This project has no Jest/Vitest setup. Per CLAUDE.md, behavioral proof = run the app and screenshot.

- [ ] **Step 1: Start the dev server**

Run in background: `cd app && npm run dev`
Wait for the line: `▲ Next.js ... ready in`
Expected URL: `http://localhost:3000`

- [ ] **Step 2: Open the admin dashboard in claude-in-chrome**

Use ToolSearch to load `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__click_screen,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__gif_creator`.

1. Get tab context.
2. Open `http://localhost:3000/admin` in a new tab.
3. If a login redirect appears, log in with the credentials in `.env.local` (or whichever local admin account is configured). Note in the report which credentials were used.

- [ ] **Step 3: Verify default state**

- Take a screenshot of the dashboard.
- The four cards are visible. Three of them (`— голосов`, `Средняя оценка`, `Магазины без голосов`) show the orange "▸ Нажмите для тренда" hint. The `Сканов QR` card does NOT show that hint and looks muted (opacity-80).
- No trend panel is visible yet.

- [ ] **Step 4: Click "— голосов" card, verify trend chart**

- Click the "— голосов" metric card.
- Take a screenshot.
- A panel appears below the metrics row with title "Тренд: Голосов" and an amber line chart with the period's bucket count (e.g. 7 day-labels for weekly).
- The clicked card shows an amber outline.

- [ ] **Step 5: Click a different card, verify chart swaps**

- Click "Средняя оценка".
- Take a screenshot.
- Chart title becomes "Тренд: Средняя оценка". Outline moves to the new card.
- Confirm no network request fires (read network panel or note that the chart swap is instant).

- [ ] **Step 6: Verify Сканов QR is non-clickable**

- Click the `Сканов QR` card.
- Take a screenshot.
- The panel state does NOT change. No outline appears on that card. Console has no errors.

- [ ] **Step 7: Verify the ✕ close button**

- Click `Закрыть ✕`.
- Take a screenshot.
- Panel disappears. Active card outline clears.

- [ ] **Step 8: Verify period switch resets**

- Click the "Эта неделя" or "Этот месяц" period tab at the top.
- After page reload, take a screenshot.
- Cards show updated totals. Panel is closed by default. Click a card again — chart now reflects the new bucket count (e.g., switch to "Сегодня" → 24 hour buckets).

- [ ] **Step 9: Read browser console**

Run `mcp__claude-in-chrome__read_console_messages` with `pattern: "error"`.
Expected: no errors related to the new components. (Pre-existing harmless warnings from other parts of the app are OK — call them out in the report.)

- [ ] **Step 10: Final commit (if anything changed during verification)**

If you made no further code changes during verification, skip this. Otherwise commit with a focused message.

- [ ] **Step 11: Stop the dev server**

Stop the background `npm run dev` process.

---

## Verification report shape (give this to the reviewer)

```
✅ Cards render: <screenshot link>
✅ Click votes → chart: <screenshot link>
✅ Swap rating: <screenshot link>
✅ Сканов QR non-clickable: <screenshot link>
✅ Close button: <screenshot link>
✅ Period switch: <screenshot link>
✅ tsc clean
✅ eslint clean
✅ next build green
✅ console clean
```

If any check fails, STOP and report the failure with the screenshot + console output. Do NOT mark the task complete.

---

## Out-of-scope reminders (do NOT do these)

- Do not add a chart library (recharts/chart.js/etc.).
- Do not add date-fns or any date library — the helpers in `dashboard-trends.ts` use only the built-in Date API.
- Do not change the Prisma schema or add a migration.
- Do not change `app/src/app/admin/layout.tsx`.
- Do not change the period selector or the stores table.
- Do not deploy to Railway. This stays local until the product owner reviews and says ship.
