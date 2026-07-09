// Pure helpers for dashboard trend charts.
// All times are interpreted in Asia/Tashkent (UTC+5) to match
// the existing nowTashkent / getPeriodRange helpers in app/admin/page.tsx.

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
// 'custom' = an arbitrary from/to range picked in the UI; its chart granularity
// is chosen from the span (see resolveGranularity) rather than fixed by preset.
export type BucketMode = DashboardPeriod | 'custom';
type Granularity = 'hour' | 'day' | 'month';

const DAY_MS = 24 * 60 * 60 * 1000;

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

// Chart granularity per bucket mode. Presets keep their original fixed
// granularity; a 'custom' range picks by span so the chart stays readable
// and the bucket count stays bounded:
//   daily  -> hour   |  weekly/monthly -> day  |  yearly -> month
//   custom -> hour (<=2 days), day (<=62 days), else month
function resolveGranularity(mode: BucketMode, start: Date, end: Date): Granularity {
  if (mode === 'daily') return 'hour';
  if (mode === 'yearly') return 'month';
  if (mode === 'weekly' || mode === 'monthly') return 'day';
  const spanDays = (end.getTime() - start.getTime()) / DAY_MS;
  if (spanDays <= 2) return 'hour';
  if (spanDays <= 62) return 'day';
  return 'month';
}

// Returns ascending list of bucket-start instants (UTC) covering [start, end),
// bucketed at the granularity resolved from `mode` + span.
export function buildBuckets(
  mode: BucketMode,
  start: Date,
  end: Date,
): { startUtc: Date; label: string }[] {
  const buckets: { startUtc: Date; label: string }[] = [];
  const startT = toTashkent(start);
  const endT = toTashkent(end);
  const granularity = resolveGranularity(mode, start, end);

  if (granularity === 'hour') {
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

  if (granularity === 'month') {
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

  // day granularity: weekday labels for the weekly preset, calendar dates otherwise
  const cursor = new Date(startT);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor < endT) {
    const label = mode === 'weekly'
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
  mode: BucketMode,
  start: Date,
  end: Date,
  stores: StoreForTrend[],
): { votes: TrendSeries; rating: TrendSeries; zero: TrendSeries } {
  const buckets = buildBuckets(mode, start, end);

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
