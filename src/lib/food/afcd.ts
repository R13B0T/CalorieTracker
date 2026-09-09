import MiniSearch from 'minisearch';
import type { AfcdRow } from './mapping';

export interface AfcdHit {
  row: AfcdRow;
  score: number;
}

interface Doc {
  id: number;
  name: string;
}

let loaded: { rows: AfcdRow[]; index: MiniSearch<Doc> } | null = null;

/** Lazy-load the bundled AFCD subset and build a fuzzy prefix index (a few ms). */
export async function loadAfcd() {
  if (loaded) return loaded;
  const mod = await import('@/data/afcd.json');
  const rows = (mod.default as unknown as { rows: AfcdRow[] }).rows;
  const index = new MiniSearch<Doc>({
    fields: ['name'],
    storeFields: [],
    searchOptions: { prefix: true, fuzzy: 0.2, boost: { name: 1 } },
    tokenize: (s) =>
      s
        .toLowerCase()
        .split(/[\s,()/&-]+/)
        .filter(Boolean),
  });
  index.addAll(rows.map((r, i) => ({ id: i, name: r[1] })));
  loaded = { rows, index };
  return loaded;
}

export async function searchAfcd(query: string, limit = 25): Promise<AfcdHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { rows, index } = await loadAfcd();
  const hits = index.search(q);
  // Shorter names are usually the plain food ("Banana, raw") rather than a composite dish.
  return hits
    .map((h) => ({
      row: rows[h.id as number],
      score: h.score / Math.log2(rows[h.id as number][1].length + 2),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const AFCD_ATTRIBUTION =
  'Food Standards Australia New Zealand, Australian Food Composition Database, Release 3 (2025). Licensed under CC BY 4.0.';
