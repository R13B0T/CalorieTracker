import { describe, expect, it } from 'vitest';
import { levelForXp, xpForLevel, titleForLevel } from '@/lib/game/levels';
import { coinsGained } from '@/lib/game/xp';
import { moodFrom } from '@/lib/game/mood';
import { applyDayToStreak } from '@/lib/game/streak';
import { rollQuests, bumpQuests } from '@/lib/game/quests';
import { stageFor } from '@/lib/game/evolution';

describe('levels', () => {
  it('follows the 100 * n^1.5 curve', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(283);
    expect(xpForLevel(10)).toBe(3162);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(283)).toBe(2);
    expect(levelForXp(3161)).toBe(9);
    expect(titleForLevel(12)).toBe('Portion Pro');
  });
  it('awards a coin per 10 XP crossed', () => {
    expect(coinsGained(0, 25)).toBe(2);
    expect(coinsGained(25, 30)).toBe(1);
    expect(coinsGained(25, 29)).toBe(0);
  });
});

describe('mood', () => {
  const base = {
    mealsLast24h: 0,
    waterGoalDaysLast48h: 0,
    weighInLast48h: false,
    yesterdayWithinTarget: false,
    proteinFibreHitsLast48h: 0,
    hoursSinceLastLog: null,
    streakLostWithin24h: false,
  };
  it('is ecstatic after a great day', () => {
    expect(moodFrom({ ...base, mealsLast24h: 3, weighInLast48h: true, yesterdayWithinTarget: true, hoursSinceLastLog: 2 })).toBe('ecstatic');
  });
  it('is sleepy for a brand new user, never peckish', () => {
    expect(moodFrom(base)).toBe('sleepy');
  });
  it('misses you after a day of silence', () => {
    expect(moodFrom({ ...base, hoursSinceLastLog: 30 })).toBe('peckish');
  });
  it('is worried right after losing a streak', () => {
    expect(moodFrom({ ...base, mealsLast24h: 3, streakLostWithin24h: true })).toBe('worried');
  });
});

describe('streak', () => {
  const fresh = { current: 0, best: 0, lastCountedDay: null, freezes: 1, frozenDays: [] };
  const day = (dayKey: string, entryCount: number) => ({ dayKey, entryCount, weighedIn: false, waterHit: false });
  it('counts contiguous days and awards XP', () => {
    let s = fresh;
    let out = applyDayToStreak(s, day('2026-09-01', 2), 0);
    expect(out.counted).toBe(true);
    expect(out.streak.current).toBe(1);
    expect(out.xp).toBe(11);
    out = applyDayToStreak(out.streak, day('2026-09-02', 3), 0);
    expect(out.streak.current).toBe(2);
    expect(out.streak.best).toBe(2);
  });
  it('one entry plus a weigh-in counts', () => {
    const out = applyDayToStreak(fresh, { dayKey: '2026-09-01', entryCount: 1, weighedIn: true, waterHit: false }, 0);
    expect(out.counted).toBe(true);
  });
  it('consumes exactly one freeze on a missed day, then resets on the next miss', () => {
    let out = applyDayToStreak(fresh, day('2026-09-01', 2), 0);
    out = applyDayToStreak(out.streak, day('2026-09-02', 0), 0);
    expect(out.usedFreeze).toBe(true);
    expect(out.streak.current).toBe(1);
    expect(out.streak.freezes).toBe(0);
    out = applyDayToStreak(out.streak, day('2026-09-03', 2), 0);
    expect(out.streak.current).toBe(2);
    out = applyDayToStreak(out.streak, day('2026-09-04', 0), 99);
    expect(out.lost).toBe(true);
    expect(out.streak.current).toBe(0);
    expect(out.streak.best).toBe(2);
    expect(out.streak.lostAt).toBe(99);
  });
  it('does nothing punitive when a new user misses a day', () => {
    const out = applyDayToStreak(fresh, day('2026-09-01', 0), 0);
    expect(out.lost).toBe(false);
    expect(out.streak.freezes).toBe(1);
  });
});

describe('quests', () => {
  it('rolls 3 dailies and 2 weeklies and keeps them for the same period', () => {
    const seq = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2];
    let i = 0;
    const rnd = () => seq[i++ % seq.length];
    const r1 = rollQuests([], '2026-09-09', [], rnd);
    expect(r1.quests.filter((q) => q.period === 'daily')).toHaveLength(3);
    expect(r1.quests.filter((q) => q.period === 'weekly')).toHaveLength(2);
    const r2 = rollQuests(r1.quests, '2026-09-09', r1.recent, rnd);
    expect(r2.quests.map((q) => q.id).sort()).toEqual(r1.quests.map((q) => q.id).sort());
    const r3 = rollQuests(r2.quests, '2026-09-10', r2.recent, rnd);
    const dailies3 = r3.quests.filter((q) => q.period === 'daily');
    expect(dailies3).toHaveLength(3);
    expect(dailies3.every((q) => q.periodKey === '2026-09-10')).toBe(true);
    // no repeats within 3 days
    const prevIds = new Set(r1.quests.filter((q) => q.period === 'daily').map((q) => q.templateId));
    expect(dailies3.some((q) => prevIds.has(q.templateId))).toBe(false);
  });
  it('bumps and completes', () => {
    const r = rollQuests([], '2026-09-09', [], () => 0.01);
    const meals = r.quests.find((q) => q.templateId === 'd_breakfast');
    expect(meals).toBeTruthy();
    const { quests, completed } = bumpQuests(r.quests, 'breakfastBefore10', 1, '2026-09-09', 5);
    expect(completed).toHaveLength(1);
    expect(quests.find((q) => q.templateId === 'd_breakfast')!.completedAt).toBe(5);
  });
});

describe('evolution', () => {
  it('never regresses and needs 60 logged days for legend', () => {
    expect(stageFor(9, 100, 'joey')).toBe('joey');
    expect(stageFor(10, 5, 'joey')).toBe('adult');
    expect(stageFor(25, 30, 'adult')).toBe('adult');
    expect(stageFor(25, 60, 'adult')).toBe('legend');
    expect(stageFor(3, 0, 'adult')).toBe('adult');
  });
});
