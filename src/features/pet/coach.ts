import { db } from '@/lib/db/db';
import { coachMessage } from '@/lib/ai/claudeClient';
import { toDayKey } from '@/lib/date';
import { sumEntries } from '@/lib/nutrition/totals';
import { COACH_CALLS_PER_DAY } from '@/lib/game/rules';
import { useSessionStore } from '@/stores/useSessionStore';

/**
 * Fetch a fresh coach line at most COACH_CALLS_PER_DAY times a day and no more than
 * once per 3 hours. Falls back silently to canned lines.
 */
export async function maybeFetchCoachLine(force = false): Promise<void> {
  const session = useSessionStore.getState();
  if (!force && session.coachLine && Date.now() - session.coachLine.at < 3 * 3_600_000) return;
  const settings = await db.settings.get('me');
  const profile = await db.profile.get('me');
  const game = await db.game.get('me');
  if (!settings?.apiKey || !profile || !game || !navigator.onLine) return;
  const now = Date.now() + (settings.timeOffsetMs ?? 0);
  const dayKey = toDayKey(now, settings.dayStartHour);
  const calls = settings.coachCallsToday?.dayKey === dayKey ? settings.coachCallsToday.count : 0;
  if (calls >= COACH_CALLS_PER_DAY && !force) return;

  const entries = await db.entries.where('dayKey').equals(dayKey).toArray();
  const day = await db.days.get(dayKey);
  const totals = sumEntries(entries);
  const last = await db.entries.orderBy('loggedAt').last();
  const hour = new Date(now).getHours();
  const quests = game.quests.filter((q) => q.period === 'daily' && q.periodKey === dayKey);

  const text = await coachMessage(
    {
      petName: game.pet.name,
      timeOfDay: hour < 11 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      kcalEaten: Math.round(totals.kcal),
      kcalTarget: day?.targetKcal ?? profile.targetKcal,
      proteinEaten: Math.round(totals.protein),
      proteinTarget: day?.targetMacros.protein ?? 0,
      streak: game.streak.current,
      mood: game.pet.mood,
      lastMealTitle: last?.title,
      hoursSinceLastLog: last ? Math.round((now - last.loggedAt) / 3_600_000) : undefined,
      questsDone: quests.filter((q) => q.completedAt).length,
      questsTotal: quests.length,
    },
    profile.persona,
  );
  await db.settings.update('me', { coachCallsToday: { dayKey, count: calls + 1 } });
  useSessionStore.getState().setCoachLine({ text, at: Date.now() });
}
