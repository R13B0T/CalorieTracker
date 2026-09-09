import { COINS } from './rules';

export function coinsForXp(xp: number): number {
  return Math.floor(xp / COINS.perXp);
}

/** Coins earned crossing from oldXp to newXp (so partial tens carry over). */
export function coinsGained(oldXp: number, newXp: number): number {
  return Math.max(0, coinsForXp(newXp) - coinsForXp(oldXp));
}
