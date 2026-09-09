import type { FoodEntry, FoodItem, Nutrients } from '../db/types';

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

export function scaled(item: FoodItem): Nutrients {
  const s = item.scale;
  return {
    kcal: item.per.kcal * s,
    protein: item.per.protein * s,
    carbs: item.per.carbs * s,
    fat: item.per.fat * s,
    fibre: item.per.fibre * s,
  };
}

export function add(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fibre: a.fibre + b.fibre,
  };
}

export function sumItems(items: FoodItem[]): Nutrients {
  return items.reduce((acc, it) => add(acc, scaled(it)), { ...ZERO });
}

export function sumEntries(entries: FoodEntry[]): Nutrients {
  return entries.reduce((acc, e) => add(acc, sumItems(e.items)), { ...ZERO });
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    kcal: n.kcal * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
    fibre: n.fibre * factor,
  };
}
