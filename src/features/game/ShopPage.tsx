import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { SHOP_ITEMS } from '@/data/shop';
import { applyEvent } from '@/lib/game/engine';
import { announce } from '@/lib/game/announce';
import { toast } from '@/stores/useSessionStore';
import { QuokkaSprite } from '@/features/pet/QuokkaSprite';
import { COINS } from '@/lib/game/rules';

export default function ShopPage() {
  const nav = useNavigate();
  const game = useLiveQuery(() => db.game.get('me'), []);
  if (!game) return null;

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
  }

  async function equip(id: string, kind: 'outfit' | 'habitat') {
    await db.game.update(
      'me',
      kind === 'outfit' ? { 'pet.outfitId': id } : { 'pet.habitatId': id },
    );
  }

  async function unequipOutfit() {
    await db.game.update('me', { 'pet.outfitId': null });
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
      <div className="flex justify-center">
        <QuokkaSprite
          stage={game.pet.stage}
          mood={game.pet.mood}
          outfitId={game.pet.outfitId}
          size={140}
        />
      </div>
      <p className="text-xs text-bark-500 text-center">
        Coins come from XP (1 per 10), quests, badges and level-ups. Nothing is ever taken away.
      </p>

      {(['consumable', 'outfit', 'habitat'] as const).map((kind) => (
        <section key={kind} className="flex flex-col gap-2">
          <h2 className="font-black text-bark-700 px-1">
            {kind === 'consumable' ? 'Useful' : kind === 'outfit' ? 'Outfits' : 'Habitats'}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {SHOP_ITEMS.filter((i) => i.kind === kind).map((item) => {
              const isOwned = item.kind !== 'consumable' && owned.has(item.id);
              const equipped =
                (item.kind === 'outfit' && game.pet.outfitId === item.id) ||
                (item.kind === 'habitat' && game.pet.habitatId === item.id);
              return (
                <li
                  key={item.id}
                  className={`card flex flex-col gap-1 ${equipped ? 'ring-2 ring-euc-500' : ''}`}
                >
                  <div className="text-3xl" aria-hidden>
                    {item.emoji}
                  </div>
                  <div className="font-black text-sm">{item.name}</div>
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
                        <span className="chip bg-euc-100 text-euc-700 justify-center">Active</span>
                      )
                    ) : (
                      <button
                        className="btn-secondary py-2 text-sm"
                        onClick={() => equip(item.id, item.kind as 'outfit' | 'habitat')}
                      >
                        Wear
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
