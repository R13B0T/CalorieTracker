import { db } from '../db';
import type { DayLog, Settings, UserProfile } from '../types';
import { macroGrams } from '../../nutrition/tdee';

export function targetsFor(profile: UserProfile) {
  const g = macroGrams(profile.targetKcal, profile.macroSplit);
  return { kcal: profile.targetKcal, macros: { ...g, fibre: profile.fibreG } };
}

/** Get or create the DayLog for a key, snapshotting current targets. */
export async function ensureDay(
  dayKey: string,
  profile?: UserProfile,
  settings?: Settings,
): Promise<DayLog> {
  const existing = await db.days.get(dayKey);
  if (existing) return existing;
  const p = profile ?? (await db.profile.get('me'));
  const s = settings ?? (await db.settings.get('me'));
  if (!p) throw new Error('No profile');
  const t = targetsFor(p);
  const day: DayLog = {
    dayKey,
    targetKcal: t.kcal,
    targetMacros: t.macros,
    waterMl: 0,
    exerciseKcal: 0,
    eatBackExercise: s?.eatBackExercise ?? false,
  };
  await db.days.put(day);
  return day;
}
