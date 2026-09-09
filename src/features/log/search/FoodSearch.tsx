import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { searchAfcd, type AfcdHit } from '@/lib/food/afcd';
import { afcdToItem, productToItem } from '@/lib/food/mapping';
import { searchProducts } from '@/lib/food/openFoodFacts';
import type { CachedProduct, FoodItem } from '@/lib/db/types';
import { kjToKcal } from '@/lib/nutrition/units';
import { PortionPicker } from './PortionPicker';
import { useSessionStore } from '@/stores/useSessionStore';
import { suggestSlot } from '@/lib/db/repos/meals';
import { applyEvent } from '@/lib/game/engine';
import { toDayKey } from '@/lib/date';
import { db } from '@/lib/db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatEnergy } from '@/lib/nutrition/units';

export default function FoodSearch() {
  const nav = useNavigate();
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const energyUnit = settings?.energyUnit ?? 'kcal';
  const setDraft = useSessionStore((s) => s.setDraft);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<AfcdHit[]>([]);
  const [products, setProducts] = useState<CachedProduct[] | null>(null);
  const [offBusy, setOffBusy] = useState(false);
  const [offError, setOffError] = useState<string | null>(null);
  const [picking, setPicking] = useState<{
    name: string;
    make: (g: number) => FoodItem;
    kcal100: number;
  } | null>(null);
  const [basket, setBasket] = useState<FoodItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => searchAfcd(q).then(setHits), 120);
    setProducts(null);
    setOffError(null);
    return () => clearTimeout(t);
  }, [q]);

  async function searchPackaged() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setOffBusy(true);
    setOffError(null);
    try {
      setProducts(await searchProducts(q, ac.signal));
    } catch (e) {
      if (!(e instanceof DOMException))
        setOffError(
          'Open Food Facts is not answering right now. Try again shortly or describe it instead.',
        );
    } finally {
      setOffBusy(false);
    }
  }

  function addToBasket(item: FoodItem) {
    setBasket((b) => [...b, item]);
    setPicking(null);
  }

  async function review() {
    const s = await db.settings.get('me');
    await applyEvent({ type: 'search_used', dayKey: toDayKey(Date.now(), s?.dayStartHour ?? 4) });
    setDraft({
      analysis: {
        title:
          basket.length === 1 ? basket[0].name : `${basket[0].name} + ${basket.length - 1} more`,
        items: basket.map((i) => ({
          name: i.name,
          grams: i.grams,
          nutrients: i.per,
          confidence: i.confidence,
          assumptions: i.assumptions ?? [],
        })),
        notes: 'From the food database. No AI guesswork here.',
        overall_confidence: 'high',
        needs_clarification: null,
      },
      source: 'search',
      slot: suggestSlot(Date.now()),
    });
    nav('/log/review');
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="text-xl font-black flex-1">Search foods</h1>
        {basket.length > 0 && (
          <button className="btn-primary py-2" onClick={review}>
            Review {basket.length}
          </button>
        )}
      </div>
      <input
        className="input text-lg"
        placeholder="banana, chicken breast, Weet-Bix…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {basket.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {basket.map((b) => (
            <button
              key={b.id}
              className="chip bg-euc-100 text-euc-700"
              onClick={() => setBasket((arr) => arr.filter((x) => x.id !== b.id))}
            >
              {b.name} · {b.grams} g ✕
            </button>
          ))}
        </div>
      )}

      {hits.length > 0 && (
        <ul className="card p-2 flex flex-col divide-y divide-sand-200">
          {hits.map((h) => (
            <li key={h.row[0]}>
              <button
                className="w-full text-left flex justify-between items-center gap-3 py-2 px-1"
                onClick={() =>
                  setPicking({
                    name: h.row[1],
                    kcal100: kjToKcal(h.row[2]),
                    make: (g) => afcdToItem(h.row, g),
                  })
                }
              >
                <span className="text-sm">{h.row[1]}</span>
                <span className="text-xs text-bark-500 shrink-0">
                  {formatEnergy(kjToKcal(h.row[2]), energyUnit)}/100g
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.length >= 3 && (
        <button className="btn-secondary" onClick={searchPackaged} disabled={offBusy}>
          {offBusy ? 'Searching…' : `Search packaged foods for "${q}"`}
        </button>
      )}
      {offError && (
        <div className="rounded-xl bg-berry-100 text-berry-500 px-4 py-3 text-sm font-semibold">
          {offError}
        </div>
      )}
      {products &&
        (products.length === 0 ? (
          <p className="text-sm text-bark-500 text-center">
            No Australian products matched. Australian own-brands are patchy on Open Food Facts. Try
            the barcode, or describe it and let Claude estimate.
          </p>
        ) : (
          <ul className="card p-2 flex flex-col divide-y divide-sand-200">
            {products.map((p) => (
              <li key={p.barcode}>
                <button
                  className="w-full text-left flex items-center gap-3 py-2 px-1"
                  onClick={() =>
                    setPicking({
                      name: `${p.brand ? p.brand + ' ' : ''}${p.name}`,
                      kcal100: p.per100.kcal,
                      make: (g) => productToItem(p, g),
                    })
                  }
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-sand-200" />
                  )}
                  <span className="flex-1 text-sm">
                    {p.brand && <span className="text-bark-500">{p.brand} </span>}
                    {p.name}
                  </span>
                  <span className="text-xs text-bark-500 shrink-0">
                    {formatEnergy(p.per100.kcal, energyUnit)}/100g
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {q.length >= 2 && hits.length === 0 && !products && (
        <p className="text-sm text-bark-500 text-center">
          Nothing in the Australian database. Try packaged foods above, or describe it.
        </p>
      )}

      <PortionPicker
        open={!!picking}
        name={picking?.name ?? ''}
        kcal100={picking?.kcal100 ?? 0}
        onClose={() => setPicking(null)}
        onPick={(g) => picking && addToBasket(picking.make(g))}
      />
    </div>
  );
}
