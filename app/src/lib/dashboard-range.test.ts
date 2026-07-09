import { describe, it, expect } from 'vitest';
import { resolveDashboardRange } from './dashboard-range';

// Fixed "now" = 2026-07-09 12:00 UTC (17:00 Tashkent) for deterministic presets.
const NOW = new Date('2026-07-09T12:00:00.000Z');

describe('resolveDashboardRange — presets', () => {
  it('defaults to daily when nothing is given', () => {
    const r = resolveDashboardRange({}, NOW);
    expect(r.isCustom).toBe(false);
    expect(r.period).toBe('daily');
    expect(r.bucketMode).toBe('daily');
    expect(r.periodLabel).toBe('Сегодня');
    // daily window starts at 00:00 Tashkent on 2026-07-09 = 2026-07-08T19:00Z
    expect(r.start.toISOString()).toBe('2026-07-08T19:00:00.000Z');
    expect(r.end).toEqual(NOW);
  });

  it('honours weekly / monthly / yearly presets', () => {
    expect(resolveDashboardRange({ period: 'weekly' }, NOW).bucketMode).toBe('weekly');
    expect(resolveDashboardRange({ period: 'monthly' }, NOW).bucketMode).toBe('monthly');
    expect(resolveDashboardRange({ period: 'yearly' }, NOW).bucketMode).toBe('yearly');
  });

  it('ignores an unknown period and falls back to daily', () => {
    expect(resolveDashboardRange({ period: 'nonsense' }, NOW).period).toBe('daily');
  });
});

describe('resolveDashboardRange — custom range', () => {
  it('a single from-date is a single day', () => {
    const r = resolveDashboardRange({ from: '2026-06-07' }, NOW);
    expect(r.isCustom).toBe(true);
    expect(r.bucketMode).toBe('custom');
    expect(r.from).toBe('2026-06-07');
    expect(r.to).toBe('2026-06-07');
    // 00:00 Tashkent 07 Jun .. 00:00 Tashkent 08 Jun, expressed in UTC
    expect(r.start.toISOString()).toBe('2026-06-06T19:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-06-07T19:00:00.000Z');
    expect(r.label).toBe('07 июн 2026');
    expect(r.periodLabel).toBe('Выбранный период');
  });

  it('a from/to pair is an inclusive range', () => {
    const r = resolveDashboardRange({ from: '2026-06-01', to: '2026-06-15' }, NOW);
    expect(r.isCustom).toBe(true);
    expect(r.start.toISOString()).toBe('2026-05-31T19:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-06-15T19:00:00.000Z'); // exclusive end = 00:00 16 Jun Tashkent
    expect(r.label).toBe('01 июн 2026 - 15 июн 2026');
  });

  it('swaps a reversed range', () => {
    const r = resolveDashboardRange({ from: '2026-06-15', to: '2026-06-01' }, NOW);
    expect(r.from).toBe('2026-06-01');
    expect(r.to).toBe('2026-06-15');
  });

  it('a single to-date also yields that day', () => {
    const r = resolveDashboardRange({ to: '2026-06-20' }, NOW);
    expect(r.from).toBe('2026-06-20');
    expect(r.to).toBe('2026-06-20');
  });

  it('rejects an invalid date and falls back to the preset', () => {
    expect(resolveDashboardRange({ from: '2026-02-31' }, NOW).isCustom).toBe(false);
    expect(resolveDashboardRange({ from: 'garbage', period: 'weekly' }, NOW).bucketMode).toBe('weekly');
  });
});
