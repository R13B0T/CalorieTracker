import type { GameState } from '../db/types';
import { shiftDayKey } from '../date';
import { STREAK, XP } from './rules';

export interface DaySummaryForStreak {
  dayKey: string;
  entryCount: number;
  weighedIn: boolean;
  waterHit: boolean;
}

export function dayCountsForStreak(d: DaySummaryForStreak): boolean {
  if (d.entryCount >= STREAK.minEntriesForDay) return true;
  return d.entryCount >= 1 && (d.weighedIn || d.waterHit);
}

export interface StreakOutcome {
  streak: GameState['streak'];
  xp: number;
  usedFreeze: boolean;
  lost: boolean;
  counted: boolean;
}

/**
 * Apply one closed day to the streak. Called once per day at rollover, in order.
 */
export function applyDayToStreak(
  streak: GameState['streak'],
  day: DaySummaryForStreak,
  now: number,
): StreakOutcome {
  const s = { ...streak, frozenDays: [...streak.frozenDays] };
  const counts = dayCountsForStreak(day);
  const expectedPrev = shiftDayKey(day.dayKey, -1);
  const contiguous =
    s.lastCountedDay === null ||
    s.lastCountedDay === expectedPrev ||
    s.lastCountedDay >= expectedPrev;

  if (counts) {
    s.current = contiguous || s.current === 0 ? s.current + 1 : 1;
    s.lastCountedDay = day.dayKey;
    s.best = Math.max(s.best, s.current);
    const xp = XP.streakBase + Math.min(s.current, XP.streakBonusCap);
    return { streak: s, xp, usedFreeze: false, lost: false, counted: true };
  }

  // Missed day.
  if (s.current === 0) return { streak: s, xp: 0, usedFreeze: false, lost: false, counted: false };
  if (s.freezes > 0) {
    s.freezes -= 1;
    s.frozenDays.push(day.dayKey);
    s.lastCountedDay = day.dayKey; // keeps contiguity
    return { streak: s, xp: 0, usedFreeze: true, lost: false, counted: false };
  }
  s.current = 0;
  s.lostAt = now;
  return { streak: s, xp: 0, usedFreeze: false, lost: true, counted: false };
}
