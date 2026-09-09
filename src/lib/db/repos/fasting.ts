import { db } from '../db';
import { newId } from '../../id';
import { toDayKey } from '../../date';
import { applyEvent, type GameResult } from '../../game/engine';
import type { FastingSession } from '../types';

export async function activeFast(): Promise<FastingSession | undefined> {
  return db.fasting.filter((f) => f.endedAt === undefined).first();
}

export async function startFast(targetHours: number): Promise<FastingSession> {
  const existing = await activeFast();
  if (existing) return existing;
  const f: FastingSession = { id: newId(), startedAt: Date.now(), targetHours };
  await db.fasting.put(f);
  return f;
}

export async function endFast(): Promise<{
  session: FastingSession;
  result: GameResult | null;
} | null> {
  const f = await activeFast();
  if (!f) return null;
  const endedAt = Date.now();
  const hours = (endedAt - f.startedAt) / 3_600_000;
  const completed = hours >= f.targetHours;
  const session = { ...f, endedAt, completed };
  await db.fasting.put(session);
  let result: GameResult | null = null;
  if (completed) {
    const s = await db.settings.get('me');
    result = await applyEvent({
      type: 'fast_completed',
      dayKey: toDayKey(endedAt, s?.dayStartHour ?? 4),
    });
  }
  return { session, result };
}
