import { db } from '../db';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../seed';

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('me')) ?? DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings();
  await db.settings.put({ ...cur, ...patch, id: 'me' });
}

/** "Now" with the dev-only time offset applied. */
export async function now(): Promise<number> {
  const s = await db.settings.get('me');
  return Date.now() + (s?.timeOffsetMs ?? 0);
}
