import { db } from '../db';
import { newId } from '../../id';
import { ensureDay } from './days';
import { applyEvent, type GameResult } from '../../game/engine';

export async function addWater(dayKey: string, ml: number): Promise<GameResult> {
  const settings = await db.settings.get('me');
  const day = await ensureDay(dayKey);
  const total = Math.max(0, day.waterMl + ml);
  await db.water.put({ id: newId(), dayKey, at: Date.now(), ml });
  await db.days.update(dayKey, { waterMl: total });
  return applyEvent({
    type: 'water_added',
    dayKey,
    totalMl: total,
    goalMl: settings?.waterGoalMl ?? 2000,
    addedMl: Math.max(0, ml),
  });
}
