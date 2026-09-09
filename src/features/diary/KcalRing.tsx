export function KcalRing({
  eaten,
  target,
  size = 112,
}: {
  eaten: number;
  target: number;
  size?: number;
}) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, eaten / target) : 0;
  const over = target > 0 && eaten > target * 1.1;
  const colour = over
    ? 'var(--color-berry-500)'
    : pct > 0.9
      ? 'var(--color-sun-500)'
      : 'var(--color-euc-500)';
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${Math.round(pct * 100)} percent of calorie target`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-sand-200)"
        strokeWidth="12"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colour}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .5s ease, stroke .3s' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-black"
        fill="var(--color-bark-900)"
        fontSize={size / 5}
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
