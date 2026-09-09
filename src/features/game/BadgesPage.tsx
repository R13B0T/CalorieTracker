import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { BADGES } from '@/data/badges';

export default function BadgesPage() {
  const nav = useNavigate();
  const game = useLiveQuery(() => db.game.get('me'), []);
  if (!game) return null;
  const earned = new Map(game.badges.map((b) => [b.id, b.earnedAt]));
  const counters: Record<string, number> = { ...game.counters, bestStreak: game.streak.best };
  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">←</button>
        <h1 className="text-2xl font-black">Badges</h1>
        <span className="chip bg-sand-200 text-bark-700 ml-auto">{earned.size} / {BADGES.length}</span>
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {BADGES.map((b) => {
          const got = earned.get(b.id);
          const progress = Math.min(b.threshold, counters[b.counter] ?? 0);
          return (
            <li key={b.id} className={`card flex flex-col gap-1 ${got ? '' : 'opacity-70'}`}>
              <div className={`text-3xl ${got ? '' : 'grayscale'}`} aria-hidden>{b.emoji}</div>
              <div className="font-black text-sm">{b.name}</div>
              <div className="text-xs text-bark-500">{b.desc}</div>
              {got ? (
                <div className="text-[10px] text-euc-700 font-bold">Earned {new Date(got).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
              ) : (
                <div className="text-[10px] text-bark-500 font-bold">{progress} / {b.threshold} · +{b.coins}🪙</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="h-4" />
    </div>
  );
}
