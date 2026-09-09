import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { NumberField } from '@/components/ui/NumberField';
import { WeightChart } from './WeightChart';
import { ExerciseSheet } from './ExerciseSheet';
import { weightTrend } from '@/lib/nutrition/trend';
import { applyRecalibration, deleteExercise, deleteWeight, dismissRecalibration, logWeight, recalibrationSuggestion } from '@/lib/db/repos/body';
import { announce } from '@/lib/game/announce';
import { toast } from '@/stores/useSessionStore';
import { formatDayLabel, formatTime, toDayKey } from '@/lib/date';
import type { RecalibrationSuggestion } from '@/lib/nutrition/recalibration';
import { RECAL } from '@/lib/nutrition/recalibration';

export default function BodyPage() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const weights = useLiveQuery(() => db.weights.orderBy('at').toArray(), [], []);
  const todayKey = toDayKey(Date.now() + (settings?.timeOffsetMs ?? 0), settings?.dayStartHour ?? 4);
  const exercise = useLiveQuery(() => db.exercise.where('dayKey').equals(todayKey).sortBy('at'), [todayKey], []);
  const fasts = useLiveQuery(() => db.fasting.orderBy('startedAt').reverse().limit(5).toArray(), [], []);
  const [kg, setKg] = useState<number | ''>('');
  const [exOpen, setExOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<RecalibrationSuggestion | null>(null);

  useEffect(() => {
    recalibrationSuggestion().then(setSuggestion).catch(() => undefined);
  }, [weights.length, profile?.lastRecalibratedAt]);

  const trend = weightTrend(weights);
  const latest = weights[weights.length - 1];
  const rate = trend.length >= 8 ? ((trend[trend.length - 1].trend - trend[trend.length - 8].trend) / 7) * 7 : null;

  async function save() {
    if (typeof kg !== 'number' || kg < 30 || kg > 400) return;
    announce(await logWeight(kg));
    setKg('');
  }

  const daysUntilRecal = profile ? Math.max(0, Math.ceil(RECAL.minDays - (Date.now() - (profile.lastRecalibratedAt ?? profile.createdAt)) / 86_400_000)) : null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <h1 className="text-2xl font-black">Body</h1>

      {suggestion && (
        <div className="card border-2 border-sun-500 flex flex-col gap-2">
          <div className="font-black">📐 Time to recalibrate</div>
          <p className="text-sm text-bark-700">
            Over the last {suggestion.windowDays} days you logged {suggestion.adherencePct}% of days. Expected change {suggestion.expectedDeltaKg.toFixed(1)} kg, actual {suggestion.actualDeltaKg.toFixed(1)} kg.
            That suggests your maintenance is closer to <b>{suggestion.newTdee.toLocaleString('en-AU')} kcal</b>.
          </p>
          <p className="text-sm text-bark-700">New daily target: <b>{suggestion.newTargetKcal.toLocaleString('en-AU')} kcal</b> ({suggestion.adjustmentKcal > 0 ? '+' : ''}{suggestion.adjustmentKcal}).</p>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={async () => { await applyRecalibration(suggestion); setSuggestion(null); toast('Target updated', 'reward', '📐'); }}>Apply</button>
            <button className="btn-ghost" onClick={async () => { await dismissRecalibration(); setSuggestion(null); }}>Not now</button>
          </div>
        </div>
      )}

      <section className="card flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold text-bark-500 uppercase tracking-wide">Weight</div>
            <div className="text-3xl font-black">{latest ? `${latest.kg.toFixed(1)} kg` : '—'}</div>
            {rate !== null && <div className="text-xs text-bark-500">Trend {rate > 0 ? '+' : ''}{rate.toFixed(2)} kg/week</div>}
          </div>
          <div className="flex items-end gap-2">
            <div className="w-28"><NumberField label="Today" value={kg} onChange={setKg} unit="kg" step={0.1} min={30} max={400} placeholder={latest ? latest.kg.toFixed(1) : '80.0'} /></div>
            <button className="btn-primary py-3" disabled={typeof kg !== 'number'} onClick={save}>Log</button>
          </div>
        </div>
        <WeightChart points={trend.slice(-60)} />
        {profile && !suggestion && daysUntilRecal !== null && (
          <p className="text-xs text-bark-500">
            {daysUntilRecal > 0 ? `Recalibration check in ${daysUntilRecal} day${daysUntilRecal === 1 ? '' : 's'}. Keep weighing in and logging.` : 'Recalibration needs 6+ weigh-ins and 70% of days logged in the window.'}
          </p>
        )}
        {weights.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-bark-700 font-semibold">Recent weigh-ins</summary>
            <ul className="mt-2 flex flex-col gap-1">
              {[...weights].reverse().slice(0, 10).map((w) => (
                <li key={w.id} className="flex justify-between items-center">
                  <span className="text-bark-700">{formatDayLabel(w.dayKey, todayKey)} · {formatTime(w.at)}</span>
                  <span className="font-bold">{w.kg.toFixed(1)} kg <button className="text-berry-500 text-xs ml-2" onClick={() => deleteWeight(w.id)} aria-label="Delete weigh-in">✕</button></span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="font-black">🏃 Exercise today</div>
          <button className="btn-secondary py-2 text-sm" onClick={() => setExOpen(true)}>+ Log</button>
        </div>
        {exercise.length === 0 ? (
          <p className="text-sm text-bark-500">Nothing yet. Rest days are allowed, you know.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {exercise.map((e) => (
              <li key={e.id} className="flex justify-between items-center">
                <span className="truncate">{e.description}{e.minutes ? ` · ${e.minutes} min` : ''}</span>
                <span className="font-bold">{Math.round(e.kcal)} kcal <button className="text-berry-500 text-xs ml-2" onClick={() => deleteExercise(e.id)} aria-label="Delete">✕</button></span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-bark-500">{settings?.eatBackExercise ? 'Exercise is added to your food budget.' : 'Exercise is tracked but not added to your food budget (Settings to change).'}</p>
      </section>

      <section className="card flex flex-col gap-2">
        <div className="font-black">⏳ Fasting history</div>
        {fasts.length === 0 ? (
          <p className="text-sm text-bark-500">Start a fast from Today. Default window is {settings?.fastingDefaultHours ?? 16} hours.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {fasts.map((f) => {
              const end = f.endedAt ?? Date.now();
              const h = (end - f.startedAt) / 3_600_000;
              return (
                <li key={f.id} className="flex justify-between">
                  <span className="text-bark-700">{new Date(f.startedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · {f.endedAt ? `${h.toFixed(1)} h` : 'in progress'}</span>
                  <span className={`font-bold ${f.completed ? 'text-euc-700' : 'text-bark-500'}`}>{f.endedAt ? (f.completed ? 'Completed' : 'Ended early') : `${h.toFixed(1)} / ${f.targetHours} h`}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <div className="h-4" />
      <ExerciseSheet open={exOpen} onClose={() => setExOpen(false)} />
    </div>
  );
}
