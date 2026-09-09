import { db } from '../db/db';
import type { CachedProduct } from '../db/types';
import { offToProduct, type OffProduct } from './mapping';

const FIELDS =
  'code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments,image_front_small_url';
const CACHE_MS = 30 * 86_400_000;

export class OffError extends Error {
  constructor(
    public kind: 'not_found' | 'network' | 'rate_limited',
    msg: string,
  ) {
    super(msg);
  }
}

async function fetchProduct(
  host: string,
  barcode: string,
  signal?: AbortSignal,
): Promise<OffProduct | null> {
  const res = await fetch(
    `https://${host}/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`,
    { signal },
  );
  if (res.status === 404) return null;
  if (res.status === 429) throw new OffError('rate_limited', 'rate limited');
  if (!res.ok) throw new OffError('network', `HTTP ${res.status}`);
  const json = (await res.json()) as { status: number; product?: OffProduct };
  return json.status === 1 && json.product ? json.product : null;
}

/** Barcode -> product, cached for 30 days. AU host first for localised names, then world. */
export async function lookupBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<CachedProduct | null> {
  const cached = await db.offCache.get(barcode);
  if (cached && (cached.source === 'user' || Date.now() - cached.fetchedAt < CACHE_MS))
    return cached.product;
  if (!navigator.onLine) {
    if (cached) return cached.product;
    throw new OffError('network', 'offline');
  }
  let product: OffProduct | null = null;
  try {
    product = await fetchProduct('au.openfoodfacts.org', barcode, signal);
    if (!product) product = await fetchProduct('world.openfoodfacts.org', barcode, signal);
  } catch (e) {
    if (cached) return cached.product;
    throw e instanceof OffError ? e : new OffError('network', String(e));
  }
  const mapped = product ? offToProduct(product) : null;
  await db.offCache.put({ barcode, fetchedAt: Date.now(), product: mapped, source: 'off' });
  return mapped;
}

export async function saveUserProduct(p: CachedProduct): Promise<void> {
  await db.offCache.put({ barcode: p.barcode, fetchedAt: Date.now(), product: p, source: 'user' });
}

/** Free-text search of packaged products, filtered to Australia. Debounce at the call site. */
export async function searchProducts(
  query: string,
  signal?: AbortSignal,
): Promise<CachedProduct[]> {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('tagtype_0', 'countries');
  url.searchParams.set('tag_contains_0', 'contains');
  url.searchParams.set('tag_0', 'australia');
  const res = await fetch(url, { signal });
  if (res.status === 429) throw new OffError('rate_limited', 'rate limited');
  if (!res.ok) throw new OffError('network', `HTTP ${res.status}`);
  const json = (await res.json()) as { products?: OffProduct[] };
  return (json.products ?? []).map(offToProduct).filter((p): p is CachedProduct => !!p);
}
