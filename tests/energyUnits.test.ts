import { describe, expect, it } from 'vitest';
import { energyFromKcal, energyToKcal, formatEnergy, KJ_PER_KCAL } from '@/lib/nutrition/units';

describe('energy units', () => {
  it('converts canonical kcal values to and from kJ', () => {
    expect(energyFromKcal(100, 'kJ')).toBeCloseTo(100 * KJ_PER_KCAL);
    expect(energyToKcal(418.4, 'kJ')).toBeCloseTo(100);
  });

  it('leaves kcal values unchanged', () => {
    expect(energyFromKcal(325, 'kcal')).toBe(325);
    expect(energyToKcal(325, 'kcal')).toBe(325);
  });

  it('formats the selected unit for display', () => {
    expect(formatEnergy(500, 'kcal')).toBe('500 kcal');
    expect(formatEnergy(500, 'kJ')).toBe('2,092 kJ');
  });
});
