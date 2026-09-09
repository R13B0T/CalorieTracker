import { useId } from 'react';

const SNAPS = [0.5, 0.75, 1, 1.5, 2];

export function PortionSlider({
  value,
  onChange,
  label = 'Portion',
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-bark-700">
          {label}
        </label>
        <span className="text-xs font-bold text-bark-900">
          ×{value.toFixed(2).replace(/\.?0+$/, '')}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0.25}
        max={3}
        step={0.05}
        value={value}
        list={`${id}-snaps`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-euc-500"
      />
      <datalist id={`${id}-snaps`}>
        {SNAPS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="flex gap-1">
        {SNAPS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`chip flex-1 justify-center ${Math.abs(value - s) < 0.01 ? 'bg-euc-500 text-white' : 'bg-sand-200 text-bark-700'}`}
          >
            {s === 1 ? '1×' : `${s}×`}
          </button>
        ))}
      </div>
    </div>
  );
}
