import { describe, expect, it } from 'vitest';
import { daysBetween, isoWeekKey, shiftDayKey, toDayKey, dayStart } from '@/lib/date';

describe('date helpers', () => {
  it('assigns a 1am snack to the previous day when dayStartHour is 4', () => {
    const oneAm = new Date(2026, 8, 10, 1, 0).getTime(); // 10 Sep 2026 01:00 local
    expect(toDayKey(oneAm, 4)).toBe('2026-09-09');
    const fiveAm = new Date(2026, 8, 10, 5, 0).getTime();
    expect(toDayKey(fiveAm, 4)).toBe('2026-09-10');
  });

  it('shifts across month boundaries', () => {
    expect(shiftDayKey('2026-09-30', 1)).toBe('2026-10-01');
    expect(shiftDayKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days between keys', () => {
    expect(daysBetween('2026-09-01', '2026-09-15')).toBe(14);
    expect(daysBetween('2026-09-15', '2026-09-01')).toBe(-14);
  });

  it('computes ISO week keys', () => {
    expect(isoWeekKey('2026-09-09')).toBe('2026-W37');
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53');
  });

  it('round-trips dayStart across a Sydney DST change (first Sunday in October)', () => {
    // Regardless of the host timezone, dayStart(toDayKey(t)) must be <= t for any t.
    for (let h = 0; h < 72; h++) {
      const t = new Date(2026, 9, 3, h, 30).getTime();
      const key = toDayKey(t, 4);
      expect(dayStart(key, 4)).toBeLessThanOrEqual(t);
      expect(dayStart(shiftDayKey(key, 1), 4)).toBeGreaterThan(t);
    }
  });
});
