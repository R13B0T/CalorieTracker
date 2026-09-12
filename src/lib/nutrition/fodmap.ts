import type { FoodItem } from '../db/types';

export type FodmapRating = 'low' | 'moderate' | 'high' | 'unknown';
export type FodmapGroup = 'fructose' | 'lactose' | 'fructans' | 'gos' | 'polyols';

export const MONASH_FODMAP_APP_URL =
  'https://www.monashfodmap.com/ibs-central/i-have-ibs/get-the-app/';

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

/*
 * This is a conservative local screen, not a copy of Monash University's
 * laboratory-tested food database. The rules cover the food families and examples
 * in Monash's public sample guide, plus common ingredient-label spellings. The full
 * Monash app remains the source of truth for tested foods and exact serving sizes.
 *
 * Keep alternatives specific. A broad rule such as `milk` or `beans` without the
 * protected phrases below creates harmful false positives for almond milk, firm tofu
 * and green beans.
 */
const HIGH_RULES: Rule[] = [
  {
    pattern:
      /\b(apples?|apple juice|apple (?:juice )?concentrate|pears?|pear juice|nashi pears?|mango(?:es)?|cherr(?:y|ies)|figs?|watermelon|dried (?:fruit|apricots?|figs?|dates?)|fruit juice concentrate|honey|agave(?: nectar| syrup)?|high fructose corn syrup|corn syrup high fructose|fructose(?: syrup)?|crystalline fructose)\b/,
    groups: ['fructose'],
    rating: 'high',
  },
  {
    pattern:
      /\b(apples?|pears?|nashi pears?|cherr(?:y|ies)|nectarines?|peaches?|plums?|prunes?|apricots?|cauliflower|mushrooms?|celery|sorbitol|mannitol|xylitol|maltitol|lactitol|isomalt|erythritol|e ?420|e ?421|e ?953|e ?965|e ?966|e ?967|e ?968|sugar free confectionery|sugar free (?:gum|loll(?:y|ies)|candy|sweets?))\b/,
    groups: ['polyols'],
    rating: 'high',
  },
  {
    pattern:
      /\b(artichokes?|asparagus|garlic|garlic powder|onions?|onion powder|shallots?|leeks?|spring onions?|scallions?|rye|barley|couscous|bulg(?:u|a)r|wholemeal bread|whole wheat bread|wheat (?:flour|bread|pasta|noodles?|biscuits?|cereal|crackers?)|rye (?:bread|crispbread|crackers?)|barley (?:bread|cereal)|muesli(?: containing)? wheat|inulin|chicory (?:root|fibre|fiber)|fructooligosaccharides?|fructo oligosaccharides?|oligofructose|fos)\b/,
    groups: ['fructans'],
    rating: 'high',
  },
  {
    pattern:
      /\b(chickpeas?|garbanzo beans?|lentils?|red kidney beans?|kidney beans?|black beans?|baked beans?|butter beans?|cannellini beans?|navy beans?|lima beans?|split peas?|green peas?|falafels?|soy ?beans?|whole soy ?bean(?:s)?|soy flour|cashews?|pistachios?|galactooligosaccharides?|galacto oligosaccharides?|gos)\b/,
    groups: ['gos'],
    rating: 'high',
  },
  {
    pattern:
      /\b(cows? milk|goats? milk|sheeps? milk|whole milk|full cream milk|skim milk|evaporated milk|condensed milk|milk|milk powder|milk solids|whey powder|buttermilk powder|lactose|yogh?urts?|ice cream|custard|soft cheese|ricotta|cottage cheese)\b/,
    groups: ['lactose'],
    rating: 'high',
  },
  {
    pattern: /\b(red capsicums?|red bell peppers?)\b/,
    groups: ['fructose'],
    rating: 'high',
  },
  {
    pattern: /\b(sweet ?corn|corn on the cob)\b/,
    groups: ['polyols'],
    rating: 'moderate',
  },
  {
    pattern: /\b(sweet potatoes?)\b/,
    groups: ['polyols'],
    rating: 'moderate',
  },
];

// Remove a known low-FODMAP alternative before looking for a high trigger contained
// inside its name (for example `milk` inside `lactose-free milk`). Other ingredients
// remain screenable, so almond milk with inulin will still be flagged.
const PROTECTED_ALTERNATIVES = [
  /\blactose free (?:milk|yogh?urt|ice cream|custard|cheese)\b/g,
  /\b(?:almond|coconut) (?:milk )?yogh?urt\b/g,
  /\b(?:almond|rice) milk\b/g,
  /\b(?:coconut|oat|macadamia|hemp) milk\b/g,
  /\bsoy milk (?:made )?from soy protein\b/g,
  /\bsoy protein milk\b/g,
  /\bsoy milk\b/g,
  /\bgarlic infused oil\b/g,
  /\bspring onion green tops?\b/g,
  /\bscallion green tops?\b/g,
  /\bgreen capsicums?\b/g,
  /\bgreen bell peppers?\b/g,
  /\bgreen beans?\b/g,
  /\bfirm tofu\b/g,
  /\bsourdough spelt bread\b/g,
  /\b(?:brie|camembert|feta|cheddar|parmesan|hard cheese)\b/g,
];

