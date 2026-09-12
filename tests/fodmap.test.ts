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

  it('uses the current avocado portion and scaled serving', () => {
    expect(assessFodmap([item('Avocado', 60)]).overall).toBe('low');
    expect(assessFodmap([item('Avocado', 70)]).overall).toBe('moderate');
    expect(assessFodmap([item('Avocado', 80)]).overall).toBe('high');
    expect(assessFodmap([{ ...item('Avocado', 40), scale: 2 }]).overall).toBe('high');
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

  it('uses the 2026 retested grape and strawberry traffic-light serves', () => {
    expect(assessFodmap([item('Red grapes', 28)]).overall).toBe('low');
    expect(assessFodmap([item('Red grapes', 48)]).overall).toBe('moderate');
    expect(assessFodmap([item('Red grapes', 75)]).overall).toBe('high');

    expect(assessFodmap([item('Strawberries', 65)]).overall).toBe('low');
    expect(assessFodmap([item('Strawberries', 75)]).overall).toBe('moderate');
    expect(assessFodmap([item('Strawberries', 100)]).overall).toBe('high');
  });

  it('distinguishes ripe and firm banana serving sizes', () => {
    expect(assessFodmap([item('Ripe banana', 33)]).overall).toBe('low');
    expect(assessFodmap([item('Ripe banana', 50)]).overall).toBe('moderate');
    expect(assessFodmap([item('Ripe banana', 100)]).overall).toBe('high');
    expect(assessFodmap([item('Firm unripe banana', 100)]).overall).toBe('low');
  });

  it('handles current portion-dependent vegetables instead of blanket exclusions', () => {
    expect(assessFodmap([item('White cauliflower', 75)]).overall).toBe('low');
    expect(assessFodmap([item('White cauliflower', 100)]).overall).toBe('moderate');
    expect(assessFodmap([item('Brussels sprouts', 53)]).overall).toBe('low');
    expect(assessFodmap([item('Brussels sprouts', 80)]).overall).toBe('moderate');
    expect(assessFodmap([item('Celery', 15)]).overall).toBe('low');
    expect(assessFodmap([item('Celery', 50)]).overall).toBe('moderate');

    const sweetPotato = assessFodmap([item('Sweet potato', 100)]);
    expect(sweetPotato.overall).toBe('moderate');
    expect(sweetPotato.groups.fructans).toBe('moderate');
  });

  it('keeps strong high-risk vegetables high while allowing their small cited serves', () => {
    expect(assessFodmap([item('Asparagus', 12)]).overall).toBe('low');
    const asparagus = assessFodmap([item('Asparagus', 20)]);
    expect(asparagus.overall).toBe('high');
    expect(asparagus.groups.fructose).toBe('high');

    expect(assessFodmap([item('Globe artichoke', 16)]).overall).toBe('low');
    expect(assessFodmap([item('Globe artichoke', 40)]).overall).toBe('high');
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
    expect(assessFodmap([item('Canned chickpeas, drained and rinsed', 44)]).overall).toBe('low');
    const chickpeas = assessFodmap([item('Canned chickpeas, drained and rinsed', 60)]);
    expect(chickpeas.overall).toBe('high');
    expect(chickpeas.groups.fructans).toBe('high');
    expect(assessFodmap([item('Canned lentils, drained and rinsed', 80)]).overall).toBe('moderate');
    expect(assessFodmap([item('Canned chickpeas with cashews')]).overall).toBe('high');
  });

  it('distinguishes preparation for fruit, mushrooms, tofu and soy milk', () => {
    expect(assessFodmap([item('Canned lychees', 96)]).overall).toBe('low');
    expect(assessFodmap([item('Raw lychee', 100)]).overall).toBe('high');
    expect(assessFodmap([item('Fresh pineapple', 140)]).overall).toBe('low');
    expect(assessFodmap([item('Dried pineapple', 30)]).overall).toBe('high');
    expect(assessFodmap([item('Oyster mushrooms')]).overall).toBe('low');
    expect(assessFodmap([item('Button mushrooms')]).overall).toBe('high');
    expect(assessFodmap([item('Silken tofu', 39)]).overall).toBe('low');
    expect(assessFodmap([item('Silken tofu', 80)]).overall).toBe('high');

    const wholeSoy = assessFodmap([item('Soy milk made from whole soybeans')]);
    expect(wholeSoy.overall).toBe('high');
    expect(wholeSoy.groups.gos).toBe('high');
    expect(wholeSoy.groups.fructans).toBe('high');
  });

  it('screens newly reconciled fruit and dairy examples conservatively', () => {
    expect(assessFodmap([item('Fresh apricot', 67)]).overall).toBe('moderate');
    expect(assessFodmap([item('Dried apricots', 30)]).overall).toBe('high');
    expect(assessFodmap([item('Dates', 30)]).overall).toBe('low');
    expect(assessFodmap([item('Dates', 31)]).overall).toBe('high');
    expect(assessFodmap([item('Ricotta cheese', 40)]).overall).toBe('low');
    expect(assessFodmap([item('Ricotta cheese', 80)]).overall).toBe('moderate');
    expect(assessFodmap([item('Greek yoghurt', 23)]).overall).toBe('low');
    expect(assessFodmap([item('Greek yoghurt', 24)]).overall).toBe('high');
  });

  it('recognises a wider range of current low-risk staples', () => {
    const result = assessFodmap([
      item('Polenta'),
      item('Pak choi'),
      item('Dragon fruit'),
      item('Macadamia milk'),
      item('Pecorino'),
      item('Tempeh'),
    ]);
    expect(result.overall).toBe('low');
    expect(result.unknownItems).toEqual([]);
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
