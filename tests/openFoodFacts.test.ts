import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db/db';
import { lookupBarcode } from '@/lib/food/openFoodFacts';

describe('Open Food Facts barcode fallback', () => {
  beforeEach(async () => {
    await db.offCache.clear();
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tries the world endpoint when the Australian endpoint cannot connect', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('regional endpoint unavailable'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 1,
            product: {
              code: '3017620422003',
              product_name: 'Chocolate spread',
              ingredients_text: 'Sugar, milk powder, cocoa',
              nutriments: { 'energy-kcal_100g': 539 },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const product = await lookupBarcode('3017620422003');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('au.openfoodfacts.org');
    expect(String(fetchMock.mock.calls[1][0])).toContain('world.openfoodfacts.org');
    expect(product?.name).toBe('Chocolate spread');
    expect(product?.ingredients).toContain('milk powder');
  });
});
