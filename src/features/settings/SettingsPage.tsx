import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { updateSettings } from '@/lib/db/repos/settings';
import { setTargets } from '@/lib/db/repos/body';
import { ApiKeyStep } from '@/features/onboarding/steps/ApiKeyStep';
import { KNOWN_MODELS } from '@/lib/ai/models';
import { PERSONAS } from '@/lib/ai/personas';
import { Segmented } from '@/components/ui/Segmented';
import { NumberField } from '@/components/ui/NumberField';
import { Sheet } from '@/components/ui/Sheet';
import { APP_VERSION, BUILD_DATE, checkForUpdates } from '@/lib/pwa/UpdatePrompt';
import { AFCD_ATTRIBUTION } from '@/lib/food/afcd';
import {
  exportAll,
  importAll,
  parseExport,
  shareOrDownload,
  wipeAll,
} from '@/lib/export/exportImport';
import { toast } from '@/stores/useSessionStore';
import { macroGrams } from '@/lib/nutrition/tdee';
import { isStandalone, promptInstall } from '@/lib/pwa/InstallHint';
import type { Persona } from '@/lib/db/types';
import { COINS } from '@/lib/game/rules';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-3">
      <h2 className="font-black">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span>
        <span className="block font-semibold text-sm">{label}</span>
        {hint && <span className="block text-xs text-bark-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition ${value ? 'bg-euc-500' : 'bg-sand-300'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`}
        />
      </button>
    </label>
  );
}

function KeyCard() {
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const [value, setValue] = useState('');
  const [verified, setVerified] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  useEffect(() => {
    if (settings?.apiKey) setValue(settings.apiKey);
  }, [settings?.apiKey]);
  async function save() {
    await updateSettings({ apiKey: value.trim() || undefined });
    toast(value.trim() ? 'Key saved' : 'Key removed', 'info', '🔑');
  }
  return (
    <Section title="Claude API key">
      <ApiKeyStep
        compact
        value={value}
        onChange={(v) => {
          setValue(v);
          setVerified(false);
        }}
        verified={verified}
        onVerified={(m) => {
          setVerified(true);
          setModels(m);
        }}
      />
      <button
        className="btn-primary"
        onClick={save}
        disabled={value.trim() === (settings?.apiKey ?? '')}
      >
        Save key
      </button>
      {models.length > 0 && (
        <p className="text-xs text-bark-500">
          Models visible to this key:{' '}
          {models
            .filter((m) => m.startsWith('claude'))
            .slice(0, 8)
            .join(', ')}
        </p>
      )}
    </Section>
  );
}

function ModelPicker() {
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  if (!settings) return null;
  const options = KNOWN_MODELS.map((m) => ({ value: m.id, label: m.label, hint: m.hint }));
  return (
    <Section title="Which Claude does what">
      <div>
        <span className="label">Photo analysis</span>
        <Segmented
          columns={2}
          value={settings.visionModel}
          onChange={(v) => updateSettings({ visionModel: v })}
          options={options}
        />
      </div>
      <div>
        <span className="label">Text, voice and coach lines</span>
        <Segmented
          columns={2}
          value={settings.textModel}
          onChange={(v) => updateSettings({ textModel: v })}
          options={options}
        />
      </div>
    </Section>
  );
}

function PersonaCard() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const game = useLiveQuery(() => db.game.get('me'), []);
  const [name, setName] = useState('');
  useEffect(() => {
    if (game) setName(game.pet.name);
  }, [game?.pet.name]);
  if (!profile || !game) return null;
  return (
    <Section title="Quokka">
      <Segmented
        columns={1}
        value={profile.persona}
        onChange={(p: Persona) => db.profile.update('me', { persona: p })}
        options={(Object.keys(PERSONAS) as Persona[]).map((k) => ({
          value: k,
          label: PERSONAS[k].name,
          hint: PERSONAS[k].tagline,
          emoji: PERSONAS[k].emoji,
        }))}
      />
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          className="btn-secondary"
          disabled={name.trim() === game.pet.name || !name.trim()}
          onClick={async () => {
            if (game.counters.renames && game.coins < COINS.renamePrice)
              return toast(`Renaming again costs ${COINS.renamePrice} coins.`, 'info', '🪙');
            await db.game.update('me', {
              'pet.name': name.trim(),
              coins: game.counters.renames ? game.coins - COINS.renamePrice : game.coins,
              'counters.renames': (game.counters.renames ?? 0) + 1,
            });
            toast('Renamed', 'info', '🐾');
          }}
        >
          Rename{game.counters.renames ? ` (${COINS.renamePrice}🪙)` : ''}
        </button>
      </div>
    </Section>
  );
}

