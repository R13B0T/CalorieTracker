import { useId } from 'react';

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="input pr-14"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-bark-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
