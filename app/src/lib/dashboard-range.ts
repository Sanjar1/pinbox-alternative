// Pure resolver for the admin dashboard's date range.
// Handles both the preset periods (daily/weekly/monthly/yearly) and an
// arbitrary custom range picked via ?from=YYYY-MM-DD&to=YYYY-MM-DD.
// All calendar math is in Asia/Tashkent (UTC+5), matching dashboard-trends.ts
// and admin/page.tsx. Kept dependency-free and side-effect-free so it is unit
// testable without a DB or a request.

import type { DashboardPeriod, BucketMode } from './dashboard-trends';

const TASHKENT_MS = 5 * 60 * 60 * 1000;

const periodLabels: Record<DashboardPeriod, string> = {
  daily: 'Сегодня',
  weekly: 'Эта неделя',
  monthly: 'Этот месяц',
  yearly: 'Этот год',
};

export type ResolvedRange = {
  /** what to pass to buildTrendSeries for bucket granularity */
  bucketMode: BucketMode;
  /** which preset pill to highlight; a custom range highlights none */
  period: DashboardPeriod;
  /** true when driven by from/to rather than a preset */
  isCustom: boolean;
  /** inclusive UTC start of the window */
  start: Date;
  /** exclusive UTC end of the window */
  end: Date;
  /** human date/range label, e.g. "07 июл 2026" or "01 июн 2026 - 07 июл 2026" */
  label: string;
  /** header caption, e.g. "Сегодня" or "Выбранный период" */
  periodLabel: string;
  /** normalized YYYY-MM-DD values to echo back into the date inputs (Tashkent) */
  from: string | null;
  to: string | null;
};

type Ymd = { y: number; m: number; d: number };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Parse a strict YYYY-MM-DD string into calendar parts, validating the round
// trip so "2026-02-31" or garbage is rejected (returns null).
function parseYmd(value: string | undefined): Ymd | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

function ymdToString({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// A "Tashkent midnight" instant for the given calendar day, expressed in UTC.
function tashkentMidnightUtc({ y, m, d }: Ymd): Date {
  // Build the wall-clock midnight as if UTC, then shift back by the offset so
  // the resulting instant is the real UTC time of 00:00 Tashkent.
  return new Date(Date.UTC(y, m - 1, d) - TASHKENT_MS);
}

const RU_MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function labelForYmd({ y, m, d }: Ymd): string {
  return `${String(d).padStart(2, '0')} ${RU_MONTHS_SHORT[m - 1]} ${y}`;
}

function nowTashkent(now: Date): Date {
  return new Date(now.getTime() + TASHKENT_MS);
}

function toUtc(tashkent: Date): Date {
  return new Date(tashkent.getTime() - TASHKENT_MS);
}

function normalizePeriod(value: string | undefined): DashboardPeriod {
  return value === 'weekly' || value === 'monthly' || value === 'yearly' ? value : 'daily';
}

function labelForTashkentDate(t: Date): string {
  return t.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function presetRange(period: DashboardPeriod, now: Date): ResolvedRange {
  const t = nowTashkent(now);
  const startT = new Date(t);
  startT.setUTCHours(0, 0, 0, 0);

  if (period === 'weekly') startT.setUTCDate(startT.getUTCDate() - 6);
  if (period === 'monthly') startT.setUTCDate(1);
  if (period === 'yearly') startT.setUTCMonth(0, 1);

  const label = period === 'daily'
    ? labelForTashkentDate(t)
    : `${labelForTashkentDate(startT)} - ${labelForTashkentDate(t)}`;

  return {
    bucketMode: period,
    period,
    isCustom: false,
    start: toUtc(startT),
    end: now,
    label,
    periodLabel: periodLabels[period],
    from: null,
    to: null,
  };
}

/**
 * Resolve the dashboard window from the request's search params.
 * A valid `from` and/or `to` produces a custom range (one date = a single day);
 * otherwise the `period` preset is used (default `daily`).
 */
export function resolveDashboardRange(
  params: Record<string, string | string[] | undefined>,
  now: Date = new Date(),
): ResolvedRange {
  let from = parseYmd(first(params.from));
  let to = parseYmd(first(params.to));

  // Custom range if either bound was given and valid.
  if (from || to) {
    // A single provided bound means a single-day view.
    if (!from) from = to!;
    if (!to) to = from;
    // Be forgiving about reversed inputs.
    if (ymdToString(from) > ymdToString(to)) {
      const tmp = from;
      from = to;
      to = tmp;
    }

    const start = tashkentMidnightUtc(from);
    // Exclusive end = Tashkent midnight of the day AFTER `to`.
    const end = tashkentMidnightUtc({ y: to.y, m: to.m, d: to.d + 1 });
    const sameDay = ymdToString(from) === ymdToString(to);
    const label = sameDay ? labelForYmd(from) : `${labelForYmd(from)} - ${labelForYmd(to)}`;

    return {
      bucketMode: 'custom',
      period: 'daily', // no preset pill highlighted for a custom range
      isCustom: true,
      start,
      end,
      label,
      periodLabel: 'Выбранный период',
      from: ymdToString(from),
      to: ymdToString(to),
    };
  }

  return presetRange(normalizePeriod(first(params.period)), now);
}
