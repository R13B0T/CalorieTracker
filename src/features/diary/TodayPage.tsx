import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { formatDayLabel, shiftDayKey, toDayKey } from '@/lib/date';
import { sumEntries } from '@/lib/nutrition/totals';
import { KcalKj } from '@/components/ui/KcalKj';
import { MacroBar } from '@/components/ui/MacroBar';
import { KcalRing } from './KcalRing';
import { MealGroup } from './MealGroup';
import { WaterWidget } from './WaterWidget';
import { FastingWidget } from './FastingWidget';
import { PetGreeting } from '@/features/pet/PetGreeting';
import { StreakChip } from '@/features/game/StreakChip';
import type { MealSlot } from '@/lib/db/types';

const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function TodayPage() {
  const nav = useNavigate();
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const dayStartHour = settings?.dayStartHour ?? 4;
  const todayKey = toDayKey(Date.now() + (settings?.timeOffsetMs ?? 0), dayStartHour);
  const [offset, setOffset] = useState(0);
  const dayKey = shiftDayKey(todayKey, offset);

  const entries = useLiveQuery(() => db.entries.where('dayKey').equals(dayKey).sortBy('loggedAt'), [dayKey], []);
  const day = useLiveQuery(() => db.days.get(dayKey), [dayKey]);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const game = useLiveQuery(() => db.game.get('me'), []);

  const totals = useMemo(() => sumEntries(entries), [entries]);
  const targetKcal = (day?.targetKcal ?? profile?.targetKcal ?? 2000) + ((day?.eatBackExercise ?? settings?.eatBackExercise) ? day?.exerciseKcal ?? 0 : 0);
  const macros = day?.targetMacros ?? { protein: 0, carbs: 0, fat: 0, fibre: profile?.fibreG ?? 25 };
  const remaining = targetKcal - totals.kcal;

  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="btn-ghost px-2 py-1" onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">‹</button>
          <button className="font-black text-lg" onClick={() => setOffset(0)}>{formatDayLabel(dayKey, todayKey)}</button>
          <button className="btn-ghost px-2 py-1" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0} aria-label="Next day">›</button>
        </div>
        <div className="flex items-center gap-2">
          {game && <StreakChip streak={game.streak.current} freezes={game.streak.freezes} />}
          <Link to="/settings" className="btn-ghost px-2 py-1 text-xl" aria-label="Settings">⚙️</Link>
        </div>
      </header>

      {offset === 0 && <PetGreeting />}

      <section className="card flex items-center gap-4">
        <KcalRing eaten={totals.kcal} target={targetKcal} />
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-xs font-semibold text-bark-500 uppercase tracking-wide">{remaining >= 0 ? 'Remaining' : 'Over'}</div>
          <KcalKj kcal={Math.abs(remaining)} size="lg" className={remaining < 0 ? 'text-berry-500' : ''} />
          <div className="text-xs text-bark-500">
            {Math.round(totals.kcal).toLocaleString('en-AU')} eaten of {Math.round(targetKcal).toLocaleString('en-AU')}
            {day?.exerciseKcal ? ` (+${Math.round(day.exerciseKcal)} exercise${day.eatBackExercise ? '' : ', not eaten back'})` : ''}
          </div>
        </div>
      </section>

      <section className="card grid grid-cols-2 gap-x-4 gap-y-3">
        <MacroBar label="Protein" value={totals.protein} target={macros.protein} colour="var(--color-protein)" />
        <MacroBar label="Carbs" value={totals.carbs} target={macros.carbs} colour="var(--color-carbs)" />
        <MacroBar label="Fat" value={totals.fat} target={macros.fat} colour="var(--color-fat)" />
        <MacroBar label="Fibre" value={totals.fibre} target={macros.fibre} colour="var(--color-fibre)" />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <WaterWidget dayKey={dayKey} />
        <FastingWidget />
      </div>

      {entries.length === 0 ? (
        <div className="card text-center flex flex-col items-center gap-3 py-8">
          <div className="text-4xl">🍽️</div>
          <div className="font-bold">Nothing logged {offset === 0 ? 'yet today' : 'this day'}</div>
          {offset === 0 && (
            <>
              <p className="text-sm text-bark-500">Photo, words, voice, barcode or search. Your call.</p>
              <button className="btn-primary" onClick={() => nav('/log')}>Log something</button>
            </>
          )}
        </div>
      ) : (
        SLOT_ORDER.map((slot) => {
          const list = entries.filter((e) => e.slot === slot);
          if (!list.length) return null;
          return <MealGroup key={slot} slot={slot} entries={list} />;
        })
      )}
      <div className="h-4" />
    </div>
  );
}
