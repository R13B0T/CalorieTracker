interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  emoji?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: Option<T>[];
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className={`grid ${cols} gap-2`} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`text-left rounded-xl border-2 px-3 py-3 transition active:scale-[0.98] ${
              active
                ? 'border-euc-500 bg-euc-100'
                : 'border-sand-200 bg-sand-50 hover:border-sand-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-bark-900">
              {o.emoji && <span aria-hidden>{o.emoji}</span>}
              <span>{o.label}</span>
            </div>
            {o.hint && <div className="text-xs text-bark-500 mt-0.5">{o.hint}</div>}
          </button>
        );
      })}
    </div>
  );
}
