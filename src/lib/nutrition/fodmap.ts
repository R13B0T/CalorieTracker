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

type PortionRule = {
  pattern: RegExp;
  groups: FodmapGroup[];
  /** Largest cited low-FODMAP serving, in grams. Zero means the sources conflict. */
  lowMaxG: number;
  /** Servings from this weight screen high; the range in between screens moderate. */
  highFromG?: number;
  qualifier?: RegExp;
  excluded?: RegExp;
};

/*
 * This is a conservative local screen, not a reproduction of a proprietary food
 * database. Public charts from Monash University, the American College of
 * Gastroenterology, Cambridge University Hospitals, FODMAP Friendly, Ideal
 * Nutrition, IBS Diets and Gastroenterology Consultants of San Antonio were
 * reconciled in September 2026. Newer Monash retesting wins where older charts
 * disagree. The Monash app remains the source of truth for current lab-tested serves.
 */

// Portion rules run before broad food-family rules. This distinguishes an allowed
// tested quantity from an unrestricted food. Rules only apply to a single-food name;
// the weight of a curry, salad or mixed dish cannot safely be assigned to one ingredient.
const PORTION_RULES: PortionRule[] = [
  // Vegetables
  { pattern: /\basparagus\b/, groups: ['fructose'], lowMaxG: 12, highFromG: 12.01 },
  {
    pattern: /\b(?:globe )?artichokes?\b/,
    groups: ['fructans'],
    lowMaxG: 50,
    qualifier: /\b(?:canned|tinned)\b/,
  },
  {
    pattern: /\b(?:globe )?artichokes?\b/,
    groups: ['fructans'],
    lowMaxG: 16,
    highFromG: 16.01,
  },
  {
    pattern: /\bbeetroot\b|\bbeets?\b/,
    groups: ['fructans', 'gos'],
    lowMaxG: 75,
    qualifier: /\b(?:canned|pickled)\b/,
  },
  { pattern: /\bbeetroot\b|\bbeets?\b/, groups: ['fructans', 'gos'], lowMaxG: 25 },
  {
    pattern: /\btenderstem broccoli\b|\bbroccoli stems?\b/,
    groups: ['fructans'],
    lowMaxG: 45,
  },
  { pattern: /\bbroccolini\b/, groups: ['fructans'], lowMaxG: 75 },
  { pattern: /\bbroccoli(?: heads?| florets?)?\b/, groups: ['fructans'], lowMaxG: 75 },
  { pattern: /\bbrussels? sprouts?\b/, groups: ['fructans'], lowMaxG: 53 },
  { pattern: /\bbutternut(?: squash)?\b/, groups: ['polyols'], lowMaxG: 60 },
  { pattern: /\bsavoy cabbage\b/, groups: ['fructans'], lowMaxG: 40 },
  {
    pattern: /\b(?:red|green|white|common) cabbage\b/,
    groups: ['fructans'],
    lowMaxG: 75,
    highFromG: 180,
  },
  { pattern: /\bwhite cauliflower\b|\bcauliflower\b/, groups: ['fructans'], lowMaxG: 75 },
  { pattern: /\bcelery\b/, groups: ['polyols'], lowMaxG: 15 },
  {
    pattern: /\b(?:creamed|canned) (?:sweet ?)?corn\b/,
    groups: ['polyols'],
    lowMaxG: 75,
  },
  {
    pattern: /\b(?:sweet ?corn|corn kernels?|corn on the cob)\b/,
    groups: ['polyols'],
    lowMaxG: 40,
    highFromG: 75,
  },
  { pattern: /\bedamame(?: beans?)?\b/, groups: ['gos'], lowMaxG: 75 },
  { pattern: /\bfennel(?: bulb)?\b/, groups: ['fructans'], lowMaxG: 60 },
  {
    pattern: /\bgreen peas?\b/,
    groups: ['fructans'],
    lowMaxG: 53,
    qualifier: /\b(?:canned|tinned)\b/,
  },
  { pattern: /\bleek (?:bulb|white(?: part)?)\b/, groups: ['fructans'], lowMaxG: 14 },
  { pattern: /\bmangetout\b/, groups: ['fructans'], lowMaxG: 20 },
  { pattern: /\bokra\b/, groups: ['fructans'], lowMaxG: 70 },
  {
    pattern: /\bporcini mushrooms?\b/,
    groups: ['polyols'],
    lowMaxG: 15,
    qualifier: /\bdried\b/,
  },
  {
    pattern: /\bred (?:capsicums?|bell peppers?)\b/,
    groups: ['fructose'],
    lowMaxG: 43,
    highFromG: 75,
  },
  {
    pattern: /\bgreen (?:capsicums?|bell peppers?)\b/,
    groups: ['polyols'],
    lowMaxG: 75,
  },
  { pattern: /\bsnow peas?\b/, groups: ['fructans'], lowMaxG: 75 },
  { pattern: /\bsugar snap peas?\b/, groups: ['fructans'], lowMaxG: 20 },
  { pattern: /\bsweet potato(?:es)?\b/, groups: ['fructans'], lowMaxG: 75 },
  { pattern: /\btaro\b/, groups: ['polyols'], lowMaxG: 75 },
  { pattern: /\baubergines?\b|\beggplants?\b/, groups: ['polyols'], lowMaxG: 75 },
  { pattern: /\bzucchini\b|\bcourgettes?\b/, groups: ['fructans'], lowMaxG: 65 },

  // Fruit
  { pattern: /\bavocados?\b/, groups: ['polyols'], lowMaxG: 60, highFromG: 80 },
  { pattern: /\bripe bananas?\b/, groups: ['fructans'], lowMaxG: 33, highFromG: 100 },
  { pattern: /\bunripe bananas?\b|\bfirm bananas?\b/, groups: ['fructans'], lowMaxG: 100 },
  {
    pattern: /\bfresh apricots?\b|\bapricots?\b/,
    groups: ['polyols'],
    lowMaxG: 0,
    excluded: /\b(?:dried|canned|tinned)\b/,
  },
  { pattern: /\bmedjool dates?\b/, groups: ['fructose'], lowMaxG: 20, highFromG: 20.01 },
  { pattern: /\bdates?\b/, groups: ['fructose'], lowMaxG: 30, highFromG: 30.01 },
  { pattern: /\b(?:red|purple) grapes?\b/, groups: ['fructose'], lowMaxG: 28, highFromG: 75 },
  {
    pattern: /\b(?:green|white) grapes?\b/,
    groups: ['fructose'],
    lowMaxG: 32,
    highFromG: 75,
  },
  { pattern: /\bgrapes?\b/, groups: ['fructose'], lowMaxG: 28, highFromG: 75 },
  {
    pattern: /\bgrapefruits?\b/,
    groups: ['fructose'],
    lowMaxG: 0,
    highFromG: 80.01,
  },
  {
    pattern: /\bhoneydew(?: melon)?\b|\bgalia melon\b/,
    groups: ['fructans'],
    lowMaxG: 0,
    highFromG: 92.01,
  },
  {
    pattern: /\bcanned lychees?\b|\btinned lychees?\b/,
    groups: ['polyols'],
    lowMaxG: 96,
  },
  {
    pattern: /\bmango(?:es)?\b/,
    groups: ['fructose'],
    lowMaxG: 40,
    highFromG: 40.01,
    excluded: /\bdried\b/,
  },
  { pattern: /\bpassion ?fruits?\b/, groups: ['fructans'], lowMaxG: 46 },
  {
    pattern: /\bfresh pineapple\b|\bpineapple\b/,
    groups: ['fructose'],
    lowMaxG: 140,
    excluded: /\b(?:dried|canned|tinned)\b/,
  },
  {
    pattern: /\b(?:canned|tinned) pineapple\b/,
    groups: ['fructose'],
    lowMaxG: 97,
  },
  { pattern: /\bpomegranate\b/, groups: ['fructose'], lowMaxG: 42, highFromG: 42.01 },
  { pattern: /\braspberr(?:y|ies)\b/, groups: ['fructose'], lowMaxG: 58 },
  { pattern: /\bcantaloupe\b|\brockmelon\b/, groups: ['fructans'], lowMaxG: 120 },
  { pattern: /\bstrawberr(?:y|ies)\b/, groups: ['fructose'], lowMaxG: 65, highFromG: 100 },
  { pattern: /\braisins?\b|\bsultanas?\b/, groups: ['fructose'], lowMaxG: 13, highFromG: 13.01 },
  {
    pattern: /\bdried cranberr(?:y|ies)\b/,
    groups: ['fructose'],
    lowMaxG: 12,
    highFromG: 22.01,
  },
  { pattern: /\bkiwi(?:fruit)?\b/, groups: ['fructans'], lowMaxG: 150 },

  // Grains, dairy and plant proteins
  {
    pattern: /\b(?:wholemeal|whole wheat) bread\b/,
    groups: ['fructans'],
    lowMaxG: 24,
    highFromG: 48,
  },
  { pattern: /\bwheat pasta\b/, groups: ['fructans'], lowMaxG: 74, highFromG: 74.01 },
  { pattern: /\bspelt pasta\b/, groups: ['fructans'], lowMaxG: 74 },
  { pattern: /\bpearl barley\b/, groups: ['fructans'], lowMaxG: 30, highFromG: 30.01 },
  { pattern: /\bsilken tofu\b/, groups: ['gos'], lowMaxG: 39, highFromG: 39.01 },
  {
    pattern: /\b(?:chickpeas?|garbanzo beans?)\b/,
    groups: ['fructans'],
    lowMaxG: 44,
    highFromG: 44.01,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  {
    pattern: /\bblack beans?\b/,
    groups: ['gos'],
    lowMaxG: 45,
    highFromG: 45.01,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  {
    pattern: /\bkidney beans?\b/,
    groups: ['gos'],
    lowMaxG: 85,
    highFromG: 85.01,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  {
    pattern: /\bbutter beans?\b/,
    groups: ['gos'],
    lowMaxG: 35,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  {
    pattern: /\bpinto beans?\b/,
    groups: ['gos'],
    lowMaxG: 39,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  {
    pattern: /\badzuki beans?\b/,
    groups: ['gos'],
    lowMaxG: 38,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  {
    pattern: /\b(?:brown )?lentils?\b/,
    groups: ['gos'],
    lowMaxG: 44,
    qualifier: /\b(?:canned|tinned|drained|rinsed)\b/,
  },
  { pattern: /\b(?:red|green) lentils?\b/, groups: ['gos'], lowMaxG: 23 },
  { pattern: /\bcanned coconut milk\b/, groups: ['polyols'], lowMaxG: 60 },
  { pattern: /\bcoconut milk\b/, groups: ['polyols'], lowMaxG: 0, highFromG: 125.01 },
  { pattern: /\bhemp milk\b/, groups: ['gos'], lowMaxG: 125 },
  { pattern: /\boat milk\b/, groups: ['fructans'], lowMaxG: 40 },
  { pattern: /\brice milk\b/, groups: ['fructans'], lowMaxG: 200 },
  { pattern: /\bquinoa milk\b/, groups: ['fructans'], lowMaxG: 250 },
  { pattern: /\bcottage cheese\b/, groups: ['lactose'], lowMaxG: 40 },
  { pattern: /\bricotta(?: cheese)?\b/, groups: ['lactose'], lowMaxG: 40 },
  { pattern: /\bcream cheese\b/, groups: ['lactose'], lowMaxG: 40 },
  {
    pattern: /\bgreek yoghurt\b|\bgreek yogurt\b/,
    groups: ['lactose'],
    lowMaxG: 23,
    highFromG: 23.01,
  },
  { pattern: /\bhalloumi\b/, groups: ['lactose'], lowMaxG: 40 },
  { pattern: /\bsour cream\b/, groups: ['lactose'], lowMaxG: 40 },
  { pattern: /\bwhipped cream\b/, groups: ['lactose'], lowMaxG: 60 },
  {
    pattern: /\bcream\b/,
    groups: ['lactose'],
    lowMaxG: 40,
    excluded: /\b(?:ice cream|lactose free|coconut cream)\b/,
  },
  {
    pattern: /\balmonds?\b/,
    groups: ['gos'],
    lowMaxG: 12,
    excluded: /\b(?:milk|yogh?urt)\b/,
  },
  {
    pattern: /\bhazelnuts?\b/,
    groups: ['gos'],
    lowMaxG: 15,
    excluded: /\b(?:milk|yogh?urt)\b/,
  },

  // Concentrated sweeteners and chocolate
  {
    pattern: /\bagave(?: nectar| syrup)?\b/,
    groups: ['fructose'],
    lowMaxG: 5,
    highFromG: 5.01,
  },
  {
    pattern: /\bhoney\b/,
    groups: ['fructose', 'fructans'],
    lowMaxG: 7,
    highFromG: 7.01,
  },
  { pattern: /\bmolasses\b|\btreacle\b/, groups: ['fructose'], lowMaxG: 5 },
  { pattern: /\bdark chocolate\b/, groups: ['lactose'], lowMaxG: 30 },
  { pattern: /\bmilk chocolate\b/, groups: ['lactose'], lowMaxG: 20 },
  { pattern: /\bwhite chocolate\b/, groups: ['lactose'], lowMaxG: 25 },
];

const SCREENING_RULES: Rule[] = [
  {
    pattern:
      /\b(apples?|apple ?sauce|apple juice|apple (?:juice )?concentrate|apple syrup|pears?|pear juice|nashi pears?|blackberr(?:y|ies)|grapefruits?|grapes?|mango(?:es)?|figs?|dates?|raisins?|sultanas?|watermelon|feijoas?|custard apples?|persimmons?|rambutans?|tinned fruit in (?:natural )?juice|dried (?:fruit|apples?|apricots?|figs?|dates?|goji berr(?:y|ies)|mango(?:es)?|pears?|pineapple)|fruit juice concentrate|honey|agave(?: nectar| syrup)?|high fructose corn syrup|corn syrup high fructose|fructose(?: syrup)?|crystalline fructose)\b/,
    groups: ['fructose'],
    rating: 'high',
  },
  {
    pattern:
      /\b(apples?|pears?|nashi pears?|cherr(?:y|ies)|nectarines?|peach(?:es)?|plums?|prunes?|(?:dried|canned|tinned) apricots?|raw lychees?|avocados?|(?:button|flat|shiitake|portobello|enoki|fresh) mushrooms?|sorbitol|mannitol|xylitol|maltitol|lactitol|isomalt|erythritol|hydrogenated starch hydrolysates?|e ?420|e ?421|e ?953|e ?965|e ?966|e ?967|e ?968|sugar free confectionery|sugar free (?:gum|mints?|loll(?:y|ies)|candy|sweets?))\b/,
    groups: ['polyols'],
    rating: 'high',
  },
  {
    pattern:
      /\b((?:jerusalem|globe) artichokes?|artichokes?|asparagus|garlic|black garlic|garlic powder|onions?|onion powder|shallots?|leeks?|spring onions?|scallions?|rye|barley|couscous|bulg(?:u|a)r|freekeh|naan|roti|pita|pitta|chapatti|pumpernickel|wholemeal bread|whole wheat bread|wheat (?:flour|bread|pasta|noodles?|biscuits?|cereal|crackers?|bran|germ|gnocchi)|rye (?:bread|crispbread|crackers?|flour)|barley (?:bread|cereal|flakes|flour)|muesli(?: containing)? wheat|inulin|chicory (?:root|fibre|fiber)|dandelion (?:root|tea)|fructooligosaccharides?|fructo oligosaccharides?|oligofructose|fos)\b/,
    groups: ['fructans'],
    rating: 'high',
  },
  {
    pattern: /\b(?:frozen|fresh) green peas?\b/,
    groups: ['fructans'],
    rating: 'high',
  },
  {
    pattern:
      /\b(chickpeas?|garbanzo beans?|lentils?|red kidney beans?|kidney beans?|black beans?|baked beans?|refried beans?|butter beans?|cannellini beans?|navy beans?|haricot beans?|lima beans?|borlotti beans?|broad beans?|fava beans?|split peas?|falafels?|edamame|soy ?beans?|whole soy ?bean(?:s)?|soy flour|textured vegetable protein|tvp|cashews?|pistachios?|galactooligosaccharides?|galacto oligosaccharides?|gos)\b/,
    groups: ['gos'],
    rating: 'high',
  },
  {
    pattern: /\b(?:chickpeas?|garbanzo beans?|cashews?|pistachios?|whole soy ?beans?)\b/,
    groups: ['fructans'],
    rating: 'high',
  },
  {
    pattern:
      /\b(cows? milk|goats? milk|sheeps? milk|whole milk|full cream milk|skim milk|evaporated milk|condensed milk|milk|milk powder|milk solids|whey powder|whey concentrate|buttermilk|lactose|yogh?urts?|ice cream|gelato|custard|soft cheese|cream cheese|cream|sour cream|ricotta|cottage cheese)\b/,
    groups: ['lactose'],
    rating: 'high',
  },
  {
    pattern:
      /\b(beetroot|beets?|brussels? sprouts?|savoy cabbage|white cauliflower|cauliflower|sugar snap peas?|sweet potato(?:es)?)\b/,
    groups: ['fructans'],
    rating: 'moderate',
  },
  { pattern: /\bcelery\b/, groups: ['polyols'], rating: 'moderate' },
  {
    pattern: /\bred (?:capsicums?|bell peppers?)\b/,
    groups: ['fructose'],
    rating: 'moderate',
  },
];

// Remove known lower-FODMAP alternatives before scanning for a risky word contained
// inside their names. Other ingredients remain visible, so almond milk with inulin is
// still flagged.
const PROTECTED_ALTERNATIVES = [
  /\blactose free (?:milk|yogh?urt|ice cream|custard|cream|cheese)\b/g,
  /\b(?:almond|coconut) (?:milk )?yogh?urt\b/g,
  /\b(?:almond|rice|oat|quinoa|macadamia|hemp) milk\b/g,
  /\bsoy milk (?:made )?from soy protein(?: isolate)?\b/g,
  /\bsoy protein(?: isolate)? milk\b/g,
  /\bsoy milk\b/g,
  /\bwhey protein isolate\b/g,
  /\bgarlic infused oil\b/g,
  /\bonion infused oil\b/g,
  /\b(?:spring onion|scallion|shallot|leek) green tops?\b/g,
  /\bcanned (?:champignon )?mushrooms?\b/g,
  /\boyster mushrooms?\b/g,
  /\bfirm tofu\b/g,
  /\bsourdough spelt bread\b/g,
  /\b(?:brie|camembert|feta|cheddar|parmesan|comte|gruyere|manchego|monterey jack|mozzarella|pecorino|swiss|hard cheese)\b/g,
  /\bcoconut (?:cream|milk)\b/g,
];

const LOW_NAME_RULES = [
  // Grains and starches
  /\b(?:white|brown|basmati|jasmine) rice\b/,
  /\bquinoa(?: flakes?| flour| pasta)?\b/,
  /\b(?:rolled oats?|oat bran|oat flakes?|oat sourdough|porridge)\b/,
  /\b(?:rice|corn|quinoa|buckwheat|gluten free) (?:pasta|noodles?)\b/,
  /\b(?:plain )?rice (?:cakes?|crackers?)\b/,
  /\bsourdough spelt bread\b/,
  /\b(?:arrowroot|buckwheat|corn ?flour|cornstarch|corn ?flakes?|grits|maize|millet|polenta|potato starch|sago|sorghum|tapioca|teff)\b/,
  /\bgluten free (?:bread|flour|noodles?|crackers?|cereal)\b/,

  // Vegetables and fruit commonly listed without a restrictive serve
  /\b(?:alfalfa|rocket|arugula|baby spinach|bean sprouts?|bamboo shoots?|carrots?|cassava|celeriac|chard|silverbeet|chives|choy sum|cucumbers?|gherkin|galangal|ginger|green chill(?:i|ies)|kabocha pumpkin|kale|lettuce|nori|pak choi|parsnips?|potato(?:es)?|pumpkin|radish(?:es)?|spinach|swede|tomato(?:es)?|turnips?|water chestnuts?|yam)\b/,
  /\b(?:black|green) olives?\b/,
  /\b(?:yellow|orange) (?:capsicums?|bell peppers?)\b/,
  /\bcanned (?:champignon )?mushrooms?\b/,
  /\boyster mushrooms?\b/,
  /\b(?:clementines?|dragon ?fruits?|durian|kiwiberr(?:y|ies)|lemons?|limes?|mandarins?|oranges?|papayas?|plantains?|prickly pears?|rhubarb|star ?fruits?)\b/,
  /\b(?:raw|fresh) cranberr(?:y|ies)\b/,
  /\bripe guavas?\b/,

  // Protein, dairy alternatives, nuts and seeds
  /\b(?:eggs?|firm tofu|tempeh|spirulina|pea protein)\b/,
  /\b(?:beef|chicken|duck|pork|lamb|fish|salmon|seafood|shellfish|tuna|turkey)(?: (?:breast|steak|fillet|mince))?\b/,
  /\b(?:lactose free (?:milk|yogh?urt|ice cream|custard|cream|cheese)|almond milk|macadamia milk|soy protein(?: isolate)? milk|soy milk (?:made )?from soy protein(?: isolate)?)\b/,
  /\b(?:brie|blue cheese|camembert|feta|cheddar|parmesan|comte|edam|ghee|gruyere|manchego|monterey jack|mozzarella|pecorino|swiss|hard cheese|butter|creme fraiche)\b/,
  /\b(?:brazil nuts?|chestnuts?|chia seeds?|flaxseeds?|linseeds?|hemp seeds?|macadamias?|peanuts?|pecans?|pine nuts?|poppy seeds?|pumpkin seeds?|pepitas?|sesame seeds?|sunflower seeds?|tahini|walnuts?)\b/,

  // Sweeteners, oils and flavourings
  /\b(?:brown sugar|dextrose|glucose|golden syrup|icing sugar|maple syrup|palm sugar|raw sugar|rice malt syrup|stevia|sucrose|table sugar|white sugar)\b/,
  /\b(?:olive|vegetable|canola) oil\b/,
  /\b(?:garlic|onion) infused oil\b/,
  /\b(?:spring onion|scallion|shallot|leek) green tops?\b/,
];

// A safe base food does not make an unspecified prepared dish safe.
const UNCERTAIN_PREPARATION =
  /\b(curry|sauce|gravy|marinade|marinated|seasoned|stew|soup|casserole|sausage|salami|deli|burger|meatballs?|stuffing|sandwich|wrap|pizza|salad|bowl|medley|mix|cake|slice|bar|biscuit|cookies?|muesli|granola)\b/;
const COMPOSITE_NAME = /\b(?:and|with|plus)\b/;

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

function stripPattern(value: string, pattern: RegExp): string {
  return value.replace(new RegExp(pattern.source, 'g'), ' ').replace(/\s+/g, ' ').trim();
}

function isClearlyLowName(name: string): boolean {
  return !UNCERTAIN_PREPARATION.test(name) && LOW_NAME_RULES.some((pattern) => pattern.test(name));
}

function getPortionRule(name: string): PortionRule | undefined {
  const compositionText = name.replace(/\band (?:drained|rinsed|peeled|pitted|deseeded)\b/g, ' ');
  if (UNCERTAIN_PREPARATION.test(name) || COMPOSITE_NAME.test(compositionText)) return undefined;
  return PORTION_RULES.find(
    (rule) =>
      rule.pattern.test(name) &&
      (!rule.qualifier || rule.qualifier.test(name)) &&
      (!rule.excluded || !rule.excluded.test(name)),
  );
}

function assessItem(item: FoodItem): {
  overall: FodmapRating;
  groups: Record<FodmapGroup, FodmapRating>;
} {
  const name = clean(item.name);
  const text = clean(item.name + ' ' + (item.ingredients ?? ''));
  let screeningText = stripProtectedAlternatives(text);
  const groups = blankGroups();
  let overall: FodmapRating = 'unknown';
  let knownLowPortion = false;
  const grams = Math.max(0, item.grams * item.scale);

  const portionRule = getPortionRule(name);
  if (portionRule) {
    const rating: FodmapRating =
      grams <= portionRule.lowMaxG
        ? 'low'
        : portionRule.highFromG !== undefined && grams >= portionRule.highFromG
          ? 'high'
          : 'moderate';
    for (const group of portionRule.groups) groups[group] = rating;
    overall = rating;
    knownLowPortion = rating === 'low';
    screeningText = stripPattern(screeningText, portionRule.pattern);
  }

  for (const rule of SCREENING_RULES) {
    if (!rule.pattern.test(screeningText)) continue;
    for (const group of rule.groups) groups[group] = stronger(groups[group], rule.rating);
    overall = stronger(overall, rule.rating);
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
