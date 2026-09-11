import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { FoodEntry, MealSlot } from '@/lib/db/types';
import { sumItems } from '@/lib/nutrition/totals';
import { formatTime } from '@/lib/date';
import { deleteMeal, duplicateMeal } from '@/lib/db/repos/meals';
import { announce } from '@/lib/game/announce';
import { toast, useSessionStore } from '@/stores/useSessionStore';
import { Sheet } from '@/components/ui/Sheet';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { overallConfidence } from '@/lib/nutrition/analysisToItems';
import { Thumb } from './Thumb';
import { KcalKj } from '@/components/ui/KcalKj';

const LABEL: Record<MealSlot, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  lunch: { label: 'Lunch', emoji: '☀️' },
  dinner: { label: 'Dinner', emoji: '🌆' },
  snack: { label: 'Snacks', emoji: '🍪' },
};

export function MealGroup({ slot, entries }: { slot: MealSlot; entries: FoodEntry[] }) {
  const total = entries.reduce((a, e) => a + sumItems(e.items).kcal, 0);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-black text-bark-700">
          {LABEL[slot].emoji} {LABEL[slot].label}
        </h2>
        <KcalKj kcal={total} size="sm" className="text-bark-500" />
      </div>
      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </ul>
    </section>
  );
}

function EntryCard({ entry }: { entry: FoodEntry }) {
  const nav = useNavigate();
  const setDraft = useSessionStore((s) => s.setDraft);
  const [open, setOpen] = useState(false);
  const n = sumItems(entry.items);

  async function edit() {
    setDraft({
      analysis: {
        title: entry.title,
        items: entry.items.map((i) => ({
          name: i.name,
          grams: Math.round(i.grams * i.scale),
          nutrients: {
            kcal: i.per.kcal * i.scale,
            protein: i.per.protein * i.scale,
            carbs: i.per.carbs * i.scale,
            fat: i.per.fat * i.scale,
            fibre: i.per.fibre * i.scale,
          },
          confidence: i.confidence,
          assumptions: i.assumptions ?? [],
        })),
        notes: entry.notes ?? '',
        overall_confidence: overallConfidence(entry.items),
        needs_clarification: null,
      },
      preparedItems: entry.items.map((i) => ({
        ...i,
        grams: Math.round(i.grams * i.scale),
        scale: 1,
        per: {
          kcal: i.per.kcal * i.scale,
          protein: i.per.protein * i.scale,
          carbs: i.per.carbs * i.scale,
          fat: i.per.fat * i.scale,
          fibre: i.per.fibre * i.scale,
        },
      })),
      source: entry.source,
      slot: entry.slot,
      thumb: entry.photoThumb,
      editingEntryId: entry.id,
    });
    setOpen(false);
    nav('/log/review');
  }

  async function remove() {
    await deleteMeal(entry.id);
    setOpen(false);
    toast('Removed', 'info', '🗑️');
  }

  async function repeat() {
    const r = await duplicateMeal(entry.id);
    setOpen(false);
    if (r) announce(r.result);
  }

  return (
    <li>
      <button
        className="card w-full flex items-center gap-3 text-left active:scale-[0.99] transition p-3"
        onClick={() => setOpen(true)}
      >
        <Thumb blob={entry.photoThumb} source={entry.source} />
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{entry.title}</div>
          <div className="text-xs text-bark-500 flex items-center gap-2">
            <span>{formatTime(entry.loggedAt)}</span>
            <span>·</span>
            <span>
              P {Math.round(n.protein)} · C {Math.round(n.carbs)} · F {Math.round(n.fat)}
            </span>
            <ConfidenceBadge level={overallConfidence(entry.items)} compact />
          </div>
        </div>
        <KcalKj kcal={n.kcal} size="sm" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={entry.title}>
        <ul className="flex flex-col gap-1 text-sm mb-4">
          {entry.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span className="truncate">
                {i.name} <span className="text-bark-500">{Math.round(i.grams * i.scale)} g</span>
              </span>
              <KcalKj kcal={i.per.kcal * i.scale} size="sm" />
            </li>
          ))}
        </ul>
        {entry.notes && <p className="text-xs text-bark-500 mb-4">{entry.notes}</p>}
        <div className="grid grid-cols-3 gap-2">
          <button className="btn-secondary" onClick={edit}>
            Edit
          </button>
          <button className="btn-secondary" onClick={repeat}>
            Log again
          </button>
          <button className="btn-ghost text-berry-500" onClick={remove}>
            Delete
          </button>
        </div>
      </Sheet>
    </li>
  );
}
