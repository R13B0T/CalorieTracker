export function MacroBar({
  label,
  value,
  target,
  colour,
  unit = 'g',
}: {
  label: string;
  value: number;
  target: number;
  colour: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-semibold text-bark-700">
        <span>{label}</span>
        <span>
          {Math.round(value)}
          <span className="text-bark-500">
            {' '}
            / {Math.round(target)} {unit}
          </span>
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-sand-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: colour }}
        />
      </div>
    </div>
  );
}

export function MacroMini({ p, c, f }: { p: number; c: number; f: number }) {
  const total = p * 4 + c * 4 + f * 9 || 1;
  const w = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-sand-200" aria-hidden>
      <div style={{ width: w(p * 4), background: 'var(--color-protein)' }} />
      <div style={{ width: w(c * 4), background: 'var(--color-carbs)' }} />
      <div style={{ width: w(f * 9), background: 'var(--color-fat)' }} />
    </div>
  );
}
