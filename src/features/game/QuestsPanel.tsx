import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { templateFor } from '@/lib/game/quests';
import { isoWeekKey, toDayKey } from '@/lib/date';
import { COINS, XP } from '@/lib/game/rules';

export function QuestsPanel() {
  const game = useLiveQuery(() => db.game.get('me'), []);
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  if (!game) return null;
  const todayKey = toDayKey(
    Date.now() + (settings?.timeOffsetMs ?? 0),
    settings?.dayStartHour ?? 4,
  );
  const week = isoWeekKey(todayKey);
  const daily = game.quests.filter((q) => q.period === 'daily' && q.periodKey === todayKey);
  const weekly = game.quests.filter((q) => q.period === 'weekly' && q.periodKey === week);

  const Row = ({ q }: { q: (typeof daily)[number] }) => {
    const t = templateFor(q);
    if (!t) return null;
    const done = !!q.completedAt;
    const pct = Math.round((q.progress / q.target) * 100);
    return (
      <li
        className={`flex items-center gap-3 rounded-xl px-3 py-2 ${done ? 'bg-euc-100' : 'bg-sand-100'}`}
      >
        <span className="text-xl" aria-hidden>
          {done ? '✅' : t.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold ${done ? 'line-through text-bark-500' : ''}`}>
            {t.title}
          </div>
          {q.target > 1 && !done && (
            <div className="h-1.5 rounded-full bg-sand-200 mt-1 overflow-hidden">
              <div className="h-full bg-euc-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <div className="text-[10px] font-bold text-bark-500 text-right">
          {q.target > 1 ? `${q.progress}/${q.target}` : ''}
          <div>
            +{q.period === 'daily' ? XP.dailyQuest : XP.weeklyQuest} XP ·{' '}
            {q.period === 'daily' ? COINS.dailyQuest : COINS.weeklyQuest}🪙
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="card flex flex-col gap-3">
      <div>
        <div className="font-black mb-2">Today's quests</div>
        {daily.length === 0 ? (
          <p className="text-sm text-bark-500">
            Quests roll each morning. Log something to kick things off.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {daily.map((q) => (
              <Row key={q.id} q={q} />
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="font-black mb-2">This week</div>
        <ul className="flex flex-col gap-1.5">
          {weekly.map((q) => (
            <Row key={q.id} q={q} />
          ))}
        </ul>
      </div>
    </div>
  );
}
