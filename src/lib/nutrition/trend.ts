import type { WeightEntry } from '../db/types';
import { dayKeyRange } from '../date';

export interface TrendPoint {
  dayKey: string;
  raw: number | null;
  trend: number;
}

/**
 * Exponential moving average over daily weights. Days without a weigh-in carry the
 * trend forward (no fake raw point). alpha 0.1 smooths water-weight noise.
 */
export function weightTrend(weights: WeightEntry[], alpha = 0.1): TrendPoint[] {
  if (!weights.length) return [];
  const byDay = new Map<string, number[]>();
  for (const w of weights) {
    const arr = byDay.get(w.dayKey) ?? [];
    arr.push(w.kg);
    byDay.set(w.dayKey, arr);
  }
  const keys = [...byDay.keys()].sort();
  const range = dayKeyRange(keys[0], keys[keys.length - 1]);
  const out: TrendPoint[] = [];
  let trend: number | null = null;
  for (const k of range) {
    const vals = byDay.get(k);
    const raw = vals ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    if (trend === null) trend = raw ?? 0;
    else if (raw !== null) trend = trend + alpha * (raw - trend);
    out.push({ dayKey: k, raw, trend });
  }
  return out;
}
