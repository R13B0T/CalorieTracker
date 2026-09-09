import { useEffect } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { QuokkaSprite } from './QuokkaSprite';
import { PERSONAS, pick } from '@/lib/ai/personas';
import { MOOD_COPY } from '@/lib/game/mood';
import { useSessionStore } from '@/stores/useSessionStore';
import { maybeFetchCoachLine } from './coach';

export function PetGreeting() {
  const game = useLiveQuery(() => db.game.get('me'), []);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const coachLine = useSessionStore((s) => s.coachLine);

  useEffect(() => {
    maybeFetchCoachLine().catch(() => undefined);
  }, []);

  if (!game || !profile) return null;
  const persona = PERSONAS[profile.persona];
  const dayBucket = Math.floor(Date.now() / 3_600_000);
  const canned =
    game.pet.mood === 'peckish' || game.pet.mood === 'worried'
      ? pick(persona.lines.missYou, dayBucket)
      : game.streak.current >= 3
        ? pick(persona.lines.streak, dayBucket)
        : pick(persona.lines.greeting, dayBucket);
  const line = coachLine && Date.now() - coachLine.at < 6 * 3_600_000 ? coachLine.text : canned;

  return (
    <Link to="/pet" className="flex items-center gap-3 active:scale-[0.99] transition">
      <QuokkaSprite
        stage={game.pet.stage}
        mood={game.pet.mood}
        outfitId={game.pet.outfitId}
        size={84}
        animate
      />
      <div className="flex-1 card py-3 relative">
        <div className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-sand-50" aria-hidden />
        <div className="text-sm font-semibold text-bark-900">{line}</div>
        <div className="text-xs text-bark-500 mt-1">
          {game.pet.name} {MOOD_COPY[game.pet.mood]} · Lv {game.level} · {game.coins} coins
        </div>
      </div>
    </Link>
  );
}
