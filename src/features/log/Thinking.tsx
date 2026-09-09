import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { QuokkaSprite } from '@/features/pet/QuokkaSprite';

const LINES = [
  'Squinting at it…',
  'Counting the sneaky oil…',
  'Consulting the food database…',
  'Weighing things by eye…',
  'Nearly there…',
];

export function Thinking({ onCancel }: { onCancel?: () => void }) {
  const game = useLiveQuery(() => db.game.get('me'), []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="card flex items-center gap-4" role="status" aria-live="polite">
      <QuokkaSprite
        stage={game?.pet.stage ?? 'joey'}
        mood="content"
        outfitId={game?.pet.outfitId}
        size={72}
        animate
      />
      <div className="flex-1">
        <div className="font-bold">{game?.pet.name ?? 'Quokka'} is thinking</div>
        <div className="text-sm text-bark-500">{LINES[i]}</div>
      </div>
      {onCancel && (
        <button className="btn-ghost px-3 py-1 text-sm" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}
