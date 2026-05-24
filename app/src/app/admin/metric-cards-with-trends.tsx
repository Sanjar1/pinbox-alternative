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
