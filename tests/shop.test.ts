import { describe, expect, it } from 'vitest';
import { OUTFIT_IDS, SHOP_ITEMS } from '@/data/shop';

describe('shop catalogue', () => {
  it('offers a broad set of outfits and habitats', () => {
    expect(SHOP_ITEMS.filter((item) => item.kind === 'outfit')).toHaveLength(11);
    expect(SHOP_ITEMS.filter((item) => item.kind === 'habitat')).toHaveLength(9);
  });

  it('keeps every item id unique', () => {
    const ids = SHOP_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives badge-counted outfits from the catalogue', () => {
    const catalogueOutfits = SHOP_ITEMS.filter((item) => item.kind === 'outfit').map(
      (item) => item.id,
    );
    expect([...OUTFIT_IDS]).toEqual(catalogueOutfits);
    expect(catalogueOutfits.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps the starter beach free and charges for other permanent items', () => {
    expect(SHOP_ITEMS.find((item) => item.id === 'beach')?.price).toBe(0);
    expect(
      SHOP_ITEMS.filter((item) => item.id !== 'beach' && item.kind !== 'consumable').every(
        (item) => item.price > 0,
      ),
    ).toBe(true);
  });
});
