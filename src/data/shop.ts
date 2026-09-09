export interface ShopItem {
  id: string;
  kind: 'outfit' | 'habitat' | 'consumable';
  name: string;
  desc: string;
  emoji: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'freeze', kind: 'consumable', name: 'Streak freeze', desc: 'Protects your streak for one missed day. Hold up to 2.', emoji: '🧊', price: 120 },
  { id: 'bow', kind: 'outfit', name: 'Red bow', desc: 'Dapper.', emoji: '🎀', price: 150 },
  { id: 'sunnies', kind: 'outfit', name: 'Sunnies', desc: 'Rottnest chic.', emoji: '🕶️', price: 250 },
  { id: 'bucket_hat', kind: 'outfit', name: 'Bucket hat', desc: 'Slip, slop, slap.', emoji: '🧢', price: 300 },
  { id: 'scarf', kind: 'outfit', name: 'Winter scarf', desc: 'For the three cold weeks a year.', emoji: '🧣', price: 350 },
  { id: 'crown', kind: 'outfit', name: 'Golden crown', desc: 'Rottnest Royalty, literally.', emoji: '👑', price: 600 },
  { id: 'beach', kind: 'habitat', name: 'Beach', desc: 'Sand, sea and a very smiley marsupial.', emoji: '🏖️', price: 0 },
  { id: 'bush', kind: 'habitat', name: 'Bushland', desc: 'Gum trees and golden light.', emoji: '🌳', price: 400 },
  { id: 'night', kind: 'habitat', name: 'Starry night', desc: 'Southern Cross included.', emoji: '🌌', price: 800 },
  { id: 'cafe', kind: 'habitat', name: 'Café corner', desc: 'A flat white and a good log.', emoji: '☕', price: 1200 },
];
