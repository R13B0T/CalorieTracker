import type { EnergyUnit } from '../db/types';

export const KJ_PER_KCAL = 4.184;
export const KCAL_PER_KG_FAT = 7700;

export const kcalToKj = (kcal: number) => kcal * KJ_PER_KCAL;
export const kjToKcal = (kj: number) => kj / KJ_PER_KCAL;

export const energyFromKcal = (kcal: number, unit: EnergyUnit) =>
  unit === 'kJ' ? kcalToKj(kcal) : kcal;

export const energyToKcal = (value: number, unit: EnergyUnit) =>
  unit === 'kJ' ? kjToKcal(value) : value;

export function formatEnergy(kcal: number, unit: EnergyUnit): string {
  return `${Math.round(energyFromKcal(kcal, unit)).toLocaleString('en-AU')} ${unit}`;
}

export function fmtKcal(kcal: number): string {
  return `${Math.round(kcal).toLocaleString('en-AU')} kcal`;
}
export function fmtKj(kcal: number): string {
  return `${Math.round(kcalToKj(kcal)).toLocaleString('en-AU')} kJ`;
}
export function fmtG(g: number, dp = 0): string {
  return `${g.toFixed(dp)} g`;
}
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
