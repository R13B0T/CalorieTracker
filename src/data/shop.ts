export interface ShopItem {
  id: string;
  kind: 'outfit' | 'habitat' | 'consumable';
  name: string;
  desc: string;
  emoji: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'freeze',
    kind: 'consumable',
    name: 'Streak freeze',
    desc: 'Protects your streak for one missed day. Hold up to 2.',
    emoji: '🧊',
    price: 120,
  },
  { id: 'bow', kind: 'outfit', name: 'Red bow', desc: 'Dapper.', emoji: '🎀', price: 150 },
  {
    id: 'sunnies',
    kind: 'outfit',
    name: 'Sunnies',
    desc: 'Rottnest chic.',
    emoji: '🕶️',
    price: 250,
  },
  {
    id: 'bucket_hat',
    kind: 'outfit',
    name: 'Bucket hat',
    desc: 'Slip, slop, slap.',
    emoji: '🧢',
    price: 300,
  },
  {
    id: 'scarf',
    kind: 'outfit',
    name: 'Winter scarf',
    desc: 'For the three cold weeks a year.',
    emoji: '🧣',
    price: 350,
  },
  {
    id: 'flower_crown',
    kind: 'outfit',
    name: 'Wildflower crown',
    desc: 'Fresh-picked island colour.',
    emoji: '🌼',
    price: 220,
  },
  {
    id: 'bandana',
    kind: 'outfit',
    name: 'Adventure bandana',
    desc: 'Ready for the long way round.',
    emoji: '🔻',
    price: 280,
  },
  {
    id: 'explorer_hat',
    kind: 'outfit',
    name: 'Explorer hat',
    desc: 'For snacks beyond the horizon.',
    emoji: '🤠',
    price: 425,
  },
  {
    id: 'raincoat',
    kind: 'outfit',
    name: 'Sunny raincoat',
    desc: 'Small marsupial, serious weatherproofing.',
    emoji: '🧥',
    price: 500,
  },
  {
    id: 'headphones',
    kind: 'outfit',
    name: 'Leafbeat headphones',
    desc: 'A walking playlist, mostly rustling leaves.',
    emoji: '🎧',
    price: 550,
  },
  {
    id: 'cape',
    kind: 'outfit',
    name: 'Legend cape',
    desc: 'Every good habit deserves an entrance.',
    emoji: '🦸',
    price: 700,
  },
  {
    id: 'crown',
    kind: 'outfit',
    name: 'Golden crown',
    desc: 'Rottnest Royalty, literally.',
    emoji: '👑',
    price: 600,
  },
  {
    id: 'beach',
    kind: 'habitat',
    name: 'Beach',
    desc: 'Sand, sea and a very smiley marsupial.',
    emoji: '🏖️',
    price: 0,
  },
  {
    id: 'meadow',
    kind: 'habitat',
    name: 'Wildflower meadow',
    desc: 'Soft grass and tiny blooms in the sun.',
    emoji: '🌼',
    price: 250,
  },
  {
    id: 'bush',
    kind: 'habitat',
    name: 'Bushland',
    desc: 'Gum trees and golden light.',
    emoji: '🌳',
    price: 400,
  },
  {
    id: 'picnic',
    kind: 'habitat',
    name: 'Picnic lookout',
    desc: 'A breezy hill and the good blanket.',
    emoji: '🧺',
    price: 550,
  },
  {
    id: 'sunset',
    kind: 'habitat',
    name: 'Sunset cove',
    desc: 'Golden hour that never has to end.',
    emoji: '🌅',
    price: 700,
  },
  {
    id: 'night',
    kind: 'habitat',
    name: 'Starry night',
    desc: 'Southern Cross included.',
    emoji: '🌌',
    price: 800,
  },
  {
    id: 'rainforest',
    kind: 'habitat',
    name: 'Rainforest hideaway',
    desc: 'Moss, mist and excellent ferns.',
    emoji: '🌧️',
    price: 950,
  },
  {
    id: 'cafe',
    kind: 'habitat',
    name: 'Café corner',
    desc: 'A flat white and a good log.',
    emoji: '☕',
    price: 1200,
  },
  {
    id: 'lighthouse',
    kind: 'habitat',
    name: 'Lighthouse point',
    desc: 'A private ocean view from the headland.',
    emoji: '🌊',
    price: 1450,
  },
];

/** Kept beside the catalogue so badge progress automatically follows new outfits. */
export const OUTFIT_IDS = new Set(
  SHOP_ITEMS.filter((item) => item.kind === 'outfit').map((item) => item.id),
);