function TargetsCard() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const [kcal, setKcal] = useState<number | ''>('');
  const [p, setP] = useState<number | ''>('');
  const [f, setF] = useState<number | ''>('');
  const [fibre, setFibre] = useState<number | ''>('');
  useEffect(() => {
    if (!profile) return;
    setKcal(profile.targetKcal);
    setP(profile.macroSplit.proteinPct);
    setF(profile.macroSplit.fatPct);
    setFibre(profile.fibreG);
  }, [
    profile?.targetKcal,
    profile?.macroSplit.proteinPct,
    profile?.macroSplit.fatPct,
    profile?.fibreG,
    profile,
  ]);
  if (!profile) return null;
  const carbs =
    typeof p === 'number' && typeof f === 'number' ? 100 - p - f : profile.macroSplit.carbsPct;
  const grams =
    typeof kcal === 'number' && typeof p === 'number' && typeof f === 'number' && carbs >= 0
      ? macroGrams(kcal, { proteinPct: p, carbsPct: carbs, fatPct: f })
      : null;
  const valid =
    typeof kcal === 'number' &&
    kcal >= 1000 &&
    kcal <= 6000 &&
    typeof p === 'number' &&
    typeof f === 'number' &&
    carbs >= 5 &&
    p >= 10 &&
    f >= 15;
  return (
    <Section title="Targets">
      <p className="text-xs text-bark-500">
        Maintenance estimate {profile.tdee.toLocaleString('en-AU')} kcal. Recalibration from real
        weigh-ins happens on the Body tab. Edit here if a professional gave you numbers.
      </p>
      <NumberField
        label="Daily calories"
        value={kcal}
        onChange={setKcal}
        unit="kcal"
        min={1000}
        max={6000}
        step={10}
      />
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Protein" value={p} onChange={setP} unit="%" min={10} max={60} />
        <NumberField label="Fat" value={f} onChange={setF} unit="%" min={15} max={60} />
        <div>
          <span className="label">Carbs</span>
          <div className="input bg-sand-100">{carbs}%</div>
        </div>
      </div>
      <NumberField label="Fibre" value={fibre} onChange={setFibre} unit="g" min={10} max={80} />
      {grams && (
        <p className="text-xs text-bark-500">
          = {grams.protein} g protein, {grams.carbs} g carbs, {grams.fat} g fat per day.
        </p>
      )}
      <button
        className="btn-primary"
        disabled={!valid}
        onClick={async () => {
          await setTargets({
            targetKcal: kcal as number,
            macroSplit: { proteinPct: p as number, carbsPct: carbs, fatPct: f as number },
            fibreG: Number(fibre) || profile.fibreG,
          });
          toast('Targets updated', 'info', '🎯');
        }}
      >
        Save targets
      </button>
    </Section>
  );
}

function PrefsCard() {
  const s = useLiveQuery(() => db.settings.get('me'), []);
  if (!s) return null;
  return (
    <Section title="Preferences">
      <Toggle
        label="Show kilojoules"
        hint="Alongside kcal, so labels are easy to reconcile"
        value={s.showKj}
        onChange={(v) => updateSettings({ showKj: v })}
      />
      <Toggle
        label="Eat back exercise"
        hint="Add logged exercise to the food budget. Off by default because trackers overstate burn."
        value={s.eatBackExercise}
        onChange={(v) => updateSettings({ eatBackExercise: v })}
      />
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="Day starts at"
          value={s.dayStartHour}
          onChange={(v) =>
            typeof v === 'number' && v >= 0 && v <= 6 && updateSettings({ dayStartHour: v })
          }
          unit="am"
          min={0}
          max={6}
        />
        <NumberField
          label="Water goal"
          value={s.waterGoalMl}
          onChange={(v) => typeof v === 'number' && updateSettings({ waterGoalMl: v })}
          unit="ml"
          min={500}
          max={6000}
          step={250}
        />
        <NumberField
          label="Fast window"
          value={s.fastingDefaultHours}
          onChange={(v) => typeof v === 'number' && updateSettings({ fastingDefaultHours: v })}
          unit="h"
          min={12}
          max={36}
        />
      </div>
      <p className="text-xs text-bark-500">
        "Day starts at" means a 1am snack counts towards the evening before.
      </p>
    </Section>
  );
}

