import { useState } from 'react';
import type { FoodItem } from '@/lib/db/types';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { PortionSlider } from '@/components/ui/Slider';
import { MacroMini } from '@/components/ui/MacroBar';
import { scaled } from '@/lib/nutrition/totals';
import { kcalToKj } from '@/lib/nutrition/units';

export function ItemRow({
  item,
  onChange,
  onRemove,
  defaultOpen,
}: {
  item: FoodItem;
  onChange: (next: FoodItem) => void;
  onRemove: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [editingGrams, setEditingGrams] = useState(false);
  const n = scaled(item);
  const grams = Math.round(item.grams * item.scale);

  function setGrams(g: number) {
    if (!Number.isFinite(g) || g <= 0) return;
    onChange({ ...item, scale: g / item.grams, userEdited: true });
  }

  return (
    <li className="card p-3 flex flex-col gap-2">
      <button type="button" className="flex items-start justify-between gap-3 text-left w-full" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-bark-900 truncate">{item.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <ConfidenceBadge level={item.confidence} />
            <span className="text-xs text-bark-500">
              {grams} g · {Math.round(kcalToKj(n.kcal))} kJ
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-black text-lg leading-tight">{Math.round(n.kcal)}</div>
          <div className="text-[10px] text-bark-500 font-semibold">kcal</div>
        </div>
      </button>
      <MacroMini p={n.protein} c={n.carbs} f={n.fat} />
      {open && (
        <div className="flex flex-col gap-3 pt-1 animate-pop">
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <Stat label="Protein" v={n.protein} colour="var(--color-protein)" />
            <Stat label="Carbs" v={n.carbs} colour="var(--color-carbs)" />
            <Stat label="Fat" v={n.fat} colour="var(--color-fat)" />
            <Stat label="Fibre" v={n.fibre} colour="var(--color-fibre)" />
          </div>
          <PortionSlider value={item.scale} onChange={(s) => onChange({ ...item, scale: s, userEdited: true })} />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-bark-700 font-semibold">Exact grams</span>
            {editingGrams ? (
              <input
                autoFocus
                className="input py-1 px-2 w-24 text-sm"
                type="number"
                inputMode="decimal"
                defaultValue={grams}
                onBlur={(e) => {
                  setGrams(Number(e.target.value));
                  setEditingGrams(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
              />
            ) : (
              <button type="button" className="chip bg-sand-200 text-bark-900" onClick={() => setEditingGrams(true)}>
                {grams} g ✎
              </button>
            )}
          </div>
          {item.assumptions && item.assumptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.assumptions.map((a) => (
                <span key={a} className="chip bg-sand-200 text-bark-700 font-medium">
                  💭 {a}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <input
              className="input py-1 px-2 text-sm flex-1 mr-2"
              value={item.name}
              onChange={(e) => onChange({ ...item, name: e.target.value, userEdited: true })}
              aria-label="Item name"
            />
            <button type="button" className="btn-ghost text-berry-500 px-3 py-1 text-sm" onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Stat({ label, v, colour }: { label: string; v: number; colour: string }) {
  return (
    <div className="rounded-lg bg-sand-100 py-1.5">
      <div className="font-black" style={{ color: colour }}>
        {Math.round(v)}g
      </div>
      <div className="text-[10px] text-bark-500 font-semibold">{label}</div>
    </div>
  );
}
