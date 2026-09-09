import { create } from 'zustand';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import type { PetStage } from '@/lib/db/types';
import { titleForLevel } from '@/lib/game/levels';
import { COINS } from '@/lib/game/rules';
import { QuokkaSprite } from '@/features/pet/QuokkaSprite';
import { PERSONAS, pick } from '@/lib/ai/personas';

interface LevelUpState {
  pending: { level: number; evolved?: PetStage } | null;
  show: (level: number, evolved?: PetStage) => void;
  clear: () => void;
}

const useLevelUpStore = create<LevelUpState>((set) => ({
  pending: null,
  show: (level, evolved) => set({ pending: { level, evolved } }),
  clear: () => set({ pending: null }),
}));

export function useLevelUp() {
  return useLevelUpStore((s) => s.show);
}

export function LevelUpModal() {
  const pending = useLevelUpStore((s) => s.pending);
  const clear = useLevelUpStore((s) => s.clear);
  const game = useLiveQuery(() => db.game.get('me'), []);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  if (!pending || !game) return null;
  const persona = PERSONAS[profile?.persona ?? 'warm'];
  const line = pick(persona.lines.levelUp, pending.level);
  const evolvedCopy =
    pending.evolved === 'adult'
      ? `${game.pet.name} grew up!`
      : pending.evolved === 'legend'
        ? `${game.pet.name} is now a legend!`
        : null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bark-900/60 p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="card w-full max-w-sm text-center flex flex-col items-center gap-3 animate-pop">
        <div className="text-sm font-bold text-euc-700 uppercase tracking-wide">Level up</div>
        <div className="text-6xl font-black text-bark-900">{pending.level}</div>
        <div className="font-bold text-bark-700">{titleForLevel(pending.level)}</div>
        <QuokkaSprite
          stage={game.pet.stage}
          mood="ecstatic"
          outfitId={game.pet.outfitId}
          size={140}
          animate
        />
        {evolvedCopy && <div className="text-lg font-black text-sun-500">{evolvedCopy}</div>}
        <p className="text-sm text-bark-700">"{line}"</p>
        <div className="chip bg-sun-300 text-bark-900">
          +{COINS.levelUpPerLevel * pending.level} coins bonus
        </div>
        <button className="btn-primary w-full mt-1" onClick={clear}>
          Nice
        </button>
      </div>
    </div>
  );
}
