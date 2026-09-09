import { Route, Routes, Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { QuokkaSprite } from './QuokkaSprite';
import { HabitatScene } from './HabitatScene';
import { MOOD_COPY } from '@/lib/game/mood';
import { levelProgress, titleForLevel } from '@/lib/game/levels';
import { QuestsPanel } from '@/features/game/QuestsPanel';
import BadgesPage from '@/features/game/BadgesPage';
import ShopPage from '@/features/game/ShopPage';
import { useSessionStore } from '@/stores/useSessionStore';
import { maybeFetchCoachLine } from './coach';
import { toast } from '@/stores/useSessionStore';
import { EVOLUTION } from '@/lib/game/rules';

function PetHome() {
  const nav = useNavigate();
  const game = useLiveQuery(() => db.game.get('me'), []);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const daysLogged = useLiveQuery(
    () =>
      db.entries
        .orderBy('dayKey')
        .uniqueKeys()
        .then((k) => k.length),
    [],
    0,
  );
  const coachLine = useSessionStore((s) => s.coachLine);
  if (!game || !profile) return null;
  const lp = levelProgress(game.xp);
  const nextStage =
    game.pet.stage === 'joey'
      ? `Grows up at level ${EVOLUTION.adultLevel}`
      : game.pet.stage === 'adult'
        ? `Legend at level ${EVOLUTION.legendLevel} with ${EVOLUTION.legendMinDaysLogged} logged days (${daysLogged} so far)`
        : 'Fully evolved. Show-off.';

  async function poke() {
    try {
      await maybeFetchCoachLine(true);
    } catch {
      toast('Quokka is speechless right now. Try later.', 'info', '🤐');
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{game.pet.name}</h1>
        <div className="flex gap-2">
          <Link to="badges" className="chip bg-sand-200 text-bark-900">
            🏅 {game.badges.length}
          </Link>
          <Link to="shop" className="chip bg-sun-300 text-bark-900">
            🪙 {game.coins}
          </Link>
        </div>
      </header>

      <HabitatScene habitatId={game.pet.habitatId}>
        <button onClick={poke} aria-label="Poke your quokka" className="active:scale-95 transition">
          <QuokkaSprite
            stage={game.pet.stage}
            mood={game.pet.mood}
            outfitId={game.pet.outfitId}
            size={200}
            animate
          />
        </button>
      </HabitatScene>

      <div className="card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-lg">
              Level {game.level} · {game.activeTitle ?? titleForLevel(game.level)}
            </div>
            <div className="text-xs text-bark-500">
              {game.pet.name} {MOOD_COPY[game.pet.mood]}. {nextStage}
            </div>
          </div>
          <div className="text-right text-xs text-bark-500 font-semibold">
            {lp.into} / {lp.span} XP
          </div>
        </div>
        <div className="h-3 rounded-full bg-sand-200 overflow-hidden">
          <div
            className="h-full bg-euc-500 rounded-full transition-all"
            style={{ width: `${lp.pct}%` }}
          />
        </div>
        {coachLine && <p className="text-sm text-bark-700 italic pt-1">"{coachLine.text}"</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Streak" value={`${game.streak.current}🔥`} sub={`best ${game.streak.best}`} />
        <Stat label="Freezes" value={`${game.streak.freezes}🧊`} sub="held" />
        <Stat label="Meals" value={String(game.counters.meals ?? 0)} sub="logged" />
      </div>

      <QuestsPanel />

      <div className="grid grid-cols-2 gap-3">
        <button
          className="card text-left active:scale-[0.98] transition"
          onClick={() => nav('shop')}
        >
          <div className="text-2xl">🛍️</div>
          <div className="font-black">Shop</div>
          <div className="text-xs text-bark-500">Outfits, habitats, freezes</div>
        </button>
        <button
          className="card text-left active:scale-[0.98] transition"
          onClick={() => nav('badges')}
        >
          <div className="text-2xl">🏅</div>
          <div className="font-black">Badges</div>
          <div className="text-xs text-bark-500">{game.badges.length} earned</div>
        </button>
      </div>
      <div className="h-4" />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card py-3 px-2">
      <div className="text-lg font-black">{value}</div>
      <div className="text-xs font-semibold text-bark-700">{label}</div>
      <div className="text-[10px] text-bark-500">{sub}</div>
    </div>
  );
}

export default function PetPage() {
  return (
    <Routes>
      <Route index element={<PetHome />} />
      <Route path="badges" element={<BadgesPage />} />
      <Route path="shop" element={<ShopPage />} />
    </Routes>
  );
}