const LOW_NAME_RULES = [
  /\b(?:white|brown|basmati|jasmine) rice\b/,
  /\bquinoa(?: flakes?| pasta)?\b/,
  /\brolled oats?\b/,
  /\b(?:rice|corn|quinoa) pasta\b/,
  /\bplain rice cakes?\b/,
  /\bsourdough spelt bread\b/,
  /\b(?:carrots?|cucumbers?|lettuce|spinach|potatoes?|aubergines?|eggplants?|bok choy|green beans?|green capsicums?|green bell peppers?)\b/,
  /\b(?:cantaloupe|kiwi(?:fruit)?|mandarins?|oranges?|pineapple|blueberr(?:y|ies)|strawberr(?:y|ies)|grapes?)\b/,
  /\b(?:eggs?|firm tofu|tempeh)\b/,
  /\b(?:beef|chicken|pork|lamb|fish|salmon|tuna)(?: (?:breast|steak|fillet|mince))?\b/,
  /\b(?:lactose free (?:milk|yogh?urt|ice cream|custard|cheese)|almond milk|rice milk|soy protein milk|soy milk (?:made )?from soy protein)\b/,
  /\b(?:brie|camembert|feta|cheddar|parmesan|hard cheese|butter)\b/,
  /\b(?:macadamias?|peanuts?|pumpkin seeds?|pepitas?|walnuts?)\b/,
  /\b(?:dark chocolate|maple syrup|rice malt syrup|table sugar)\b/,
  /\b(?:olive|vegetable) oil\b/,
  /\bgarlic infused oil\b/,
  /\b(?:spring onion|scallion) green tops?\b/,
];

// These words usually mean that a low base food is part of a recipe whose ingredients
// are unknown. Do not call the whole item low from `chicken`, `rice`, etc. alone.
const UNCERTAIN_PREPARATION =
  /\b(curry|sauce|gravy|marinade|marinated|seasoned|stew|soup|casserole|sausage|salami|deli|burger|meatballs?|stuffing|sandwich|wrap|cake|slice|bar|biscuit|cookies?|muesli|granola)\b/;

const CANNED_LEGUME =
  /\b(?:canned|tinned|drained|rinsed)\b.*\b(?:chickpeas?|garbanzo beans?|lentils?|kidney beans?|black beans?|butter beans?|cannellini beans?|navy beans?|lima beans?)\b|\b(?:chickpeas?|garbanzo beans?|lentils?|kidney beans?|black beans?|butter beans?|cannellini beans?|navy beans?|lima beans?)\b.*\b(?:canned|tinned|drained|rinsed)\b/;
const NON_LEGUME_GOS =
  /\b(?:cashews?|pistachios?|soy ?beans?|whole soy ?bean(?:s)?|soy flour|galactooligosaccharides?|galacto oligosaccharides?|gos)\b/;

const RANK: Record<FodmapRating, number> = { low: 0, unknown: 1, moderate: 2, high: 3 };

function stronger(a: FodmapRating, b: FodmapRating): FodmapRating {
  return RANK[b] > RANK[a] ? b : a;
}

function clean(value: string): string {
  return value
    .toLocaleLowerCase('en-AU')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
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

function stripProtectedAlternatives(value: string): string {
  return PROTECTED_ALTERNATIVES.reduce((text, pattern) => text.replace(pattern, ' '), value)
    .replace(/\s+/g, ' ')
    .trim();
}

function isClearlyLowName(name: string): boolean {
  return !UNCERTAIN_PREPARATION.test(name) && LOW_NAME_RULES.some((pattern) => pattern.test(name));
}

function assessItem(item: FoodItem): {
  overall: FodmapRating;
  groups: Record<FodmapGroup, FodmapRating>;
} {
  const name = clean(item.name);
  const text = clean(`${item.name} ${item.ingredients ?? ''}`);
  let screeningText = stripProtectedAlternatives(text);
  const groups = blankGroups();
  let overall: FodmapRating = 'unknown';
  let knownLowPortion = false;
  const grams = Math.max(0, item.grams * item.scale);

  // Monash publicly uses one 24 g slice of wholemeal wheat bread as an example of a
  // low-FODMAP portion, while its standard two-slice serve is high. Stay conservative
  // between those two published examples.
  const wholemealBread = /\b(?:wholemeal|whole wheat) bread\b/;
  if (wholemealBread.test(screeningText)) {
    const rating: FodmapRating = grams <= 24 ? 'low' : grams < 48 ? 'moderate' : 'high';
    groups.fructans = rating;
    overall = rating;
    knownLowPortion = rating === 'low';
    screeningText = screeningText.replace(wholemealBread, ' ');
  }

  // Avocado contains the unique polyol perseitol. These thresholds preserve the app's
  // existing conservative traffic-light behaviour while accounting for the scaled serve.
  if (/\bavocados?\b/.test(screeningText)) {
    const rating: FodmapRating = grams <= 30 ? 'low' : grams <= 45 ? 'moderate' : 'high';
    groups.polyols = rating;
    overall = stronger(overall, rating);
    knownLowPortion = rating === 'low';
    screeningText = screeningText.replace(/\bavocados?\b/g, ' ');
  }

  const cannedLegumeOnly = CANNED_LEGUME.test(screeningText) && !NON_LEGUME_GOS.test(screeningText);

  for (const rule of HIGH_RULES) {
    if (!rule.pattern.test(screeningText)) continue;
    const rating = cannedLegumeOnly && rule.groups.includes('gos') ? 'moderate' : rule.rating;
    for (const group of rule.groups) groups[group] = stronger(groups[group], rating);
    overall = stronger(overall, rating);
  }

  const clearlyLow = isClearlyLowName(name) || knownLowPortion;
  if ((overall === 'unknown' || overall === 'low') && clearlyLow) {
    return { overall: 'low', groups: blankGroups('low') };
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
