import { describe, expect, it } from 'vitest';
import type { FoodItem } from '@/lib/db/types';
import { assessFodmap } from '@/lib/nutrition/fodmap';

function item(name: string, grams = 100, ingredients?: string): FoodItem {
  return {
    id: name,
    name,
    grams,
    scale: 1,
    per: { kcal: 100, protein: 1, carbs: 1, fat: 1, fibre: 1 },
    confidence: 'high',
    ingredients,
  };
}

describe('FODMAP screening', () => {
  it('flags the relevant groups for common high-potential foods', () => {
    const result = assessFodmap([item('Pink Lady apple', 150)]);
    expect(result.overall).toBe('high');
    expect(result.groups.fructose).toBe('high');
    expect(result.groups.polyols).toBe('high');
    expect(result.flaggedItems).toEqual(['Pink Lady apple']);
  });

  it('uses the current avocado portion', () => {
    expect(assessFodmap([item('Avocado', 30)]).overall).toBe('low');
    expect(assessFodmap([item('Avocado', 45)]).overall).toBe('moderate');
    expect(assessFodmap([{ ...item('Avocado', 30), scale: 2 }]).overall).toBe('high');
  });

  it('honours explicit low alternatives and plain low-potential foods', () => {
    expect(assessFodmap([item('Lactose-free yoghurt')]).overall).toBe('low');
    expect(assessFodmap([item('Grilled chicken breast'), item('Basmati rice')]).overall).toBe(
      'low',
    );
  });

  it('uses packaged-food ingredients when available', () => {
    const result = assessFodmap([
      item('Chocolate protein bar', 45, 'Peanuts, milk powder, chicory root, cocoa'),
    ]);
    expect(result.overall).toBe('high');
    expect(result.groups.lactose).toBe('high');
    expect(result.groups.fructans).toBe('high');
  });

  it('returns unknown instead of guessing from a vague name', () => {
    const result = assessFodmap([item('Homestyle special')]);
    expect(result.overall).toBe('unknown');
    expect(result.unknownItems).toEqual(['Homestyle special']);
  });
});
