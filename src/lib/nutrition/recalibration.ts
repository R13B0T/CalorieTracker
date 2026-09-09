import type { DayLog, UserProfile, WeightEntry } from '../db/types';
import { KCAL_PER_KG_FAT, clamp } from './units';
import { MIN_TARGET_KCAL, targetKcal } from './tdee';
import { daysBetween } from '../date';

export interface RecalibrationInput {
  weights: WeightEntry[];
  days: DayLog[];
  /** kcal eaten per dayKey. */
  intakeByDay: Record<string, number>;
  profile: UserProfile;
  now: number;
  todayKey: string;
}

export interface RecalibrationSuggestion {
  windowDays: number;
  expectedDeltaKg: number;
  actualDeltaKg: number;
  errorKcalPerDay: number;
  adjustmentKcal: number;
  newTdee: number;
  newTargetKcal: number;
  adherencePct: number;
}

export const RECAL = {
  minDays: 14,
  minWeighIns: 6,
  minAdherence: 0.7,
  damping: 0.5,
  maxAdjust: 150,
  alpha: 0.1,
} as const;

/**
 * Compare expected vs actual weight change since the last recalibration and propose a
 * bounded correction to maintenance. Returns null when there isn't enough honest data.
 */
export function computeRecalibration(i: RecalibrationInput): RecalibrationSuggestion | null {
  const since = i.profile.lastRecalibratedAt ?? i.profile.createdAt;
  const sinceDays = (i.now - since) / 86_400_000;
  if (sinceDays < RECAL.minDays) return null;

  // Only use closed days (yesterday and earlier) inside the window.
  const closed = i.days
    .filter((d) => d.dayKey < i.todayKey && d.closedAt && d.closedAt >= since - 86_400_000)
    .sort((a, b) => (a.dayKey < b.dayKey ? -1 : 1));
  if (closed.length < RECAL.minDays) return null;

  const firstKey = closed[0].dayKey;
  const lastKey = closed[closed.length - 1].dayKey;
  const windowDays = daysBetween(firstKey, lastKey) + 1;

  const weights = i.weights.filter((w) => w.dayKey >= firstKey && w.dayKey <= lastKey);
  if (weights.length < RECAL.minWeighIns) return null;

  const loggedDays = closed.filter((d) => (i.intakeByDay[d.dayKey] ?? 0) > 0).length;
  const adherence = loggedDays / windowDays;
  if (adherence < RECAL.minAdherence) return null;

  const actualDeltaKg = fittedDeltaKg(weights, firstKey, windowDays);

  let expectedKcalBalance = 0;
  for (const d of closed) {
    const intake = i.intakeByDay[d.dayKey] ?? 0;
    if (intake <= 0) continue; // unlogged day: no information
    const burn = i.profile.tdee + (d.eatBackExercise ? d.exerciseKcal : 0);
    expectedKcalBalance += intake - burn;
  }
  const expectedDeltaKg = (expectedKcalBalance * (windowDays / loggedDays)) / KCAL_PER_KG_FAT;

  // Positive error: lost less than expected -> maintenance is lower than we think (or under-logging).
  const errorKcalPerDay = ((actualDeltaKg - expectedDeltaKg) * KCAL_PER_KG_FAT) / windowDays;
  const adjustmentKcal =
    Math.round(clamp(-errorKcalPerDay * RECAL.damping, -RECAL.maxAdjust, RECAL.maxAdjust) / 5) * 5;
  if (Math.abs(adjustmentKcal) < 25) return null;

  const newTdee = Math.round(i.profile.tdee + adjustmentKcal);
  const newTarget = Math.max(
    MIN_TARGET_KCAL[i.profile.sex],
    targetKcal(newTdee, i.profile.goal, i.profile.rateKgPerWeek, i.profile.sex),
  );
  return {
    windowDays,
    expectedDeltaKg,
    actualDeltaKg,
    errorKcalPerDay,
    adjustmentKcal,
    newTdee,
    newTargetKcal: newTarget,
    adherencePct: Math.round(adherence * 100),
  };
}

/**
 * Least-squares slope through the raw weigh-ins (x = days since window start), times the
 * window length. No lag, and daily water-weight noise averages out across the fit.
 */
export function fittedDeltaKg(
  weights: WeightEntry[],
  firstKey: string,
  windowDays: number,
): number {
  const pts = weights.map((w) => ({ x: daysBetween(firstKey, w.dayKey), y: w.kg }));
  const n = pts.length;
  if (n < 2) return 0;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  if (den === 0) return 0;
  return (num / den) * (windowDays - 1);
}
