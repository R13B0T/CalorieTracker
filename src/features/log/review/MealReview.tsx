import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSessionStore, toast } from '@/stores/useSessionStore';
import { db } from '@/lib/db/db';
import type { FoodItem, MealSlot } from '@/lib/db/types';
import {
  analysisToItems,
  CONFIDENCE_PCT,
  overallConfidence,
} from '@/lib/nutrition/analysisToItems';
import { sumItems } from '@/lib/nutrition/totals';
import { saveMeal, suggestSlot, updateMeal } from '@/lib/db/repos/meals';
import { announce } from '@/lib/game/announce';
import { refineMeal } from '@/lib/ai/claudeClient';
import { describeAiError } from '@/lib/ai/errors';
import { ItemRow } from './ItemRow';
import { AddItemSheet } from './AddItemSheet';
import { KcalKj } from '@/components/ui/KcalKj';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Segmented } from '@/components/ui/Segmented';
import { PortionSlider } from '@/components/ui/Slider';
import { useLevelUp } from '@/features/game/LevelUpModal';
import { FodmapSummary } from './FodmapSummary';

const SLOTS: { value: MealSlot; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌆' },
  { value: 'snack', label: 'Snack', emoji: '🍪' },
];

export default function MealReview() {
  const nav = useNavigate();
  const draft = useSessionStore((s) => s.draft);
  const setDraft = useSessionStore((s) => s.setDraft);
  const showLevelUp = useLevelUp();
  const settings = useLiveQuery(() => db.settings.get('me'), []);

  const [title, setTitle] = useState(draft?.analysis.title ?? '');
  const [items, setItems] = useState<FoodItem[]>(() =>
    draft ? (draft.preparedItems ?? analysisToItems(draft.analysis)) : [],
  );
  const [slot, setSlot] = useState<MealSlot>(draft?.slot ?? suggestSlot(Date.now()));
  const [wholeScale, setWholeScale] = useState(1);
  const [adding, setAdding] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sliderTouched, setSliderTouched] = useState(false);

  const originalNames = useMemo(
    () => new Set(draft?.analysis.items.map((i) => i.name) ?? []),
    [draft],
  );

  if (!draft) {
    return (
      <div className="p-6 text-center flex flex-col gap-3 items-center">
        <p className="text-bark-700">Nothing to review. Log something first.</p>
        <button className="btn-primary" onClick={() => nav('/log')}>
          Go to Log
        </button>
      </div>
    );
  }

  const totals = sumItems(items);
  const conf = overallConfidence(items);
  const editedAiLines =
    items.filter((i) => i.userEdited && i.ref?.kind === 'ai').length +
    (draft.analysis.items.length - items.filter((i) => originalNames.has(i.name)).length);

  function update(idx: number, next: FoodItem) {
    if (next.scale !== items[idx].scale) setSliderTouched(true);
    setItems((arr) => arr.map((it, i) => (i === idx ? next : it)));
  }

  function applyWhole(s: number) {
    const factor = s / wholeScale;
    setWholeScale(s);
    setSliderTouched(true);
    setItems((arr) =>
      arr.map((it) => ({ ...it, scale: Math.max(0.05, it.scale * factor), userEdited: true })),
    );
  }

  async function refine() {
    if (!followUp.trim()) return;
    setRefining(true);
    try {
      const next = await refineMeal(draft!.analysis, followUp, { imageBase64: draft!.imageBase64 });
      setDraft({ ...draft!, analysis: next, preparedItems: undefined });
      setItems(analysisToItems(next));
      setTitle(next.title);
      setWholeScale(1);
      setFollowUp('');
    } catch (e) {
      toast(describeAiError(e), 'error');
    } finally {
      setRefining(false);
    }
  }

  async function save() {
    if (!items.length) return;
    setSaving(true);
    try {
      if (draft!.editingEntryId) {
        await updateMeal(draft!.editingEntryId, { title: title.trim() || 'Meal', items, slot });
        toast('Meal updated', 'info', '✅');
      } else {
        const { result } = await saveMeal({
          title: title.trim() || draft!.analysis.title || 'Meal',
          items,
          slot,
          source: draft!.source,
          notes: draft!.analysis.notes,
          rawInput: draft!.rawInput,
          photoThumb: draft!.thumb,
          model: draft!.model,
          editedAiLines: Math.max(0, editedAiLines),
          sliderAdjusted: sliderTouched,
        });
        announce(result);
        if (result.levelUp) showLevelUp(result.levelUp.to, result.evolved);
      }
      setDraft(null);
      nav('/', { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="text-xl font-black flex-1">Check the estimate</h1>
      </div>

      {draft.thumb && (
        <img
          src={URL.createObjectURL(draft.thumb)}
          alt=""
          className="w-full max-h-48 object-cover rounded-xl"
        />
      )}

      <input
        className="input text-lg font-bold"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Meal name"
      />

      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <KcalKj kcal={totals.kcal} size="lg" />
            <div className="text-xs text-bark-500 mt-1">
              P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · F{' '}
              {Math.round(totals.fat)}g · Fibre {Math.round(totals.fibre)}g
            </div>
          </div>
          <div className="text-right">
            <ConfidenceBadge level={conf} />
            <div className="text-xs text-bark-500 mt-1">Estimate ±{CONFIDENCE_PCT[conf]}%</div>
          </div>
        </div>
        {settings?.fodmapEnabled && (
          <FodmapSummary items={items} display={settings.fodmapDisplay ?? 'overall'} />
        )}
      </div>

      {draft.analysis.needs_clarification && (
        <div className="rounded-xl bg-sun-300/60 px-4 py-3 text-sm text-bark-900">
          <span className="font-bold">Quick question: </span>
          {draft.analysis.needs_clarification}
        </div>
      )}

      {draft.analysis.notes && <p className="text-sm text-bark-700 px-1">{draft.analysis.notes}</p>}

      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <ItemRow
            key={it.id}
            item={it}
            defaultOpen={it.confidence === 'low'}
            onChange={(n) => update(i, n)}
            onRemove={() => setItems((arr) => arr.filter((_, j) => j !== i))}
          />
        ))}
      </ul>
      <button className="btn-secondary" onClick={() => setAdding(true)}>
        + Add an item
      </button>

      <div className="card flex flex-col gap-2">
        <PortionSlider
          value={wholeScale}
          onChange={applyWhole}
          label="Whole meal (ate half? drag left)"
        />
      </div>

      <div className="card flex flex-col gap-2">
        <label className="label" htmlFor="followup">
          Tell Claude something it missed
        </label>
        <div className="flex gap-2">
          <input
            id="followup"
            className="input"
            placeholder="e.g. it was a large bowl, no dressing"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && refine()}
          />
          <button
            className="btn-secondary px-4"
            disabled={!followUp.trim() || refining}
            onClick={refine}
          >
            {refining ? '…' : 'Ask'}
          </button>
        </div>
      </div>

      <div>
        <span className="label">Meal</span>
        <Segmented columns={2} value={slot} onChange={setSlot} options={SLOTS} />
      </div>

      <button className="btn-primary text-lg" disabled={!items.length || saving} onClick={save}>
        {saving ? 'Saving…' : draft.editingEntryId ? 'Save changes' : 'Log it'}
      </button>
      <div className="h-6" />
      <AddItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(it) => setItems((arr) => [...arr, it])}
      />
    </div>
  );
}
