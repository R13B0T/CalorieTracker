import { BADGES, type BadgeDef } from '@/data/badges';
import type { GameState } from '../db/types';

/** Returns badge definitions newly earned given current counters. */
export function newlyEarnedBadges(state: GameState): BadgeDef[] {
  const have = new Set(state.badges.map((b) => b.id));
  const counters: Record<string, number> = { ...state.counters, bestStreak: state.streak.best };
  return BADGES.filter((b) => !have.has(b.id) && (counters[b.counter] ?? 0) >= b.threshold);
}
