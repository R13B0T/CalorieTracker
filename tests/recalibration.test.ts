import { describe, expect, it } from 'vitest';
import { computeRecalibration } from '@/lib/nutrition/recalibration';
import { weightTrend } from '@/lib/nutrition/trend';
import type { DayLog, UserProfile, WeightEntry } from '@/lib/db/types';
import { shiftDayKey } from '@/lib/date';

const DAY = 86_400_000;
const start = '2026-08-01';
const profile: UserProfile = {
  id: 'me',
  name: 't',
  sex: 'male',
  birthYear: 1988,
  heightCm: 180,
  startWeightKg: 85,
  activity: 'moderate',
  goal: 'lose',
  rateKgPerWeek: 0.5,
  tdee: 2775,
  targetKcal: 2230,
  macroSplit: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
  fibreG: 30,
  persona: 'sassy',
  createdAt: Date.UTC(2026, 6, 31),
  recalibrationLog: [],
};

function build(
  days: number,
  intake: number,
  weightFn: (i: number) => number,
  weighEvery = 2,
  logEvery = 1,
) {
  const dayLogs: DayLog[] = [];
  const weights: WeightEntry[] = [];
  const intakeByDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const k = shiftDayKey(start, i);
    const at = Date.UTC(2026, 7, 1 + i, 8);
    dayLogs.push({
      dayKey: k,
      targetKcal: 2230,
      targetMacros: { protein: 150, carbs: 220, fat: 74, fibre: 30 },
      waterMl: 0,
      exerciseKcal: 0,
      eatBackExercise: false,
      closedAt: at + DAY,
    });
    if (i % logEvery === 0) intakeByDay[k] = intake;
    if (i % weighEvery === 0) weights.push({ id: String(i), dayKey: k, at, kg: weightFn(i) });
  }
  const todayKey = shiftDayKey(start, days);
  return {
    weights,
    days: dayLogs,
    intakeByDay,
    profile,
    now: Date.UTC(2026, 7, 1 + days, 12),
    todayKey,
  };
}

describe('weight trend', () => {
  it('smooths and carries forward gaps', () => {
    const t = weightTrend([
      { id: '1', dayKey: '2026-08-01', at: 0, kg: 80 },
      { id: '2', dayKey: '2026-08-03', at: 0, kg: 82 },
    ]);
    expect(t).toHaveLength(3);
    expect(t[1].raw).toBeNull();
    expect(t[2].trend).toBeCloseTo(80.2, 5);
  });
});

describe('recalibration', () => {
  it('returns null with too few days', () => {
    expect(computeRecalibration(build(10, 2230, () => 85))).toBeNull();
  });
  it('returns null when adherence is below 70%', () => {
    expect(computeRecalibration(build(21, 2230, () => 85, 2, 2))).toBeNull();
  });
  it('lowers maintenance when weight does not move on a supposed deficit, capped at 150', () => {
    // Eating 2230 with tdee 2775 should lose ~1.5 kg over 21 days; weight flat -> maintenance lower.
    const s = computeRecalibration(build(21, 2230, () => 85));
    expect(s).not.toBeNull();
    expect(s!.adjustmentKcal).toBeLessThan(0);
    expect(s!.adjustmentKcal).toBeGreaterThanOrEqual(-150);
    expect(s!.newTargetKcal).toBeLessThan(2230);
  });
  it('raises maintenance when losing faster than expected, capped at +150', () => {
    const s = computeRecalibration(build(21, 2230, (i) => 85 - i * 0.15));
    expect(s).not.toBeNull();
    expect(s!.adjustmentKcal).toBe(150);
  });
  it('suggests nothing when reality matches the model', () => {
    // expected loss ~ (2230-2775)*21/7700 = -1.49 kg over 21 days
    const s = computeRecalibration(build(21, 2230, (i) => 85 - (i * 1.49) / 20));
    expect(s === null || Math.abs(s.adjustmentKcal) < 60).toBe(true);
  });
});
