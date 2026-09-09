import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { addWater } from '@/lib/db/repos/water';
import { announce } from '@/lib/game/announce';

export function WaterWidget({ dayKey }: { dayKey: string }) {
  const day = useLiveQuery(() => db.days.get(dayKey), [dayKey]);
  const goal = useLiveQuery(() => db.settings.get('me').then((s) => s?.waterGoalMl ?? 2000), [], 2000);
  const ml = day?.waterMl ?? 0;
  const pct = Math.min(100, Math.round((ml / goal) * 100));
  async function add(amount: number) {
    announce(await addWater(dayKey, amount));
  }
  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">💧 Water</span>
        <span className="text-xs text-bark-500 font-semibold">{(ml / 1000).toFixed(2)} / {(goal / 1000).toFixed(1)} L</span>
      </div>
      <div className="h-2 rounded-full bg-sky-100 overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-1">
        <button className="chip flex-1 justify-center bg-sky-100 text-sky-500" onClick={() => add(250)}>+250</button>
        <button className="chip flex-1 justify-center bg-sky-100 text-sky-500" onClick={() => add(500)}>+500</button>
        <button className="chip bg-sand-200 text-bark-500" onClick={() => add(-250)} aria-label="Remove 250 ml">−</button>
      </div>
    </div>
  );
}
