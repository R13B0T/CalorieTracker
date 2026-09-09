import type { TrendPoint } from '@/lib/nutrition/trend';

export function WeightChart({ points, goalKg }: { points: TrendPoint[]; goalKg?: number }) {
  if (points.length < 2) {
    return (
      <div className="text-sm text-bark-500 text-center py-6">
        Two or more weigh-ins and a trend line appears here.
      </div>
    );
  }
  const W = 320;
  const H = 140;
  const pad = 24;
  const vals = points.flatMap((p) => (p.raw !== null ? [p.raw, p.trend] : [p.trend]));
  if (goalKg) vals.push(goalKg);
  const min = Math.floor(Math.min(...vals) - 0.5);
  const max = Math.ceil(Math.max(...vals) + 0.5);
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad / 2 - ((v - min) / (max - min || 1)) * (H - pad);
  const trendPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.trend).toFixed(1)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Weight trend chart"
    >
      {[min, (min + max) / 2, max].map((v) => (
        <g key={v}>
          <line
            x1={pad}
            x2={W - pad}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--color-sand-200)"
            strokeDasharray="3 3"
          />
          <text x={2} y={y(v) + 3} fontSize="9" fill="var(--color-bark-500)">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      {goalKg && goalKg >= min && goalKg <= max && (
        <line
          x1={pad}
          x2={W - pad}
          y1={y(goalKg)}
          y2={y(goalKg)}
          stroke="var(--color-sun-500)"
          strokeWidth="1.5"
        />
      )}
      <path
        d={trendPath}
        fill="none"
        stroke="var(--color-euc-500)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {points.map(
        (p, i) =>
          p.raw !== null && (
            <circle key={p.dayKey} cx={x(i)} cy={y(p.raw)} r="3" fill="var(--color-bark-300)" />
          ),
      )}
      <text x={W - pad} y={H - 2} fontSize="9" textAnchor="end" fill="var(--color-bark-500)">
        {points[points.length - 1].dayKey}
      </text>
      <text x={pad} y={H - 2} fontSize="9" fill="var(--color-bark-500)">
        {points[0].dayKey}
      </text>
    </svg>
  );
}
