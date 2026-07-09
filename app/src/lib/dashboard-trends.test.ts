import { describe, it, expect } from 'vitest';
import { buildBuckets } from './dashboard-trends';

// A Tashkent calendar day expressed as a [start, end) UTC window.
function tashkentDay(y: number, m: number, d: number, days = 1) {
  const T = 5 * 60 * 60 * 1000;
  const start = new Date(Date.UTC(y, m - 1, d) - T);
  const end = new Date(Date.UTC(y, m - 1, d + days) - T);
  return { start, end };
}

describe('buildBuckets — preset granularity is unchanged', () => {
  it('daily preset => 24 hourly buckets', () => {
    const { start, end } = tashkentDay(2026, 6, 7);
    const b = buildBuckets('daily', start, end);
    expect(b).toHaveLength(24);
    expect(b[0].label).toBe('00:00');
    expect(b[23].label).toBe('23:00');
  });

  it('weekly preset => day buckets with weekday labels', () => {
    const { start, end } = tashkentDay(2026, 6, 1, 7);
    const b = buildBuckets('weekly', start, end);
    expect(b).toHaveLength(7);
    // labels are RU weekday abbreviations, not calendar dates
    expect(['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']).toContain(b[0].label);
  });
});

describe('buildBuckets — custom range picks granularity by span', () => {
  it('<= 2 days => hourly', () => {
    const { start, end } = tashkentDay(2026, 6, 7, 1);
    expect(buildBuckets('custom', start, end)).toHaveLength(24);
  });

  it('a 15-day custom range => daily buckets with date labels', () => {
    const { start, end } = tashkentDay(2026, 6, 1, 15);
    const b = buildBuckets('custom', start, end);
    expect(b).toHaveLength(15);
    expect(b[0].label).toBe('1 июн');
    expect(b[14].label).toBe('15 июн');
  });

  it('a >62-day custom range => monthly buckets', () => {
    const { start, end } = tashkentDay(2026, 1, 1, 120); // ~4 months
    const b = buildBuckets('custom', start, end);
    expect(b.every((x) => ['янв', 'фев', 'мар', 'апр', 'май'].includes(x.label))).toBe(true);
    expect(b.length).toBeGreaterThanOrEqual(4);
    expect(b.length).toBeLessThanOrEqual(5);
  });
});
