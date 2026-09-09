import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Segmented } from '@/components/ui/Segmented';
import { NumberField } from '@/components/ui/NumberField';
import { ACTIVITY_LABELS, RATE_OPTIONS } from '@/lib/nutrition/tdee';
import { PERSONAS } from '@/lib/ai/personas';
import { buildProfile, completeOnboarding, type OnboardingInput } from '@/lib/db/seed';
import { fmtKj } from '@/lib/nutrition/units';
import type { Activity, Goal, Persona, Sex } from '@/lib/db/types';
import { ApiKeyStep } from './steps/ApiKeyStep';
import { QuokkaSprite } from '@/features/pet/QuokkaSprite';

type Step = 'welcome' | 'you' | 'activity' | 'goal' | 'persona' | 'pet' | 'key' | 'summary';
const ORDER: Step[] = ['welcome', 'you', 'activity', 'goal', 'persona', 'pet', 'key', 'summary'];

export default function OnboardingWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [rate, setRate] = useState<number>(0.5);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [petName, setPetName] = useState('Pip');
  const [apiKey, setApiKey] = useState('');
  const [keyVerified, setKeyVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  const idx = ORDER.indexOf(step);
  const next = () => setStep(ORDER[Math.min(idx + 1, ORDER.length - 1)]);
  const back = () => setStep(ORDER[Math.max(idx - 1, 0)]);

  const thisYear = new Date().getFullYear();
  const youValid =
    sex !== null &&
    typeof birthYear === 'number' && birthYear >= thisYear - 100 && birthYear <= thisYear - 13 &&
    typeof heightCm === 'number' && heightCm >= 120 && heightCm <= 230 &&
    typeof weightKg === 'number' && weightKg >= 35 && weightKg <= 300;

  const input: OnboardingInput | null = useMemo(() => {
    if (!youValid || !activity || !goal || !persona) return null;
    return {
      name,
      sex: sex!,
      birthYear: birthYear as number,
      heightCm: heightCm as number,
      weightKg: weightKg as number,
      activity,
      goal,
      rateKgPerWeek: goal === 'maintain' ? 0 : rate,
      persona,
      petName,
      apiKey: apiKey || undefined,
    };
  }, [youValid, activity, goal, persona, name, sex, birthYear, heightCm, weightKg, rate, petName, apiKey]);

  const preview = input ? buildProfile(input) : null;

  async function finish() {
    if (!input) return;
    setSaving(true);
    try {
      await completeOnboarding(input);
      nav('/', { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto px-5 pt-6 pb-8 safe-top safe-bottom">
      <div className="flex items-center gap-2 mb-4">
        {idx > 0 && (
          <button className="btn-ghost -ml-3 px-3" onClick={back} aria-label="Back">
            ←
          </button>
        )}
        <div className="flex-1 flex gap-1">
          {ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-euc-500' : 'bg-sand-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 'welcome' && (
          <div className="text-center flex flex-col items-center gap-4 pt-6">
            <div className="animate-bob">
              <QuokkaSprite stage="joey" mood="happy" size={180} />
            </div>
            <h1 className="text-3xl font-black">Quokkal</h1>
            <p className="text-bark-700">
              Snap, describe or scan your food. Claude works out the numbers, you keep the pet fed,
              and nobody gets a lecture.
            </p>
            <p className="text-xs text-bark-500">
              Everything stays on this device. You bring your own Claude API key so there's no
              subscription.
            </p>
          </div>
        )}

        {step === 'you' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black">About you</h2>
            <p className="text-sm text-bark-700">
              These feed the Mifflin-St Jeor equation, which is as good as it gets without a lab.
            </p>
            <div>
              <label className="label" htmlFor="name">
                What should the quokka call you?
              </label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chris"
                autoComplete="given-name"
              />
            </div>
            <div>
              <span className="label">Sex (for the equation only)</span>
              <Segmented
                value={sex}
                onChange={setSex}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                ]}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Birth year" value={birthYear} onChange={setBirthYear} min={thisYear - 100} max={thisYear - 13} placeholder="1990" />
              <NumberField label="Height" value={heightCm} onChange={setHeightCm} unit="cm" min={120} max={230} placeholder="175" />
              <NumberField label="Weight" value={weightKg} onChange={setWeightKg} unit="kg" min={35} max={300} step={0.1} placeholder="80" />
            </div>
          </div>
        )}

        {step === 'activity' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black">How active are you?</h2>
            <p className="text-sm text-bark-700">
              Be honest. Most people pick one level too high, then wonder why the numbers don't work.
            </p>
            <Segmented
              columns={1}
              value={activity}
              onChange={setActivity}
              options={(Object.keys(ACTIVITY_LABELS) as Activity[]).map((k) => ({
                value: k,
                label: ACTIVITY_LABELS[k].label,
                hint: ACTIVITY_LABELS[k].hint,
              }))}
            />
          </div>
        )}

        {step === 'goal' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black">What's the goal?</h2>
            <Segmented
              columns={3}
              value={goal}
              onChange={(g) => {
                setGoal(g);
                setRate(RATE_OPTIONS[g][Math.min(1, RATE_OPTIONS[g].length - 1)].value);
              }}
              options={[
                { value: 'lose', label: 'Lose', emoji: '📉' },
                { value: 'maintain', label: 'Maintain', emoji: '⚖️' },
                { value: 'gain', label: 'Gain', emoji: '📈' },
              ]}
            />
            {goal && goal !== 'maintain' && (
              <div>
                <span className="label">How fast?</span>
                <Segmented
                  columns={1}
                  value={String(rate) as string}
                  onChange={(v) => setRate(Number(v))}
                  options={RATE_OPTIONS[goal].map((r) => ({
                    value: String(r.value),
                    label: r.label,
                    hint: r.hint,
                  }))}
                />
              </div>
            )}
          </div>
        )}

        {step === 'persona' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black">Pick your quokka's personality</h2>
            <p className="text-sm text-bark-700">
              This shapes how it talks to you. Change it any time in Settings. None of them will
              ever shame you about food, that's a hard rule.
            </p>
            <Segmented
              columns={1}
              value={persona}
              onChange={setPersona}
              options={(Object.keys(PERSONAS) as Persona[]).map((k) => ({
                value: k,
                label: PERSONAS[k].name,
                hint: `${PERSONAS[k].tagline} "${PERSONAS[k].lines.greeting[0]}"`,
                emoji: PERSONAS[k].emoji,
              }))}
            />
          </div>
        )}

        {step === 'pet' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-black">Name your quokka</h2>
            <QuokkaSprite stage="joey" mood="ecstatic" size={160} />
            <input
              className="input text-center text-xl font-bold max-w-xs"
              value={petName}
              maxLength={16}
              onChange={(e) => setPetName(e.target.value)}
            />
            <p className="text-sm text-bark-700">
              It starts as a joey, grows up at level 10 and becomes a legend at 25. It gets
              happier when you log, and misses you when you don't. It never judges what you ate.
            </p>
          </div>
        )}

        {step === 'key' && (
          <ApiKeyStep
            value={apiKey}
            onChange={(v) => {
              setApiKey(v);
              setKeyVerified(false);
            }}
            verified={keyVerified}
            onVerified={() => setKeyVerified(true)}
          />
        )}

        {step === 'summary' && preview && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black">Your plan</h2>
            <div className="card flex flex-col gap-3">
              <Row label="Estimated maintenance" value={`${preview.tdee.toLocaleString('en-AU')} kcal`} sub={fmtKj(preview.tdee)} />
              <Row label="Daily target" value={`${preview.targetKcal.toLocaleString('en-AU')} kcal`} sub={fmtKj(preview.targetKcal)} strong />
              <Row
                label="Macros"
                value={`${preview.macroSplit.proteinPct}% protein, ${preview.macroSplit.carbsPct}% carbs, ${preview.macroSplit.fatPct}% fat`}
                sub={`Fibre ${preview.fibreG} g`}
              />
            </div>
            <p className="text-sm text-bark-700">
              This is a starting estimate. After a couple of weeks of weigh-ins Quokkal compares
              expected versus actual change and suggests a correction. That's how it gets accurate.
            </p>
            <p className="text-xs text-bark-500">
              Targets can be edited in Settings. If a health professional has given you numbers, use
              theirs.
            </p>
          </div>
        )}
      </div>

      <div className="pt-4">
        {step === 'summary' ? (
          <button className="btn-primary w-full text-lg" disabled={!input || saving} onClick={finish}>
            {saving ? 'Setting up…' : "Let's go"}
          </button>
        ) : (
          <button
            className="btn-primary w-full text-lg"
            onClick={next}
            disabled={
              (step === 'you' && !youValid) ||
              (step === 'activity' && !activity) ||
              (step === 'goal' && !goal) ||
              (step === 'persona' && !persona) ||
              (step === 'pet' && !petName.trim())
            }
          >
            {step === 'welcome' ? 'Get started' : step === 'key' && !apiKey ? 'Skip for now' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-bark-700">{label}</span>
      <span className="text-right">
        <span className={`block ${strong ? 'text-xl font-black text-euc-700' : 'font-bold'}`}>{value}</span>
        {sub && <span className="block text-xs text-bark-500">{sub}</span>}
      </span>
    </div>
  );
}
