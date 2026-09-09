export type Confidence = 'high' | 'medium' | 'low';
export type Source = 'photo' | 'text' | 'voice' | 'barcode' | 'search' | 'manual' | 'quick_repeat';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Persona = 'sassy' | 'warm' | 'drill';
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Mood = 'ecstatic' | 'happy' | 'content' | 'sleepy' | 'peckish' | 'worried';
export type PetStage = 'joey' | 'adult' | 'legend';

/** Nutrients per the stored quantity. kJ is always derived, never stored. */
export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export type FoodRef =
  | { kind: 'afcd'; key: string }
  | { kind: 'off'; barcode: string }
  | { kind: 'ai' }
  | { kind: 'manual' };

export interface FoodItem {
  id: string;
  name: string;
  /** Estimated grams at scale 1. */
  grams: number;
  /** Portion multiplier applied by the user (slider). Displayed = per * scale. */
  scale: number;
  /** Nutrients at `grams` (scale 1). */
  per: Nutrients;
  confidence: Confidence;
  assumptions?: string[];
  ref?: FoodRef;
  userEdited?: boolean;
}

export interface FoodEntry {
  id: string;
  dayKey: string;
  loggedAt: number;
  slot: MealSlot;
  source: Source;
  title: string;
  items: FoodItem[];
  notes?: string;
  photoThumb?: Blob;
  model?: string;
  rawInput?: string;
  /** XP awarded when logged, so deletion can reverse exactly that amount. */
  xpAwarded?: number;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface DayLog {
  dayKey: string;
  targetKcal: number;
  targetMacros: MacroTargets;
  waterMl: number;
  exerciseKcal: number;
  eatBackExercise: boolean;
  closedAt?: number;
  streakCounted?: boolean;
  /** Flags set at rollover so badges/quests can count days. */
  withinTarget?: boolean;
  proteinHit?: boolean;
  fibreHit?: boolean;
  waterHit?: boolean;
}

export interface WeightEntry {
  id: string;
  dayKey: string;
  at: number;
  kg: number;
}

export interface WaterEntry {
  id: string;
  dayKey: string;
  at: number;
  ml: number;
}

export interface ExerciseEntry {
  id: string;
  dayKey: string;
  at: number;
  description: string;
  minutes?: number;
  kcal: number;
  source: 'manual' | 'ai';
}

export interface FastingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  targetHours: number;
  completed?: boolean;
}

export interface RecalibrationEvent {
  at: number;
  expectedDeltaKg: number;
  actualDeltaKg: number;
  adjustmentKcal: number;
  newTargetKcal: number;
}

export interface UserProfile {
  id: 'me';
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  startWeightKg: number;
  activity: Activity;
  goal: Goal;
  /** kg per week; positive magnitude. 0 for maintain. */
  rateKgPerWeek: number;
  /** Estimated maintenance after any recalibration. */
  tdee: number;
  targetKcal: number;
  macroSplit: { proteinPct: number; carbsPct: number; fatPct: number };
  fibreG: number;
  persona: Persona;
  createdAt: number;
  lastRecalibratedAt?: number;
  recalibrationLog: RecalibrationEvent[];
}

export interface QuestInstance {
  id: string;
  templateId: string;
  period: 'daily' | 'weekly';
  periodKey: string;
  progress: number;
  target: number;
  completedAt?: number;
  claimed?: boolean;
}

export interface GameState {
  id: 'me';
  xp: number;
  level: number;
  coins: number;
  streak: {
    current: number;
    best: number;
    lastCountedDay: string | null;
    freezes: number;
    frozenDays: string[];
    lostAt?: number;
  };
  pet: {
    stage: PetStage;
    mood: Mood;
    moodUpdatedAt: number;
    outfitId: string | null;
    habitatId: string;
    name: string;
  };
  inventory: string[];
  badges: { id: string; earnedAt: number }[];
  quests: QuestInstance[];
  titles: string[];
  activeTitle: string | null;
  counters: Record<string, number>;
  /** Day keys that had at least one log, for evolution and heatmap. */
  firstLogAt?: number;
  /** ISO string of the last time the rollover job ran. */
  lastRolloverDay?: string;
  recentQuestTemplates: { templateId: string; dayKey: string }[];
}

export interface Settings {
  id: 'me';
  apiKey?: string;
  visionModel: string;
  textModel: string;
  eatBackExercise: boolean;
  showKj: boolean;
  dayStartHour: number;
  fastingDefaultHours: number;
  waterGoalMl: number;
  hapticsOn: boolean;
  installBannerDismissedAt?: number;
  lastExportAt?: number;
  coachCallsToday?: { dayKey: string; count: number };
  onboarded: boolean;
  /** Dev-only: offset in ms applied to "now" for testing rollover. */
  timeOffsetMs?: number;
}

export interface OffCacheRow {
  barcode: string;
  fetchedAt: number;
  product: CachedProduct | null;
  source: 'off' | 'user';
}

export interface CachedProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingG?: number;
  per100: Nutrients & { sugars?: number; sodiumMg?: number };
  imageUrl?: string;
  fibreUnknown?: boolean;
  kcalFromKj?: boolean;
}

export interface PendingDraft {
  id: string;
  createdAt: number;
  kind: 'text' | 'photo';
  text?: string;
  imageBase64?: string;
  thumb?: Blob;
  slot: MealSlot;
}
