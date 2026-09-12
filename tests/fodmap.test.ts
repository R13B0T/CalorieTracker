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

  it('uses the scaled serving for wholemeal bread', () => {
    expect(assessFodmap([item('Wholemeal bread', 24)]).overall).toBe('low');
    expect(assessFodmap([item('Wholemeal bread', 36)]).overall).toBe('moderate');
    expect(assessFodmap([item('Wholemeal bread', 48)]).overall).toBe('high');
    expect(assessFodmap([{ ...item('Wholemeal bread', 24), scale: 2 }]).overall).toBe('high');
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

  it('covers the broader public Monash food families and label additives', () => {
    const result = assessFodmap([
      item('Asparagus and artichoke', 160),
      item('Sugar-free gum', 10, 'Sorbitol (E420), xylitol (E967)'),
      item('Falafel', 100),
      item('Evaporated milk', 100),
      item('Red capsicum', 80),
    ]);

    expect(result.overall).toBe('high');
    expect(result.groups.fructans).toBe('high');
    expect(result.groups.polyols).toBe('high');
    expect(result.groups.gos).toBe('high');
    expect(result.groups.lactose).toBe('high');
    expect(result.groups.fructose).toBe('high');
  });

  it('recognises specific low alternatives without masking other ingredients', () => {
    expect(assessFodmap([item('Almond milk')]).overall).toBe('low');
    expect(assessFodmap([item('Firm tofu with green beans')]).overall).toBe('low');
    expect(assessFodmap([item('Soy milk')]).overall).toBe('unknown');

    const withInulin = assessFodmap([
      item('Almond milk yoghurt', 150, 'Almond milk, chicory root fibre, cultures'),
    ]);
    expect(withInulin.overall).toBe('high');
    expect(withInulin.groups.fructans).toBe('high');
  });

  it('treats canned and drained legumes more cautiously than whole cooked legumes', () => {
    expect(assessFodmap([item('Lentils')]).overall).toBe('high');
    expect(assessFodmap([item('Canned chickpeas, drained and rinsed')]).overall).toBe('moderate');
    expect(assessFodmap([item('Canned chickpeas with cashews')]).overall).toBe('high');
  });

  it('does not call an unspecified prepared dish low from one safe ingredient', () => {
    expect(assessFodmap([item('Chicken curry')]).overall).toBe('unknown');
    expect(assessFodmap([item('Peanut granola bar')]).overall).toBe('unknown');
  });

  it('returns unknown instead of guessing from a vague name', () => {
    const result = assessFodmap([item('Homestyle special')]);
    expect(result.overall).toBe('unknown');
    expect(result.unknownItems).toEqual(['Homestyle special']);
  });
});
