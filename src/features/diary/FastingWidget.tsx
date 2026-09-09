import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { endFast, startFast } from '@/lib/db/repos/fasting';
import { announce } from '@/lib/game/announce';
import { toast } from '@/stores/useSessionStore';

export function FastingWidget() {
  const active = useLiveQuery(() => db.fasting.filter((f) => f.endedAt === undefined).first(), []);
  const target = useLiveQuery(
    () => db.settings.get('me').then((s) => s?.fastingDefaultHours ?? 16),
    [],
    16,
  );
  const [, tick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => tick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, [active]);

  const hours = active ? (Date.now() - active.startedAt) / 3_600_000 : 0;
  const pct = active ? Math.min(100, Math.round((hours / active.targetHours) * 100)) : 0;

  async function stop() {
    const r = await endFast();
    if (!r) return;
    if (r.session.completed) announce(r.result);
    else toast(`Fast ended at ${hours.toFixed(1)} h. Still counts as practice.`, 'info', '⏳');
  }

  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">⏳ Fasting</span>
        <span className="text-xs text-bark-500 font-semibold">
          {active ? `${hours.toFixed(1)} / ${active.targetHours} h` : `${target} h window`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-sand-200 overflow-hidden">
        <div className="h-full bg-fat rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {active ? (
        <button className="chip justify-center bg-fat/20 text-fat" onClick={stop}>
          {pct >= 100 ? 'Finish fast ✓' : 'End fast'}
        </button>
      ) : (
        <button
          className="chip justify-center bg-sand-200 text-bark-700"
          onClick={() => startFast(target)}
        >
          Start fast
        </button>
      )}
    </div>
  );
}
