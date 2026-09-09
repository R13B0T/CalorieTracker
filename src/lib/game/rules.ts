/** Every gamification constant lives here so tuning is one file. */
export const XP = {
  mealLogged: 20,
  mealsRewardedPerDay: 5,
  photoBonus: 5,
  editedBeforeSaveBonus: 5,
  waterPer250ml: 2,
  waterCapPerDay: 20,
  weighIn: 15,
  exercise: 15,
  exerciseCapPerDay: 2,
  fastCompleted: 25,
  dayWithinTarget: 40,
  proteinHit: 20,
  fibreHit: 15,
  dailyQuest: 30,
  weeklyQuest: 120,
  streakBase: 10,
  streakBonusCap: 30,
} as const;

export const COINS = {
  perXp: 10, // 1 coin per 10 XP
  dailyQuest: 15,
  weeklyQuest: 60,
  levelUpPerLevel: 10,
  freezePrice: 120,
  freezeMaxHeld: 2,
  renamePrice: 50,
} as const;

export const TARGET_TOLERANCE = 0.1; // ±10%

export const STREAK = {
  minEntriesForDay: 2,
  freeFreezesAtStart: 1,
} as const;

export const LEVEL_TITLES: { level: number; title: string }[] = [
  { level: 1, title: 'Hatchling' },
  { level: 5, title: 'Snack Scout' },
  { level: 10, title: 'Portion Pro' },
  { level: 15, title: 'Macro Mate' },
  { level: 20, title: 'Rottnest Royalty' },
  { level: 30, title: 'Legend of the Bush' },
  { level: 40, title: 'Quokkal Sage' },
];

export const EVOLUTION = {
  adultLevel: 10,
  legendLevel: 25,
  legendMinDaysLogged: 60,
} as const;

export const COACH_CALLS_PER_DAY = 3;

export const DEFAULT_PET_NAME = 'Pip';
export const DEFAULT_HABITAT = 'beach';
