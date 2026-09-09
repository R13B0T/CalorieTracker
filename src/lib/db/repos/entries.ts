import { db } from '../db';
import type { FoodEntry } from '../types';
import { dayKeyRange } from '../../date';

export function entriesForDay(dayKey: string): Promise<FoodEntry[]> {
  return db.entries.where('dayKey').equals(dayKey).sortBy('loggedAt');
}

export function entriesBetween(fromKey: string, toKey: string): Promise<FoodEntry[]> {
  return db.entries.where('dayKey').anyOf(dayKeyRange(fromKey, toKey)).toArray();
}

export async function entriesSince(ts: number): Promise<FoodEntry[]> {
  return db.entries.where('loggedAt').aboveOrEqual(ts).toArray();
}

export async function lastEntry(): Promise<FoodEntry | undefined> {
  return db.entries.orderBy('loggedAt').last();
}