function DataCard() {
  const nav = useNavigate();
  const s = useLiveQuery(() => db.settings.get('me'), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ file: Awaited<ReturnType<typeof parseExport>> } | null>(
    null,
  );
  const [wiping, setWiping] = useState(false);
  const [includeKey, setIncludeKey] = useState(false);

  async function doExport() {
    const blob = await exportAll({ includeKey });
    await shareOrDownload(blob, `quokkal-backup-${new Date().toISOString().slice(0, 10)}.json`);
    toast('Backup ready', 'info', '💾');
  }
  async function onFile(f?: File) {
    if (!f) return;
    const parsed = await parseExport(await f.text());
    setPending({ file: parsed });
  }
  const daysSinceExport = s?.lastExportAt
    ? Math.floor((Date.now() - s.lastExportAt) / 86_400_000)
    : null;

  return (
    <Section title="Your data">
      <p className="text-xs text-bark-500">
        Everything lives in this browser.{' '}
        {daysSinceExport === null
          ? 'You have never made a backup.'
          : `Last backup ${daysSinceExport} day${daysSinceExport === 1 ? '' : 's'} ago.`}{' '}
        Move to a new phone by exporting here and importing there.
      </p>
      <Toggle
        label="Include API key in backup"
        hint="Off is safer. Turn on only for a backup you will keep private."
        value={includeKey}
        onChange={setIncludeKey}
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={doExport}>
          Export backup
        </button>
        <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button className="btn-ghost text-berry-500" onClick={() => setWiping(true)}>
        Wipe everything on this device
      </button>

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Import backup">
        {pending &&
          (pending.file.ok ? (
            <div className="flex flex-col gap-3 text-sm">
              <p>
                Exported {new Date(pending.file.file.exportedAt).toLocaleString('en-AU')}. Contains{' '}
                {pending.file.counts.entries ?? 0} meals, {pending.file.counts.weights ?? 0}{' '}
                weigh-ins.
              </p>
              <button
                className="btn-primary"
                onClick={async () => {
                  await importAll(pending.file.ok ? pending.file.file : null!, 'replace');
                  setPending(null);
                  toast("Imported. Replaced this device's data.", 'info', '📥');
                  nav('/');
                }}
              >
                Replace this device's data
              </button>
              <button
                className="btn-secondary"
                onClick={async () => {
                  await importAll(pending.file.ok ? pending.file.file : null!, 'merge');
                  setPending(null);
                  toast('Merged', 'info', '📥');
                  nav('/');
                }}
              >
                Merge into this device
              </button>
            </div>
          ) : (
            <p className="text-berry-500 font-semibold">{pending.file.error}</p>
          ))}
      </Sheet>
      <Sheet open={wiping} onClose={() => setWiping(false)} title="Wipe everything?">
        <p className="text-sm text-bark-700 mb-3">
          This deletes every meal, weigh-in, badge and your quokka from this device. There is no
          undo. Export a backup first if you are unsure.
        </p>
        <button
          className="btn-primary bg-berry-500 hover:bg-berry-500"
          onClick={async () => {
            await wipeAll();
            setWiping(false);
            nav('/onboarding', { replace: true });
          }}
        >
          Yes, wipe it
        </button>
      </Sheet>
    </Section>
  );
}

function AboutCard() {
  const [checking, setChecking] = useState(false);
  const s = useLiveQuery(() => db.settings.get('me'), []);
  const [offset, setOffset] = useState<number | ''>('');
  useEffect(() => {
    setOffset(Math.round((s?.timeOffsetMs ?? 0) / 86_400_000));
  }, [s?.timeOffsetMs]);
  return (
    <Section title="About">
      <div className="text-sm text-bark-700">
        <div>
          <b>Quokkal</b> {APP_VERSION}
        </div>
        <div className="text-xs text-bark-500">
          Built {new Date(BUILD_DATE).toLocaleString('en-AU')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-secondary"
          disabled={checking}
          onClick={async () => {
            setChecking(true);
            const ok = await checkForUpdates();
            setChecking(false);
            toast(
              ok
                ? 'Checked. If a new version exists a banner will appear.'
                : 'Update check unavailable (not installed as a PWA yet).',
              'info',
              '🔄',
            );
          }}
        >
          {checking ? 'Checking…' : 'Check for updates'}
        </button>
        {!isStandalone() && (
          <button
            className="btn-secondary"
            onClick={async () => {
              const r = await promptInstall();
              if (r === 'unavailable')
                toast('Use your browser menu: Add to Home Screen.', 'info', '📲');
            }}
          >
            Install app
          </button>
        )}
      </div>
      <p className="text-xs text-bark-500">
        {AFCD_ATTRIBUTION} Packaged food data from Open Food Facts (ODbL). Estimates by Claude via
        your own API key.
      </p>
      <details className="text-xs text-bark-500">
        <summary className="cursor-pointer font-semibold">Developer tools</summary>
        <div className="flex items-end gap-2 mt-2">
          <div className="w-32">
            <NumberField
              label="Time travel"
              value={offset}
              onChange={setOffset}
              unit="days"
              min={-30}
              max={30}
            />
          </div>
          <button
            className="btn-secondary py-2 text-sm"
            onClick={async () => {
              await updateSettings({ timeOffsetMs: (Number(offset) || 0) * 86_400_000 });
              toast('Time shifted', 'info', '⏰');
            }}
          >
            Apply
          </button>
        </div>
        <p className="mt-1">
          Shifts "now" so you can test rollover, streaks and quests without waiting a day.
        </p>
      </details>
    </Section>
  );
}

function SettingsHome() {
  const nav = useNavigate();
  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="text-2xl font-black">Settings</h1>
      </div>
      <KeyCard />
      <ModelPicker />
      <PersonaCard />
      <TargetsCard />
      <PrefsCard />
      <DataCard />
      <AboutCard />
      <div className="h-4" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Routes>
      <Route index element={<SettingsHome />} />
      <Route
        path="key"
        element={
          <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
            <h1 className="text-2xl font-black">Add your key</h1>
            <KeyCard />
          </div>
        }
      />
    </Routes>
  );
}
