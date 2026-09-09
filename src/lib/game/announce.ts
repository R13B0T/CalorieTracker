import { toast } from '@/stores/useSessionStore';
import type { GameResult } from './engine';
import { templateFor } from './quests';

/** Turn an engine result into toasts. Level-ups are handled by the modal, not here. */
export function announce(res: GameResult | null | undefined) {
  if (!res) return;
  if (res.xpGained > 0) {
    toast(
      `+${res.xpGained} XP${res.coinsGained ? `  ·  +${res.coinsGained} coins` : ''}`,
      'reward',
      '✨',
    );
  }
  for (const q of res.questsCompleted) {
    const t = templateFor(q);
    toast(`Quest done: ${t?.title ?? 'quest'}`, 'reward', t?.emoji ?? '🏁');
  }
  for (const b of res.newBadges) toast(`Badge earned: ${b.name}`, 'reward', b.emoji);
  if (res.streak?.usedFreeze) toast('Streak freeze used. Streak safe.', 'info', '🧊');
}
