import type { CachedProduct, FoodItem, Nutrients } from '../db/types';
import { newId } from '../id';
import { kjToKcal } from '../nutrition/units';

/** Open Food Facts v2 product payload (subset). */
export interface OffProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  image_front_small_url?: string;
  nutriments?: Record<string, number | string | undefined>;
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
};

export function parseServingGrams(size?: string): number | undefined {
  if (!size) return undefined;
  const m = size.match(/([\d.]+)\s*(g|ml|mL)/i);
  return m ? parseFloat(m[1]) : undefined;
}

export function offToProduct(p: OffProduct): CachedProduct | null {
  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  let kcalFromKj = false;
  if (kcal === undefined) {
    const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
    if (kj !== undefined) {
      kcal = kjToKcal(kj);
      kcalFromKj = true;
    }
  }
  if (kcal === undefined) return null;
  const fibre = num(n['fiber_100g']);
  const sodiumG = num(n['sodium_100g']);
  return {
    barcode: p.code,
    name: p.product_name_en || p.product_name || 'Unnamed product',
    brand: p.brands?.split(',')[0]?.trim(),
    servingG: num(p.serving_quantity) ?? parseServingGrams(p.serving_size),
    per100: {
      kcal,
      protein: num(n['proteins_100g']) ?? 0,
      carbs: num(n['carbohydrates_100g']) ?? 0,
      fat: num(n['fat_100g']) ?? 0,
      fibre: fibre ?? 0,
      sugars: num(n['sugars_100g']),
      sodiumMg: sodiumG !== undefined ? sodiumG * 1000 : undefined,
    },
    imageUrl: p.image_front_small_url,
    fibreUnknown: fibre === undefined,
    kcalFromKj,
  };
}

export function productToItem(p: CachedProduct, grams: number): FoodItem {
  const f = grams / 100;
  const per: Nutrients = {
    kcal: p.per100.kcal * f,
    protein: p.per100.protein * f,
    carbs: p.per100.carbs * f,
    fat: p.per100.fat * f,
    fibre: p.per100.fibre * f,
  };
  const assumptions: string[] = [];
  if (p.fibreUnknown) assumptions.push('fibre not on label, counted as 0');
  if (p.kcalFromKj) assumptions.push('energy converted from kJ');
  return {
    id: newId(),
    name: p.brand ? `${p.brand} ${p.name}` : p.name,
    grams,
    scale: 1,
    per,
    confidence: p.fibreUnknown || p.kcalFromKj ? 'medium' : 'high',
    assumptions: assumptions.length ? assumptions : undefined,
    ref: { kind: 'off', barcode: p.barcode },
  };
}

/** AFCD row as bundled: [key, name, kJ, protein, fat, carbs, fibre, sugars, sodiumMg] per 100 g. */
export type AfcdRow = [string, string, number, number, number, number, number, number, number];

export function afcdToItem(row: AfcdRow, grams: number): FoodItem {
  const [key, name, kj, protein, fat, carbs, fibre] = row;
  const f = grams / 100;
  return {
    id: newId(),
    name,
    grams,
    scale: 1,
    per: {
      kcal: kjToKcal(kj) * f,
      protein: protein * f,
      carbs: carbs * f,
      fat: fat * f,
      fibre: fibre * f,
    },
    confidence: 'high',
    ref: { kind: 'afcd', key },
  };
}
