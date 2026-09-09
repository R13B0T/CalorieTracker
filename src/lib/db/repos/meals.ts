import { db } from '../db';
import type { FoodEntry, FoodItem, MealSlot, Source } from '../types';
import { newId } from '../../id';
import { toDayKey } from '../../date';
import { ensureDay } from './days';
import { applyEvent, type GameResult } from '../../game/engine';

export interface SaveMealInput {
  title: string;
  items: FoodItem[];
  slot: MealSlot;
  source: Source;
  notes?: string;
  rawInput?: string;
  photoThumb?: Blob;
  model?: string;
  editedAiLines: number;
  sliderAdjusted: boolean;
  /** Override the log time (defaults to now). */
  loggedAt?: number;
}

export async function saveMeal(
  input: SaveMealInput,
): Promise<{ entry: FoodEntry; result: GameResult }> {
  const settings = await db.settings.get('me');
  const loggedAt = input.loggedAt ?? Date.now() + (settings?.timeOffsetMs ?? 0);
  const dayKey = toDayKey(loggedAt, settings?.dayStartHour ?? 4);
  await ensureDay(dayKey);
  const entry: FoodEntry = {
    id: newId(),
    dayKey,
    loggedAt,
    slot: input.slot,
    source: input.source,
    title: input.title,
    items: input.items,
    notes: input.notes,
    rawInput: input.rawInput,
    photoThumb: input.photoThumb,
    model: input.model,
  };
  await db.entries.put(entry);
  const result = await applyEvent({
    type: 'meal_logged',
    entry,
    editedAiLines: input.editedAiLines,
    sliderAdjusted: input.sliderAdjusted,
  });
  return { entry, result };
}

export async function updateMeal(
  id: string,
  patch: Partial<Pick<FoodEntry, 'title' | 'items' | 'slot' | 'notes'>>,
): Promise<void> {
  await db.entries.update(id, patch);
}

export async function deleteMeal(id: string): Promise<void> {
  const entry = await db.entries.get(id);
  if (!entry) return;
  await db.entries.delete(id);
  await applyEvent({ type: 'meal_deleted', entry });
}

export async function duplicateMeal(
  id: string,
  slot?: MealSlot,
): Promise<{ entry: FoodEntry; result: GameResult } | null> {
  const src = await db.entries.get(id);
  if (!src) return null;
  return saveMeal({
    title: src.title,
    items: src.items.map((i) => ({ ...i, id: newId() })),
    slot: slot ?? src.slot,
    source: 'quick_repeat',
    notes: src.notes,
    photoThumb: src.photoThumb,
    editedAiLines: 0,
    sliderAdjusted: false,
  });
}

export function suggestSlot(ts: number): MealSlot {
  const h = new Date(ts).getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h >= 17 && h < 21) return 'dinner';
  return 'snack';
}
