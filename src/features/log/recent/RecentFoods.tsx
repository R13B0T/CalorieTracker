import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import type { FoodEntry, FoodItem } from '@/lib/db/types';
import { sumItems } from '@/lib/nutrition/totals';
import { overallConfidence } from '@/lib/nutrition/analysisToItems';
import { productToItem } from '@/lib/food/mapping';
import { newId } from '@/lib/id';
import { suggestSlot } from '@/lib/db/repos/meals';
import { useSessionStore } from '@/stores/useSessionStore';
import { PortionPicker } from '../search/PortionPicker';
import { Thumb } from '@/features/diary/Thumb';
import { formatDayLabel, toDayKey } from '@/lib/date';

type Tab = 'meals' | 'items';

interface SavedItem {
  key: string;
  name: string;
  kcal100: number;
  defaultGrams: number;
  make: (g: number) => FoodItem;
  origin: 'label' | 'manual' | 'logged';
}

export default function RecentFoods() {
  const nav = useNavigate();
  const setDraft = useSessionStore((s) => s.setDraft);
  const [tab, setTab] = useState<Tab>('meals');
  const [q, setQ] = useState('');
  const [picking, setPicking] = useState<SavedItem | null>(null);
  const [basket, setBasket] = useState<FoodItem[]>([]);

  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const todayKey = toDayKey(
    Date.now() + (settings?.timeOffsetMs ?? 0),
    settings?.dayStartHour ?? 4,
  );
  const entries = useLiveQuery(
    () => db.entries.orderBy('loggedAt').reverse().limit(300).toArray(),
    [],
    [],
  );
  const userProducts = useLiveQuery(
    () => db.offCache.filter((r) => r.source === 'user' && !!r.product).toArray(),
    [],
    [],
  );

  // Distinct recent meals by title (most recent occurrence wins).
  const meals = useMemo(() => {
    const seen = new Set<string>();
    const out: FoodEntry[] = [];
    for (const e of entries) {
      const k = e.title.trim().toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
    return out;
  }, [entries]);

  // Distinct items: saved label products, manual items, and any item ever logged.
  const items = useMemo(() => {
    const map = new Map<string, SavedItem>();
    for (const r of userProducts) {
      const p = r.product!;
      const name = p.brand ? `${p.brand} ${p.name}` : p.name;
      map.set(name.toLowerCase(), {
        key: `off:${p.barcode}`,
        name,
        kcal100: p.per100.kcal,
        defaultGrams: p.servingG ?? 100,
        make: (g) => productToItem(p, g),
        origin: 'label',
      });
    }
    for (const e of entries) {
      for (const it of e.items) {
        const k = it.name.trim().toLowerCase();
        if (map.has(k) || it.grams <= 0) continue;
        const per100 = {
          kcal: (it.per.kcal / it.grams) * 100,
          protein: (it.per.protein / it.grams) * 100,
          carbs: (it.per.carbs / it.grams) * 100,
          fat: (it.per.fat / it.grams) * 100,
          fibre: (it.per.fibre / it.grams) * 100,
        };
        const usual = Math.round(it.grams * it.scale);
        map.set(k, {
          key: `item:${k}`,
          name: it.name,
          kcal100: per100.kcal,
          defaultGrams: usual,
          origin: it.ref?.kind === 'manual' ? 'manual' : 'logged',
          make: (g) => ({
            id: newId(),
            name: it.name,
            grams: g,
            scale: 1,
            per: {
              kcal: (per100.kcal * g) / 100,
              protein: (per100.protein * g) / 100,
              carbs: (per100.carbs * g) / 100,
              fat: (per100.fat * g) / 100,
              fibre: (per100.fibre * g) / 100,
            },
            confidence: it.confidence,
            ref: it.ref ?? { kind: 'manual' },
            assumptions: it.assumptions,
          }),
        });
      }
    }
    return [...map.values()];
  }, [entries, userProducts]);

  const needle = q.trim().toLowerCase();
  const shownMeals = meals.filter((m) => !needle || m.title.toLowerCase().includes(needle));
  const shownItems = items.filter((i) => !needle || i.name.toLowerCase().includes(needle));

  function repeatMeal(e: FoodEntry) {
    setDraft({
      analysis: {
        title: e.title,
        items: e.items.map((i) => ({
          name: i.name,
          grams: Math.round(i.grams * i.scale),
          nutrients: {
            kcal: i.per.kcal * i.scale,
            protein: i.per.protein * i.scale,
            carbs: i.per.carbs * i.scale,
            fat: i.per.fat * i.scale,
            fibre: i.per.fibre * i.scale,
          },
          confidence: i.confidence,
          assumptions: i.assumptions ?? [],
        })),
        notes: `Logged again from ${formatDayLabel(e.dayKey, todayKey).toLowerCase()}. Adjust portions if today was different.`,
        overall_confidence: overallConfidence(e.items),
        needs_clarification: null,
      },
      source: 'quick_repeat',
      slot: suggestSlot(Date.now()),
      thumb: e.photoThumb,
    });
    nav('/log/review');
  }

  function reviewBasket() {
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
        notes: 'From your saved foods.',
        overall_confidence: overallConfidence(basket),
        needs_clarification: null,
      },
      source: 'manual',
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
        <h1 className="text-xl font-black flex-1">My foods</h1>
        {basket.length > 0 && (
          <button className="btn-primary py-2" onClick={reviewBasket}>
            Review {basket.length}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-full bg-sand-200 p-1">
        {(['meals', 'items'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`rounded-full py-2 text-sm font-bold transition ${tab === t ? 'bg-sand-50 shadow-soft' : 'text-bark-500'}`}
            onClick={() => setTab(t)}
          >
            {t === 'meals' ? `Recent meals (${meals.length})` : `Items (${items.length})`}
          </button>
        ))}
      </div>

      <input
        className="input"
        placeholder={tab === 'meals' ? 'Search your meals' : 'Search your items'}
        value={q}
        onChange={(e) => setQ(e.target.value)}
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

      {tab === 'meals' &&
        (shownMeals.length === 0 ? (
          <p className="text-sm text-bark-500 text-center py-6">
            Nothing logged yet. Once you have, every meal shows up here for one-tap repeats.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shownMeals.map((e) => {
              const n = sumItems(e.items);
              return (
                <li key={e.id}>
                  <button
                    className="card w-full flex items-center gap-3 text-left p-3 active:scale-[0.99] transition"
                    onClick={() => repeatMeal(e)}
                  >
                    <Thumb blob={e.photoThumb} source={e.source} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{e.title}</div>
                      <div className="text-xs text-bark-500">
                        {formatDayLabel(e.dayKey, todayKey)} · {e.items.length} item
                        {e.items.length === 1 ? '' : 's'} · P {Math.round(n.protein)} · C{' '}
                        {Math.round(n.carbs)} · F {Math.round(n.fat)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg">{Math.round(n.kcal)}</div>
                      <div className="text-[10px] text-bark-500 font-semibold">log again</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ))}

      {tab === 'items' &&
        (shownItems.length === 0 ? (
          <p className="text-sm text-bark-500 text-center py-6">
            Items you add by hand, label products you save from a barcode, and every ingredient
            Claude has itemised will collect here.
          </p>
        ) : (
          <ul className="card p-2 flex flex-col divide-y divide-sand-200">
            {shownItems.map((it) => (
              <li key={it.key}>
                <button
                  className="w-full text-left flex items-center gap-3 py-2 px-1"
                  onClick={() => setPicking(it)}
                >
                  <span className="text-lg" aria-hidden>
                    {it.origin === 'label' ? '🏷️' : it.origin === 'manual' ? '✋' : '🍽️'}
                  </span>
                  <span className="flex-1 text-sm truncate">{it.name}</span>
                  <span className="text-xs text-bark-500 shrink-0">
                    {Math.round(it.kcal100)} kcal/100g
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}

      <PortionPicker
        open={!!picking}
        name={picking?.name ?? ''}
        kcal100={picking?.kcal100 ?? 0}
        servingG={picking?.defaultGrams}
        onClose={() => setPicking(null)}
        onPick={(g) => {
          if (picking) setBasket((b) => [...b, picking.make(g)]);
          setPicking(null);
        }}
      />
    </div>
  );
}
