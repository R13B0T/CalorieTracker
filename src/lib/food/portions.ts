/** Household portion presets by keyword. First match wins; grams. */
const PRESETS: { match: RegExp; portions: { label: string; g: number }[] }[] = [
  {
    match: /\b(bread|toast|roll)\b/i,
    portions: [
      { label: '1 slice', g: 35 },
      { label: '2 slices', g: 70 },
      { label: '1 roll', g: 80 },
    ],
  },
  {
    match: /\brice\b/i,
    portions: [
      { label: '½ cup', g: 90 },
      { label: '1 cup', g: 185 },
      { label: '1½ cups', g: 280 },
    ],
  },
  {
    match: /\b(pasta|spaghetti|noodle)/i,
    portions: [
      { label: '1 cup', g: 150 },
      { label: '1½ cups', g: 225 },
      { label: '2 cups', g: 300 },
    ],
  },
  {
    match: /\bmilk\b/i,
    portions: [
      { label: 'splash', g: 40 },
      { label: '1 cup', g: 250 },
      { label: 'large glass', g: 350 },
    ],
  },
  {
    match: /\begg/i,
    portions: [
      { label: '1 egg', g: 50 },
      { label: '2 eggs', g: 100 },
      { label: '3 eggs', g: 150 },
    ],
  },
  {
    match: /\b(banana)\b/i,
    portions: [
      { label: '1 small', g: 100 },
      { label: '1 medium', g: 120 },
      { label: '1 large', g: 150 },
    ],
  },
  {
    match: /\b(apple|pear|orange|mandarin|peach)\b/i,
    portions: [
      { label: '1 small', g: 120 },
      { label: '1 medium', g: 150 },
      { label: '1 large', g: 200 },
    ],
  },
  {
    match: /\b(chicken|beef|lamb|pork|steak|fish|salmon|tuna)\b/i,
    portions: [
      { label: 'small (100 g)', g: 100 },
      { label: 'palm (150 g)', g: 150 },
      { label: 'large (200 g)', g: 200 },
    ],
  },
  {
    match: /\b(cheese)\b/i,
    portions: [
      { label: '1 slice', g: 20 },
      { label: 'matchbox', g: 30 },
      { label: 'generous', g: 50 },
    ],
  },
  {
    match: /\b(yoghurt|yogurt)\b/i,
    portions: [
      { label: 'small tub', g: 150 },
      { label: '1 cup', g: 250 },
    ],
  },
  {
    match: /\b(oil|butter|margarine)\b/i,
    portions: [
      { label: '1 tsp', g: 5 },
      { label: '1 tbsp', g: 15 },
      { label: '2 tbsp', g: 30 },
    ],
  },
  {
    match: /\b(nuts|almond|cashew|peanut)/i,
    portions: [
      { label: 'small handful', g: 30 },
      { label: 'large handful', g: 50 },
    ],
  },
  {
    match: /\b(potato|sweet potato)\b/i,
    portions: [
      { label: '1 small', g: 120 },
      { label: '1 medium', g: 180 },
      { label: '1 large', g: 250 },
    ],
  },
  {
    match: /\b(cereal|weet|muesli|oats|porridge)/i,
    portions: [
      { label: '2 biscuits', g: 30 },
      { label: '½ cup', g: 45 },
      { label: '1 cup', g: 90 },
    ],
  },
  {
    match: /\b(juice|soft drink|cola|beer|wine|coffee|tea)\b/i,
    portions: [
      { label: 'small (200 ml)', g: 200 },
      { label: 'can (375 ml)', g: 375 },
      { label: 'large (600 ml)', g: 600 },
    ],
  },
];

export function portionsFor(name: string): { label: string; g: number }[] {
  for (const p of PRESETS) if (p.match.test(name)) return p.portions;
  return [
    { label: 'small (50 g)', g: 50 },
    { label: '100 g', g: 100 },
    { label: 'large (200 g)', g: 200 },
  ];
}
