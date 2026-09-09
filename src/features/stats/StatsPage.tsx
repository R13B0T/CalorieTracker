import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { dayKeyRange, shiftDayKey, toDayKey } from '@/lib/date';
import { sumEntries } from '@/lib/nutrition/totals';
import { weightTrend } from '@/lib/nutrition/trend';
import { WeightChart } from '@/features/body/WeightChart';
import { KcalKj } from '@/components/ui/KcalKj';

export default function StatsPage() {
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const [range, setRange] = useState<7 | 30>(7);
  const todayKey = toDayKey(
    Date.now() + (settings?.timeOffsetMs ?? 0),
    settings?.dayStartHour ?? 4,
  );
  const fromKey = shiftDayKey(todayKey, -(range - 1));
  const keys = useMemo(() => dayKeyRange(fromKey, todayKey), [fromKey, todayKey]);
  const entries = useLiveQuery(() => db.entries.where('dayKey').anyOf(keys).toArray(), [keys], []);
  const days = useLiveQuery(() => db.days.where('dayKey').anyOf(keys).toArray(), [keys], []);
  const weights = useLiveQuery(() => db.weights.orderBy('at').toArray(), [], []);
  const heat = useLiveQuery(
    () =>
      db.entries
        .where('dayKey')
        .anyOf(dayKeyRange(shiftDayKey(todayKey, -83), todayKey))
        .toArray(),
    [todayKey],
    [],
  );

  const perDay = keys.map((k) => {
    const list = entries.filter((e) => e.dayKey === k);
    const t = sumEntries(list);
    const d = days.find((x) => x.dayKey === k);
    return {
      key: k,
      ...t,
      target: d?.targetKcal ?? profile?.targetKcal ?? 0,
      logged: list.length > 0,
    };
  });
  const loggedDays = perDay.filter((d) => d.logged);
  const avg = (f: (d: (typeof perDay)[number]) => number) =>
    loggedDays.length ? loggedDays.reduce((a, d) => a + f(d), 0) / loggedDays.length : 0;
  const maxKcal = Math.max(1, ...perDay.map((d) => Math.max(d.kcal, d.target)));
  const withinCount = loggedDays.filter(
    (d) => d.target && Math.abs(d.kcal - d.target) <= d.target * 0.1,
  ).length;
  const heatKeys = dayKeyRange(shiftDayKey(todayKey, -83), todayKey);
  const heatCount = new Map<string, number>();
  for (const e of heat) heatCount.set(e.dayKey, (heatCount.get(e.dayKey) ?? 0) + 1);

  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Stats</h1>
        <div className="flex gap-1">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              className={`chip ${range === r ? 'bg-euc-500 text-white' : 'bg-sand-200 text-bark-700'}`}
              onClick={() => setRange(r)}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <section className="card flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold text-bark-500 uppercase tracking-wide">
              Average intake ({loggedDays.length} logged days)
            </div>
            <KcalKj kcal={avg((d) => d.kcal)} size="lg" />
          </div>
          <div className="text-right text-xs text-bark-500">
            <div>
              Within 10% on <b className="text-bark-900">{withinCount}</b> days
            </div>
            <div>Target avg {Math.round(avg((d) => d.target)).toLocaleString('en-AU')} kcal</div>
          </div>
        </div>
        <div
          className="flex items-end gap-[3px] h-32"
          role="img"
          aria-label="Daily calories versus target"
        >
          {perDay.map((d) => (
            <div
              key={d.key}
              className="flex-1 flex flex-col justify-end h-full relative"
              title={`${d.key}: ${Math.round(d.kcal)} / ${Math.round(d.target)} kcal`}
            >
              {d.target > 0 && (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-bark-300"
                  style={{ bottom: `${(d.target / maxKcal) * 100}%` }}
                />
              )}
              <div
                className={`rounded-t ${d.kcal > d.target * 1.1 ? 'bg-berry-500' : d.kcal >= d.target * 0.9 ? 'bg-euc-500' : 'bg-euc-300'}`}
                style={{ height: `${(d.kcal / maxKcal) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-bark-500">
          <span>{fromKey}</span>
          <span>{todayKey}</span>
        </div>
      </section>

      <section className="card grid grid-cols-4 gap-2 text-center">
        {[
          ['Protein', avg((d) => d.protein), 'var(--color-protein)'],
          ['Carbs', avg((d) => d.carbs), 'var(--color-carbs)'],
          ['Fat', avg((d) => d.fat), 'var(--color-fat)'],
          ['Fibre', avg((d) => d.fibre), 'var(--color-fibre)'],
        ].map(([label, v, c]) => (
          <div key={label as string}>
            <div className="text-xl font-black" style={{ color: c as string }}>
              {Math.round(v as number)}g
            </div>
            <div className="text-[10px] font-semibold text-bark-500">{label as string} / day</div>
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-2">
        <div className="font-black">Weight trend</div>
        <WeightChart points={weightTrend(weights).slice(-90)} />
      </section>

      <section className="card flex flex-col gap-2">
        <div className="font-black">Logging, last 12 weeks</div>
        <div
          className="grid grid-flow-col grid-rows-7 gap-1"
          style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
          role="img"
          aria-label="Logging heatmap"
        >
          {heatKeys.map((k) => {
            const c = heatCount.get(k) ?? 0;
            const cls =
              c === 0
                ? 'bg-sand-200'
                : c === 1
                  ? 'bg-euc-300'
                  : c === 2
                    ? 'bg-euc-500'
                    : 'bg-euc-700';
            return (
              <div
                key={k}
                className={`aspect-square rounded-sm ${cls}`}
                title={`${k}: ${c} logs`}
              />
            );
          })}
        </div>
      </section>
      <div className="h-4" />
    </div>
  );
}
