import type { MealAnalysis } from '../ai/schemas';
import type { FoodItem } from '../db/types';
import { newId } from '../id';

const clean = (n: number) => (Number.isFinite(n) && n >= 0 ? n : 0);

export function analysisToItems(a: MealAnalysis): FoodItem[] {
  return a.items.map((it) => ({
    id: newId(),
    name: it.name,
    grams: Math.max(1, Math.round(clean(it.grams))),
    scale: 1,
    per: {
      kcal: clean(it.nutrients.kcal),
      protein: clean(it.nutrients.protein),
      carbs: clean(it.nutrients.carbs),
      fat: clean(it.nutrients.fat),
      fibre: clean(it.nutrients.fibre),
    },
    confidence: it.confidence,
    assumptions: it.assumptions?.filter(Boolean),
    ref: { kind: 'ai' },
  }));
}

export const CONFIDENCE_PCT = { high: 10, medium: 20, low: 35 } as const;

export function overallConfidence(items: FoodItem[]): 'high' | 'medium' | 'low' {
  if (!items.length) return 'low';
  // weakest link weighted by calories: the biggest-calorie item dominates
  const biggest = [...items].sort((a, b) => b.per.kcal * b.scale - a.per.kcal * a.scale)[0];
  const rank = { high: 0, medium: 1, low: 2 };
  const worst = items.reduce((w, i) => (rank[i.confidence] > rank[w] ? i.confidence : w), 'high' as 'high' | 'medium' | 'low');
  return rank[biggest.confidence] >= rank[worst] ? biggest.confidence : worst === 'low' && biggest.confidence === 'high' ? 'medium' : worst;
}
