import type { Mood } from '../db/types';

export interface MoodInputs {
  mealsLast24h: number;
  waterGoalDaysLast48h: number;
  weighInLast48h: boolean;
  yesterdayWithinTarget: boolean;
  proteinFibreHitsLast48h: number;
  hoursSinceLastLog: number | null; // null = never logged
  streakLostWithin24h: boolean;
}

export function moodScore(i: MoodInputs): number {
  let s = 0;
  s += Math.min(6, i.mealsLast24h * 2);
  s += i.waterGoalDaysLast48h;
  if (i.weighInLast48h) s += 2;
  if (i.yesterdayWithinTarget) s += 2;
  s += Math.min(2, i.proteinFibreHitsLast48h);
  if (i.hoursSinceLastLog !== null) {
    if (i.hoursSinceLastLog >= 24) s -= 2;
    if (i.hoursSinceLastLog >= 36) s -= 1;
  }
  return s;
}

export function moodFrom(i: MoodInputs): Mood {
  if (i.streakLostWithin24h) return 'worried';
  const s = moodScore(i);
  if (i.hoursSinceLastLog !== null && i.hoursSinceLastLog >= 24 && s < 0) return 'peckish';
  if (s >= 8) return 'ecstatic';
  if (s >= 5) return 'happy';
  if (s >= 2) return 'content';
  if (s >= 0) return 'sleepy';
  return 'peckish';
}

/** Copy is about the quokka missing you, never about food. */
export const MOOD_COPY: Record<Mood, string> = {
  ecstatic: 'is absolutely buzzing',
  happy: 'is happy as',
  content: 'is doing fine',
  sleepy: 'is having a snooze',
  peckish: 'misses you a bit',
  worried: 'is a little worried about the streak',
};
