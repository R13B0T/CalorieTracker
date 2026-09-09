import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { Sheet } from '@/components/ui/Sheet';
import { NumberField } from '@/components/ui/NumberField';
import { Segmented } from '@/components/ui/Segmented';
import { estimateExercise } from '@/lib/ai/claudeClient';
import { describeAiError } from '@/lib/ai/errors';
import { logExercise } from '@/lib/db/repos/body';
import { announce } from '@/lib/game/announce';
import { toast } from '@/stores/useSessionStore';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { energyFromKcal, energyToKcal } from '@/lib/nutrition/units';
import type { EnergyUnit } from '@/lib/db/types';
import type { ExerciseEstimate } from '@/lib/ai/schemas';

const ENERGY_UNITS: { value: EnergyUnit; label: string }[] = [
  { value: 'kcal', label: 'Calories (kcal)' },
  { value: 'kJ', label: 'Kilojoules (kJ)' },
];

export function ExerciseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const latestWeight = useLiveQuery(() => db.weights.orderBy('at').last(), []);
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const [desc, setDesc] = useState('');
  const [burned, setBurned] = useState<number | ''>('');
  const [unit, setUnit] = useState<EnergyUnit>('kcal');
  const [minutes, setMinutes] = useState<number | ''>('');
  const [est, setEst] = useState<ExerciseEstimate | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && burned === '') setUnit(settings?.energyUnit ?? 'kcal');
  }, [open, settings?.energyUnit, burned]);

  async function ask() {
    if (!desc.trim()) return;
    setBusy(true);
    try {
      const estimate = await estimateExercise(desc, {
        weightKg: latestWeight?.kg ?? profile?.startWeightKg ?? 75,
        sex: profile?.sex ?? 'male',
      });
      setEst(estimate);
      setBurned(Math.round(energyFromKcal(estimate.kcal, unit)));
      setMinutes(Math.round(estimate.minutes));
    } catch (error) {
      toast(describeAiError(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  function changeUnit(next: EnergyUnit) {
    setBurned((value) =>
      typeof value === 'number'
        ? Math.round(energyFromKcal(energyToKcal(value, unit), next))
        : value,
    );
    setUnit(next);
  }

  async function save() {
    if (!desc.trim() || typeof burned !== 'number') return;
    const result = await logExercise(
      desc.trim(),
      energyToKcal(burned, unit),
      typeof minutes === 'number' ? minutes : undefined,
      est ? 'ai' : 'manual',
    );
    announce(result);
    setDesc('');
    setBurned('');
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
            onChange={(event) => setDesc(event.target.value)}
          />
        </div>
        {settings?.apiKey && (
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
        <div>
          <span className="label">Energy unit</span>
          <Segmented columns={2} value={unit} onChange={changeUnit} options={ENERGY_UNITS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Duration" value={minutes} onChange={setMinutes} unit="min" min={1} />
          <NumberField label="Burned" value={burned} onChange={setBurned} unit={unit} min={0} />
        </div>
        <p className="text-xs text-bark-500">
          Enter the number from your watch or gym equipment in either unit. Quokkal stores one
          canonical value, so changing units later will not change the workout.
        </p>
        <p className="text-xs text-bark-500">
          Honest note: trackers overstate exercise burn. By default Quokkal does not add it back to
          your food budget. Flip that in Settings if you want.
        </p>
        <button
          className="btn-primary"
          disabled={!desc.trim() || typeof burned !== 'number'}
          onClick={save}
        >
          Log exercise
        </button>
      </div>
    </Sheet>
  );
}
