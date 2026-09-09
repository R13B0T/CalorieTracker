import Dexie, { type EntityTable } from 'dexie';
import type {
  DayLog,
  ExerciseEntry,
  FastingSession,
  FoodEntry,
  GameState,
  OffCacheRow,
  PendingDraft,
  Settings,
  UserProfile,
  WaterEntry,
  WeightEntry,
} from './types';

export class QuokkalDB extends Dexie {
  entries!: EntityTable<FoodEntry, 'id'>;
  days!: EntityTable<DayLog, 'dayKey'>;
  weights!: EntityTable<WeightEntry, 'id'>;
  water!: EntityTable<WaterEntry, 'id'>;
  exercise!: EntityTable<ExerciseEntry, 'id'>;
  fasting!: EntityTable<FastingSession, 'id'>;
  profile!: EntityTable<UserProfile, 'id'>;
  game!: EntityTable<GameState, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  offCache!: EntityTable<OffCacheRow, 'barcode'>;
  drafts!: EntityTable<PendingDraft, 'id'>;

  constructor(name = 'quokkal') {
    super(name);
    this.version(1).stores({
      entries: 'id, dayKey, loggedAt, [dayKey+slot]',
      days: 'dayKey',
      weights: 'id, dayKey, at',
      water: 'id, dayKey, at',
      exercise: 'id, dayKey, at',
      fasting: 'id, startedAt, endedAt',
      profile: 'id',
      game: 'id',
      settings: 'id',
      offCache: 'barcode, fetchedAt',
      drafts: 'id, createdAt',
    });
  }
}

export const db = new QuokkalDB();

export const ALL_TABLES = [
  'entries',
  'days',
  'weights',
  'water',
  'exercise',
  'fasting',
  'profile',
  'game',
  'settings',
  'offCache',
  'drafts',
] as const;
export type TableName = (typeof ALL_TABLES)[number];
