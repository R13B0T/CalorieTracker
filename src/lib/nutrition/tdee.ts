import type { Activity, Goal, Sex } from '../db/types';
import { KCAL_PER_KG_FAT, round } from './units';

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, { label: string; hint: string }> = {
  sedentary: { label: 'Mostly sitting', hint: 'Desk job, little planned exercise' },
  light: { label: 'Lightly active', hint: 'Walks, light exercise 1 to 3 days a week' },
  moderate: { label: 'Moderately active', hint: 'Exercise 3 to 5 days a week' },
  active: { label: 'Very active', hint: 'Hard exercise 6 to 7 days a week' },
  very_active: { label: 'Athlete or physical job', hint: 'Training twice a day or heavy labour' },
};

/** Mifflin-St Jeor resting metabolic rate. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, ageYears: number, activity: Activity) {
  return bmr(sex, weightKg, heightCm, ageYears) * ACTIVITY_FACTORS[activity];
}

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export const MIN_TARGET_KCAL: Record<Sex, number> = { female: 1200, male: 1500 };

/**
 * Daily calorie target from maintenance and a goal rate.
 * 1 kg of body fat is roughly 7700 kcal, so 0.5 kg/week is a 550 kcal/day deficit.
 */
export function targetKcal(maintenance: number, goal: Goal, rateKgPerWeek: number, sex: Sex): number {
  const dailyDelta = (rateKgPerWeek * KCAL_PER_KG_FAT) / 7;
  let target = maintenance;
  if (goal === 'lose') target = maintenance - dailyDelta;
  if (goal === 'gain') target = maintenance + dailyDelta;
  target = Math.max(target, MIN_TARGET_KCAL[sex]);
  return Math.round(target / 10) * 10;
}

export interface MacroSplit {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

/** Sensible defaults: protein anchored to bodyweight, fat 30%, carbs the remainder. */
export function defaultMacroSplit(goal: Goal, weightKg: number, target: number): MacroSplit {
  const proteinPerKg = goal === 'lose' ? 1.8 : goal === 'gain' ? 1.8 : 1.6;
  let proteinPct = round(((proteinPerKg * weightKg * 4) / target) * 100, 0);
  proteinPct = Math.min(Math.max(proteinPct, 20), 40);
  const fatPct = 30;
  const carbsPct = 100 - proteinPct - fatPct;
  return { proteinPct, carbsPct, fatPct };
}

export function macroGrams(target: number, split: MacroSplit) {
  return {
    protein: Math.round((target * split.proteinPct) / 100 / 4),
    carbs: Math.round((target * split.carbsPct) / 100 / 4),
    fat: Math.round((target * split.fatPct) / 100 / 9),
  };
}

export function defaultFibreG(sex: Sex): number {
  return sex === 'male' ? 30 : 25;
}

export const RATE_OPTIONS: Record<Goal, { value: number; label: string; hint: string }[]> = {
  lose: [
    { value: 0.25, label: 'Gentle', hint: '0.25 kg a week, easy to stick to' },
    { value: 0.5, label: 'Steady', hint: '0.5 kg a week, the sensible default' },
    { value: 0.75, label: 'Brisk', hint: '0.75 kg a week, needs discipline' },
  ],
  maintain: [{ value: 0, label: 'Hold steady', hint: 'Eat at maintenance' }],
  gain: [
    { value: 0.25, label: 'Lean gain', hint: '0.25 kg a week, minimal fat gain' },
    { value: 0.5, label: 'Bulk', hint: '0.5 kg a week, faster but softer' },
  ],
};
