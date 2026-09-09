import { describe, expect, it } from 'vitest';
import { bmr, defaultMacroSplit, macroGrams, targetKcal, tdee } from '@/lib/nutrition/tdee';

describe('Mifflin-St Jeor', () => {
  it('matches the published worked example for a man', () => {
    // 70 kg, 175 cm, 30 y male -> 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
    expect(bmr('male', 70, 175, 30)).toBeCloseTo(1648.75, 2);
  });
  it('matches the published worked example for a woman', () => {
    // 60 kg, 165 cm, 30 y female -> 600 + 1031.25 - 150 - 161 = 1320.25
    expect(bmr('female', 60, 165, 30)).toBeCloseTo(1320.25, 2);
  });
  it('applies the activity multiplier', () => {
    expect(tdee('male', 70, 175, 30, 'moderate')).toBeCloseTo(1648.75 * 1.55, 2);
  });
});

describe('targets', () => {
  it('creates a 550 kcal deficit for 0.5 kg per week and rounds to 10', () => {
    expect(targetKcal(2500, 'lose', 0.5, 'male')).toBe(1950);
  });
  it('never drops below the safety floor', () => {
    expect(targetKcal(1500, 'lose', 0.75, 'female')).toBe(1200);
    expect(targetKcal(1700, 'lose', 0.75, 'male')).toBe(1500);
  });
  it('adds a surplus for gain', () => {
    expect(targetKcal(2500, 'gain', 0.25, 'male')).toBe(2780);
  });
  it('macro split sums to 100 and grams are sane', () => {
    const split = defaultMacroSplit('lose', 80, 2000);
    expect(split.proteinPct + split.carbsPct + split.fatPct).toBe(100);
    const g = macroGrams(2000, split);
    expect(g.protein).toBeGreaterThan(100);
    expect(g.fat).toBe(67);
  });
});
