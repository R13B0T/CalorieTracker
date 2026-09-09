import { LEVEL_TITLES } from './rules';

/** Cumulative XP needed to *reach* level n (level 1 = 0). */
export function xpForLevel(n: number): number {
  if (n <= 1) return 0;
  return Math.round(100 * Math.pow(n, 1.5));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp: number): {
  level: number;
  into: number;
  span: number;
  pct: number;
} {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - floor;
  const span = next - floor;
  return { level, into, span, pct: Math.min(100, Math.round((into / span) * 100)) };
}

export function titleForLevel(level: number): string {
  let t = LEVEL_TITLES[0].title;
  for (const row of LEVEL_TITLES) if (level >= row.level) t = row.title;
  return t;
}

export function titlesUnlocked(level: number): string[] {
  return LEVEL_TITLES.filter((r) => level >= r.level).map((r) => r.title);
}
