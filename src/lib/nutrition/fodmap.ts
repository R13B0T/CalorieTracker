import type { FoodItem } from '../db/types';

export type FodmapRating = 'low' | 'moderate' | 'high' | 'unknown';
export type FodmapGroup = 'fructose' | 'lactose' | 'fructans' | 'gos' | 'polyols';

export const FODMAP_GROUPS: { key: FodmapGroup; label: string }[] = [
  { key: 'fructose', label: 'Fructose' },
  { key: 'lactose', label: 'Lactose' },
  { key: 'fructans', label: 'Fructans' },
  { key: 'gos', label: 'GOS' },
  { key: 'polyols', label: 'Polyols' },
];

export interface FodmapAssessment {
  overall: FodmapRating;
  groups: Record<FodmapGroup, FodmapRating>;
  flaggedItems: string[];
  unknownItems: string[];
}

type Rule = {
  pattern: RegExp;
  groups: FodmapGroup[];
  rating: 'moderate' | 'high';
};

// This is deliberately a conservative screening list, not a copy of a laboratory-tested
// database. It identifies common sources from the food name and (when available) ingredients.
const RULES: Rule[] = [
  {
    pattern:
      /\b(apples?|pears?|mango(?:es)?|cherr(?:y|ies)|figs?|watermelon|dried fruit|dried apricots?|honey|agave|high[- ]fructose corn syrup|fruit juice concentrate)\b/,
    groups: ['fructose'],
    rating: 'high',
  },
  {
    pattern:
      /\b(apples?|pears?|cherr(?:y|ies)|peaches?|plums?|prunes?|cauliflower|mushrooms?|sorbitol|mannitol|xylitol|maltitol|isomalt|erythritol|sugar[- ]free confectionery)\b/,
    groups: ['polyols'],
    rating: 'high',
  },
  {
    pattern:
      /\b(onions?|garlic|shallots?|leeks?|rye|barley|couscous|inulin|chicory(?: root)?|artichokes?|wheat (?:flour|bread)|wheat-based bread)\b/,
    groups: ['fructans'],
    rating: 'high',
  },
  {
    pattern: /\bwheat pasta\b/,
    groups: ['fructans'],
    rating: 'moderate',
  },
  {
    pattern: /\b(sweet potato|sweet ?corn|corn on the cob)\b/,
    groups: ['polyols'],
    rating: 'moderate',
  },
  {
    pattern:
      /\b(cashews?|pistachios?|chickpeas?|lentils?|kidney beans?|baked beans?|soy ?beans?|soy flour)\b/,
    groups: ['gos'],
    rating: 'high',
  },
  {
    pattern: /\b(canned|tinned|drained|rinsed)\s+(chickpeas?|lentils?|beans?)\b/,
    groups: ['gos'],
    rating: 'moderate',
  },
  {
    pattern:
      /\b(cow'?s milk|goat'?s milk|milk powder|milk solids|whey powder|yogh?urts?|ice cream|custard|soft cheese|ricotta|cottage cheese)\b/,
    groups: ['lactose'],
    rating: 'high',
  },
];

const CLEARLY_LOW =
  /\b((?:beef|chicken|pork|lamb|fish|salmon|tuna)(?: (?:breast|steak|fillet|mince))?|eggs?|(?:white|brown|basmati|jasmine) rice|quinoa|rolled oats|carrots?|cucumbers?|lettuce|spinach|potatoes?|oranges?|mandarins?|grapes?|strawberr(?:y|ies)|blueberr(?:y|ies)|kiwi(?:fruit)?|pineapple|maple syrup|rice malt syrup|olive oil|vegetable oil|butter|hard cheese|cheddar|parmesan|lactose[- ]free)\b/;

const RANK: Record<FodmapRating, number> = { low: 0, unknown: 1, moderate: 2, high: 3 };

function stronger(a: FodmapRating, b: FodmapRating): FodmapRating {
  return RANK[b] > RANK[a] ? b : a;
}

function clean(value: string): string {
  return value
    .toLocaleLowerCase('en-AU')
    .replace(/[()_,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function blankGroups(value: FodmapRating = 'unknown'): Record<FodmapGroup, FodmapRating> {
  return {
    fructose: value,
    lactose: value,
    fructans: value,
    gos: value,
    polyols: value,
  };
}

function assessItem(item: FoodItem): {
  overall: FodmapRating;
  groups: Record<FodmapGroup, FodmapRating>;
} {
  const name = clean(item.name);
  const text = clean(`${item.name} ${item.ingredients ?? ''}`);
  const groups = blankGroups();
  let overall: FodmapRating = 'unknown';
  let lowAvocadoServe = false;

  // Monash publicly documents avocado as low at 30 g, moderate at 45 g and high at 80 g.
  // Scale the item's current portion, while remaining conservative between those examples.
  if (/\bavocados?\b/.test(text)) {
    const grams = item.grams * item.scale;
    const rating: FodmapRating = grams <= 30 ? 'low' : grams <= 45 ? 'moderate' : 'high';
    groups.polyols = rating;
    overall = rating;
    lowAvocadoServe = rating === 'low';
  }

  const lactoseFree = /\blactose[- ]free\b/.test(text);
  const strainedGarlicOil =
    /\bgarlic[- ]infused oil\b/.test(text) && !/\bgarlic (?:clove|pieces?|paste)\b/.test(text);
  const cannedLegume = /\b(canned|tinned|drained|rinsed)\b/.test(text);

  for (const rule of RULES) {
    if (!rule.pattern.test(text)) continue;
    if (lactoseFree && rule.groups.includes('lactose')) continue;
    if (strainedGarlicOil && rule.groups.includes('fructans')) continue;
    const rating = cannedLegume && rule.groups.includes('gos') ? 'moderate' : rule.rating;
    for (const group of rule.groups) groups[group] = stronger(groups[group], rating);
    overall = stronger(overall, rating);
  }

  const clearlyLow = CLEARLY_LOW.test(name) || lactoseFree || strainedGarlicOil || lowAvocadoServe;
  if ((overall === 'unknown' || overall === 'low') && clearlyLow) {
    overall = 'low';
    return { overall, groups: blankGroups('low') };
  }

  return { overall, groups };
}

export function assessFodmap(items: FoodItem[]): FodmapAssessment {
  const groups = blankGroups('low');
  const flaggedItems: string[] = [];
  const unknownItems: string[] = [];
  let overall: FodmapRating = 'low';

  if (!items.length)
    return { overall: 'unknown', groups: blankGroups(), flaggedItems, unknownItems };

  for (const item of items) {
    const assessment = assessItem(item);
    overall = stronger(overall, assessment.overall);
    if (assessment.overall === 'high' || assessment.overall === 'moderate') {
      flaggedItems.push(item.name);
    } else if (assessment.overall === 'unknown') {
      unknownItems.push(item.name);
    }
    for (const { key } of FODMAP_GROUPS) {
      groups[key] = stronger(groups[key], assessment.groups[key]);
    }
  }

  return {
    overall,
    groups,
    flaggedItems: [...new Set(flaggedItems)],
    unknownItems: [...new Set(unknownItems)],
  };
}
