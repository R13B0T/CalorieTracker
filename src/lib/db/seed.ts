import { db } from './db';
import type { Activity, Goal, Persona, Sex, Settings, UserProfile, GameState } from './types';
import {
  ageFromBirthYear,
  defaultFibreG,
  defaultMacroSplit,
  targetKcal,
  tdee as calcTdee,
} from '../nutrition/tdee';
import { DEFAULT_TEXT_MODEL, DEFAULT_VISION_MODEL } from '../ai/models';
import { DEFAULT_HABITAT, DEFAULT_PET_NAME, STREAK } from '../game/rules';
import { toDayKey } from '../date';
import { ensureDay } from './repos/days';

export interface OnboardingInput {
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  rateKgPerWeek: number;
  persona: Persona;
  petName: string;
  apiKey?: string;
}

export function buildProfile(input: OnboardingInput, now = Date.now()): UserProfile {
  const age = ageFromBirthYear(input.birthYear, new Date(now));
  const maintenance = Math.round(calcTdee(input.sex, input.weightKg, input.heightCm, age, input.activity));
  const target = targetKcal(maintenance, input.goal, input.rateKgPerWeek, input.sex);
  return {
    id: 'me',
    name: input.name.trim() || 'You',
    sex: input.sex,
    birthYear: input.birthYear,
    heightCm: input.heightCm,
    startWeightKg: input.weightKg,
    activity: input.activity,
    goal: input.goal,
    rateKgPerWeek: input.goal === 'maintain' ? 0 : input.rateKgPerWeek,
    tdee: maintenance,
    targetKcal: target,
    macroSplit: defaultMacroSplit(input.goal, input.weightKg, target),
    fibreG: defaultFibreG(input.sex),
    persona: input.persona,
    createdAt: now,
    recalibrationLog: [],
  };
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'me',
  visionModel: DEFAULT_VISION_MODEL,
  textModel: DEFAULT_TEXT_MODEL,
  eatBackExercise: false,
  showKj: true,
  dayStartHour: 4,
  fastingDefaultHours: 16,
  waterGoalMl: 2000,
  hapticsOn: true,
  onboarded: false,
};

export function initialGameState(petName: string, now = Date.now()): GameState {
  return {
    id: 'me',
    xp: 0,
    level: 1,
    coins: 0,
    streak: {
      current: 0,
      best: 0,
      lastCountedDay: null,
      freezes: STREAK.freeFreezesAtStart,
      frozenDays: [],
    },
    pet: {
      stage: 'joey',
      mood: 'content',
      moodUpdatedAt: now,
      outfitId: null,
      habitatId: DEFAULT_HABITAT,
      name: petName.trim() || DEFAULT_PET_NAME,
    },
    inventory: [],
    badges: [],
    quests: [],
    titles: ['Hatchling'],
    activeTitle: 'Hatchling',
    counters: {},
    recentQuestTemplates: [],
  };
}

export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  const now = Date.now();
  const profile = buildProfile(input, now);
  const existingSettings = await db.settings.get('me');
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...existingSettings,
    apiKey: input.apiKey?.trim() || existingSettings?.apiKey,
    onboarded: true,
  };
  await db.transaction('rw', [db.profile, db.settings, db.game, db.weights, db.days], async () => {
    await db.profile.put(profile);
    await db.settings.put(settings);
    if (!(await db.game.get('me'))) await db.game.put(initialGameState(input.petName, now));
    const dayKey = toDayKey(now, settings.dayStartHour);
    await db.weights.put({ id: crypto.randomUUID(), dayKey, at: now, kg: input.weightKg });
    await ensureDay(dayKey, profile, settings);
  });
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    /* ignore */
  }
}
