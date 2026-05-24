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
