import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { portionsFor } from '@/lib/food/portions';

export function PortionPicker({
  open,
  name,
  kcal100,
  onClose,
  onPick,
  servingG,
}: {
  open: boolean;
  name: string;
  kcal100: number;
  onClose: () => void;
  onPick: (grams: number) => void;
  servingG?: number;
}) {
  const presets = portionsFor(name);
  const [grams, setGrams] = useState<number>(
    servingG ?? presets[Math.min(1, presets.length - 1)].g,
  );
  useEffect(() => {
    if (open) setGrams(servingG ?? presets[Math.min(1, presets.length - 1)].g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name]);
  return (
    <Sheet open={open} onClose={onClose} title={name}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {servingG && (
            <button
              className={`chip ${grams === servingG ? 'bg-euc-500 text-white' : 'bg-sand-200 text-bark-900'}`}
              onClick={() => setGrams(servingG)}
            >
              1 serve ({servingG} g)
            </button>
          )}
          {presets.map((p) => (
            <button
              key={p.label}
              className={`chip ${grams === p.g ? 'bg-euc-500 text-white' : 'bg-sand-200 text-bark-900'}`}
              onClick={() => setGrams(p.g)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            className="input w-32"
            type="number"
            inputMode="decimal"
            value={grams}
            min={1}
            onChange={(e) => setGrams(Number(e.target.value))}
            aria-label="Grams"
          />
          <span className="text-sm text-bark-700">
            g · <b>{Math.round((kcal100 * grams) / 100)}</b> kcal
          </span>
        </div>
        <button
          className="btn-primary"
          disabled={!grams || grams <= 0}
          onClick={() => onPick(grams)}
        >
          Add
        </button>
      </div>
    </Sheet>
  );
}
