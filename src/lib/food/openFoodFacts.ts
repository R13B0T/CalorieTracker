import { db } from '../db/db';
import type { CachedProduct } from '../db/types';
import { offToProduct, type OffProduct } from './mapping';

const FIELDS =
  'code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments,ingredients_text,ingredients_text_en,image_front_small_url';
const CACHE_MS = 30 * 86_400_000;
const REQUEST_TIMEOUT_MS = 12_000;
const DETAILS_VERSION = 2;

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
  const res = await fetchWithTimeout(
    `https://${host}/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`,
    signal,
  );
  if (res.status === 404) return null;
  if (res.status === 429) throw new OffError('rate_limited', 'rate limited');
  if (!res.ok) throw new OffError('network', `HTTP ${res.status}`);
  const json = (await res.json()) as { status: number; product?: OffProduct };
  return json.status === 1 && json.product ? json.product : null;
}

async function fetchWithTimeout(input: RequestInfo | URL, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) onAbort();
  else signal?.addEventListener('abort', onAbort, { once: true });
  const timer = globalThis.setTimeout(
    () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(input, { signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Barcode -> product, cached for 30 days. AU host first for localised names, then world. */
export async function lookupBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<CachedProduct | null> {
  const cached = await db.offCache.get(barcode);
  if (
    cached &&
    (cached.source === 'user' ||
      (cached.detailsVersion === DETAILS_VERSION && Date.now() - cached.fetchedAt < CACHE_MS))
  )
    return cached.product;
  if (!navigator.onLine) {
    if (cached) return cached.product;
    throw new OffError('network', 'offline');
  }
  let product: OffProduct | null = null;
  let successfulResponse = false;
  let lastError: OffError | null = null;
  for (const host of ['au.openfoodfacts.org', 'world.openfoodfacts.org']) {
    try {
      product = await fetchProduct(host, barcode, signal);
      successfulResponse = true;
      if (product) break;
    } catch (e) {
      if (signal?.aborted) throw e;
      lastError = e instanceof OffError ? e : new OffError('network', String(e));
      // A regional endpoint failure should not prevent the world endpoint fallback.
    }
  }
  if (!product && lastError && cached) return cached.product;
  if (!product && !successfulResponse && lastError) throw lastError;
  const mapped = product ? offToProduct(product) : null;
  await db.offCache.put({
    barcode,
    fetchedAt: Date.now(),
    product: mapped,
    source: 'off',
    detailsVersion: DETAILS_VERSION,
  });
  return mapped;
}

export async function saveUserProduct(p: CachedProduct): Promise<void> {
  await db.offCache.put({
    barcode: p.barcode,
    fetchedAt: Date.now(),
    product: p,
    source: 'user',
    detailsVersion: DETAILS_VERSION,
  });
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
  const res = await fetchWithTimeout(url, signal);
  if (res.status === 429) throw new OffError('rate_limited', 'rate limited');
  if (!res.ok) throw new OffError('network', `HTTP ${res.status}`);
  const json = (await res.json()) as { products?: OffProduct[] };
  return (json.products ?? []).map(offToProduct).filter((p): p is CachedProduct => !!p);
}
