import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { SHOP_ITEMS } from '@/data/shop';
import { applyEvent } from '@/lib/game/engine';
import { announce } from '@/lib/game/announce';
import { toast } from '@/stores/useSessionStore';
import { QuokkaSprite } from '@/features/pet/QuokkaSprite';
import { HabitatScene } from '@/features/pet/HabitatScene';
import { COINS } from '@/lib/game/rules';

export default function ShopPage() {
  const nav = useNavigate();
  const game = useLiveQuery(() => db.game.get('me'), []);
  const [preview, setPreview] = useState<{ outfitId?: string | null; habitatId?: string }>({});
  if (!game) return null;

  const previewOutfit = preview.outfitId !== undefined ? preview.outfitId : game.pet.outfitId;
  const previewHabitat = preview.habitatId ?? game.pet.habitatId;

  async function buy(id: string) {
    const item = SHOP_ITEMS.find((i) => i.id === id)!;
    if (game!.coins < item.price)
      return toast(`Need ${item.price - game!.coins} more coins.`, 'info', '🪙');
    if (item.kind === 'consumable' && game!.streak.freezes >= COINS.freezeMaxHeld)
      return toast('You already hold the maximum freezes.', 'info', '🧊');
    const res = await applyEvent({
      type: 'item_purchased',
      itemId: id,
      price: item.price,
      kind: item.kind,
    });
    announce(res);
    toast(`Bought ${item.name}`, 'reward', item.emoji);
    setPreview((current) =>
      item.kind === 'outfit'
        ? { ...current, outfitId: item.id }
        : item.kind === 'habitat'
          ? { ...current, habitatId: item.id }
          : current,
    );
  }

  async function equip(id: string, kind: 'outfit' | 'habitat') {
    await db.game.update(
      'me',
      kind === 'outfit' ? { 'pet.outfitId': id } : { 'pet.habitatId': id },
    );
    setPreview((current) =>
      kind === 'outfit' ? { ...current, outfitId: id } : { ...current, habitatId: id },
    );
  }

  async function unequipOutfit() {
    await db.game.update('me', { 'pet.outfitId': null });
    setPreview((current) => ({ ...current, outfitId: null }));
  }

  const owned = new Set([...game.inventory, 'beach']);

  return (
    <div className="max-w-lg mx-auto px-4 pt-3 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="text-2xl font-black">Shop</h1>
        <span className="chip bg-sun-300 text-bark-900 ml-auto">🪙 {game.coins}</span>
      </div>
      <HabitatScene habitatId={previewHabitat} compact>
        <QuokkaSprite
          stage={game.pet.stage}
          mood={game.pet.mood}
          outfitId={previewOutfit}
          size={160}
        />
      </HabitatScene>
      {(previewOutfit !== game.pet.outfitId || previewHabitat !== game.pet.habitatId) && (
        <button className="btn-ghost -mt-3 self-center text-xs" onClick={() => setPreview({})}>
          Back to equipped look
        </button>
      )}
      <p className="text-xs text-bark-500 text-center">
        Coins come from XP (1 per 10), quests, badges and level-ups. Nothing is ever taken away.
      </p>

      {(['consumable', 'outfit', 'habitat'] as const).map((kind) => (
        <section key={kind} className="flex flex-col gap-2">
          <h2 className="font-black text-bark-700 px-1">
            {kind === 'consumable' ? 'Useful' : kind === 'outfit' ? 'Outfits' : 'Habitats'}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {SHOP_ITEMS.filter((i) => i.kind === kind)
              .sort((a, b) => a.price - b.price)
              .map((item) => {
                const isOwned = item.kind !== 'consumable' && owned.has(item.id);
                const equipped =
                  (item.kind === 'outfit' && game.pet.outfitId === item.id) ||
                  (item.kind === 'habitat' && game.pet.habitatId === item.id);
                const previewing =
                  (item.kind === 'outfit' && previewOutfit === item.id) ||
                  (item.kind === 'habitat' && previewHabitat === item.id);
                return (
                  <li
                    key={item.id}
                    className={`card flex flex-col gap-1 ${equipped ? 'ring-2 ring-euc-500' : previewing ? 'ring-2 ring-sun-500' : ''}`}
                  >
                    {item.kind === 'consumable' ? (
                      <div className="text-3xl" aria-hidden>
                        {item.emoji}
                      </div>
                    ) : (
                      <button
                        className="text-left rounded-lg -m-1 p-1 active:bg-sand-100"
                        onClick={() =>
                          setPreview((current) =>
                            item.kind === 'outfit'
                              ? { ...current, outfitId: item.id }
                              : { ...current, habitatId: item.id },
                          )
                        }
                        aria-label={`Preview ${item.name}`}
                      >
                        <span className="block text-3xl" aria-hidden>
                          {item.emoji}
                        </span>
                        <span className="block font-black text-sm">{item.name}</span>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-euc-700">
                          Tap to preview
                        </span>
                      </button>
                    )}
                    {item.kind === 'consumable' && (
                      <div className="font-black text-sm">{item.name}</div>
                    )}
                    <div className="text-xs text-bark-500 flex-1">{item.desc}</div>
                    {item.kind === 'consumable' ? (
                      <button className="btn-secondary py-2 text-sm" onClick={() => buy(item.id)}>
                        {item.price}🪙 · held {game.streak.freezes}
                      </button>
                    ) : isOwned ? (
                      equipped ? (
                        item.kind === 'outfit' ? (
                          <button className="btn-ghost py-2 text-sm" onClick={unequipOutfit}>
                            Take off
                          </button>
                        ) : (
                          <span className="chip bg-euc-100 text-euc-700 justify-center">
                            Active
                          </span>
                        )
                      ) : (
                        <button
                          className="btn-secondary py-2 text-sm"
                          onClick={() => equip(item.id, item.kind as 'outfit' | 'habitat')}
                        >
                          {item.kind === 'outfit' ? 'Wear' : 'Use habitat'}
                        </button>
                      )
                    ) : (
                      <button
                        className="btn-primary py-2 text-sm"
                        disabled={game.coins < item.price}
                        onClick={() => buy(item.id)}
                      >
                        {item.price}🪙
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
      <div className="h-4" />
    </div>
  );
}
