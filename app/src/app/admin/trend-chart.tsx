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
