import type { PetStage } from '../db/types';
import { EVOLUTION } from './rules';

export function stageFor(level: number, daysLogged: number, current: PetStage): PetStage {
  let s: PetStage = 'joey';
  if (level >= EVOLUTION.adultLevel) s = 'adult';
  if (level >= EVOLUTION.legendLevel && daysLogged >= EVOLUTION.legendMinDaysLogged) s = 'legend';
  // never regress
  const order: PetStage[] = ['joey', 'adult', 'legend'];
  return order.indexOf(s) > order.indexOf(current) ? s : current;
}
