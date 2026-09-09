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
            className={`min-w-0 text-left rounded-xl border-2 px-3 py-3 transition active:scale-[0.98] ${columns === 3 ? 'text-sm' : ''} ${
              active
                ? 'border-euc-500 bg-euc-100'
                : 'border-sand-200 bg-sand-50 hover:border-sand-300'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-bold text-bark-900 break-words ${columns === 3 ? 'flex-col text-center' : ''}`}
            >
              {o.emoji && (
                <span aria-hidden className={columns === 3 ? 'text-xl' : ''}>
                  {o.emoji}
                </span>
              )}
              <span className="leading-tight">{o.label}</span>
            </div>
            {o.hint && <div className="text-xs text-bark-500 mt-0.5 break-words">{o.hint}</div>}
          </button>
        );
      })}
    </div>
  );
}
