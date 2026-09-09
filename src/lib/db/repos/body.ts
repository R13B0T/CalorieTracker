import { db } from '../db';
import { newId } from '../../id';
import { toDayKey } from '../../date';
import { ensureDay } from './days';
import { applyEvent, type GameResult } from '../../game/engine';
import { sumEntries } from '../../nutrition/totals';
import { computeRecalibration, type RecalibrationSuggestion } from '../../nutrition/recalibration';
import { macroGrams } from '../../nutrition/tdee';

async function ctx() {
  const s = await db.settings.get('me');
  const now = Date.now() + (s?.timeOffsetMs ?? 0);
  const dayStartHour = s?.dayStartHour ?? 4;
  return { settings: s, now, dayStartHour, todayKey: toDayKey(now, dayStartHour) };
}

export async function logWeight(kg: number): Promise<GameResult> {
  const { now, todayKey } = await ctx();
  const firstToday = (await db.weights.where('dayKey').equals(todayKey).count()) === 0;
  await db.weights.put({ id: newId(), dayKey: todayKey, at: now, kg });
  await ensureDay(todayKey);
  return applyEvent({ type: 'weighed_in', dayKey: todayKey, firstToday });
}

export async function deleteWeight(id: string) {
  await db.weights.delete(id);
}

export async function logExercise(
  description: string,
  kcal: number,
  minutes: number | undefined,
  source: 'manual' | 'ai',
): Promise<GameResult> {
  const { now, todayKey } = await ctx();
  await ensureDay(todayKey);
  await db.exercise.put({
    id: newId(),
    dayKey: todayKey,
    at: now,
    description,
    minutes,
    kcal,
    source,
  });
  const all = await db.exercise.where('dayKey').equals(todayKey).toArray();
  await db.days.update(todayKey, { exerciseKcal: all.reduce((a, e) => a + e.kcal, 0) });
  return applyEvent({ type: 'exercise_logged', dayKey: todayKey, countToday: all.length });
}

export async function deleteExercise(id: string) {
  const e = await db.exercise.get(id);
  if (!e) return;
  await db.exercise.delete(id);
  const all = await db.exercise.where('dayKey').equals(e.dayKey).toArray();
  await db.days.update(e.dayKey, { exerciseKcal: all.reduce((a, x) => a + x.kcal, 0) });
}

export async function recalibrationSuggestion(): Promise<RecalibrationSuggestion | null> {
  const profile = await db.profile.get('me');
  if (!profile) return null;
  const { now, todayKey } = await ctx();
  const days = await db.days.toArray();
  const weights = await db.weights.toArray();
  const entries = await db.entries.toArray();
  const intakeByDay: Record<string, number> = {};
  for (const d of days) {
    const list = entries.filter((e) => e.dayKey === d.dayKey);
    intakeByDay[d.dayKey] = sumEntries(list).kcal;
  }
  return computeRecalibration({ weights, days, intakeByDay, profile, now, todayKey });
}

export async function applyRecalibration(s: RecalibrationSuggestion): Promise<void> {
  const profile = await db.profile.get('me');
  if (!profile) return;
  const { now } = await ctx();
  await db.profile.put({
    ...profile,
    tdee: s.newTdee,
    targetKcal: s.newTargetKcal,
    lastRecalibratedAt: now,
    recalibrationLog: [
      ...profile.recalibrationLog,
      {
        at: now,
        expectedDeltaKg: s.expectedDeltaKg,
        actualDeltaKg: s.actualDeltaKg,
        adjustmentKcal: s.adjustmentKcal,
        newTargetKcal: s.newTargetKcal,
      },
    ],
  });
  await applyEvent({ type: 'recalibrated' });
}

export async function dismissRecalibration(): Promise<void> {
  const profile = await db.profile.get('me');
  if (!profile) return;
  const { now } = await ctx();
  // "Not now" waits another week before asking again.
  await db.profile.update('me', { lastRecalibratedAt: now - 7 * 86_400_000 });
}

/** Update targets manually from Settings; also refreshes today's snapshot. */
export async function setTargets(patch: {
  targetKcal?: number;
  macroSplit?: { proteinPct: number; carbsPct: number; fatPct: number };
  fibreG?: number;
}) {
  const profile = await db.profile.get('me');
  if (!profile) return;
  const next = { ...profile, ...patch };
  await db.profile.put(next);
  const { todayKey } = await ctx();
  const g = macroGrams(next.targetKcal, next.macroSplit);
  await db.days.update(todayKey, {
    targetKcal: next.targetKcal,
    targetMacros: { ...g, fibre: next.fibreG },
  });
}
