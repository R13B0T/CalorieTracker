import { describe, expect, it } from 'vitest';
import { sumItems } from '@/lib/nutrition/totals';
import type { FoodItem } from '@/lib/db/types';

const item = (kcal: number, scale = 1): FoodItem => ({
  id: 'x',
  name: 'test',
  grams: 100,
  scale,
  per: { kcal, protein: 10, carbs: 10, fat: 5, fibre: 2 },
  confidence: 'high',
});

describe('totals', () => {
  it('sums items with scale applied', () => {
    const t = sumItems([item(100), item(200, 0.5)]);
    expect(t.kcal).toBe(200);
    expect(t.protein).toBe(15);
  });
});
