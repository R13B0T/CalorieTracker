import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { Sheet } from '@/components/ui/Sheet';
import { NumberField } from '@/components/ui/NumberField';
import { estimateExercise } from '@/lib/ai/claudeClient';
import { describeAiError } from '@/lib/ai/errors';
import { logExercise } from '@/lib/db/repos/body';
import { announce } from '@/lib/game/announce';
import { toast } from '@/stores/useSessionStore';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import type { ExerciseEstimate } from '@/lib/ai/schemas';

export function ExerciseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const latestWeight = useLiveQuery(() => db.weights.orderBy('at').last(), []);
  const hasKey = useLiveQuery(() => db.settings.get('me').then((s) => !!s?.apiKey), [], false);
  const [desc, setDesc] = useState('');
  const [kcal, setKcal] = useState<number | ''>('');
  const [minutes, setMinutes] = useState<number | ''>('');
  const [est, setEst] = useState<ExerciseEstimate | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!desc.trim()) return;
    setBusy(true);
    try {
      const e = await estimateExercise(desc, {
        weightKg: latestWeight?.kg ?? profile?.startWeightKg ?? 75,
        sex: profile?.sex ?? 'male',
      });
      setEst(e);
      setKcal(Math.round(e.kcal));
      setMinutes(Math.round(e.minutes));
    } catch (err) {
      toast(describeAiError(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!desc.trim() || typeof kcal !== 'number') return;
    const res = await logExercise(
      desc.trim(),
      kcal,
      typeof minutes === 'number' ? minutes : undefined,
      est ? 'ai' : 'manual',
    );
    announce(res);
    setDesc('');
    setKcal('');
    setMinutes('');
    setEst(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log exercise">
      <div className="flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="ex-desc">
            What did you do?
          </label>
          <input
            id="ex-desc"
            className="input"
            placeholder="45 min gym, moderate. 5 km run in 28 min."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        {hasKey && (
          <button className="btn-secondary" disabled={!desc.trim() || busy} onClick={ask}>
            {busy ? 'Estimating…' : 'Estimate with Claude'}
          </button>
        )}
        {est && (
          <div className="rounded-xl bg-sand-100 px-3 py-2 text-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 font-bold">
              {est.activity} <ConfidenceBadge level={est.confidence} />
            </div>
            <div className="text-xs text-bark-500">
              MET {est.met} · {est.notes}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Duration" value={minutes} onChange={setMinutes} unit="min" min={1} />
          <NumberField label="Burned" value={kcal} onChange={setKcal} unit="kcal" min={0} />
        </div>
        <p className="text-xs text-bark-500">
          Honest note: trackers overstate exercise burn. By default Quokkal does not add it back to
          your food budget. Flip that in Settings if you want.
        </p>
        <button
          className="btn-primary"
          disabled={!desc.trim() || typeof kcal !== 'number'}
          onClick={save}
        >
          Log exercise
        </button>
      </div>
    </Sheet>
  );
}
