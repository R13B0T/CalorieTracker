/**
 * The single write path for anything that affects game state.
 * Every function here runs inside a Dexie transaction so XP, coins, quests, streak
 * and mood can never drift from what is actually logged.
 */
import { db } from '../db/db';
import type { DayLog, FoodEntry, GameState, Mood, Source } from '../db/types';
import { localHour, shiftDayKey, toDayKey } from '../date';
import { sumEntries } from '../nutrition/totals';
import { COINS, TARGET_TOLERANCE, XP } from './rules';
import { levelForXp, titlesUnlocked } from './levels';
import { coinsGained } from './xp';
import { bumpQuests, injectComebackQuest, rollQuests } from './quests';
import { newlyEarnedBadges } from './badges';
import { applyDayToStreak } from './streak';
import { moodFrom } from './mood';
import { stageFor } from './evolution';
import { ensureDay } from '../db/repos/days';
import { isVegOrFruit } from '../food/vegDetect';
import type { BadgeDef } from '@/data/badges';
import type { QuestInstance } from '../db/types';
import type { QuestMetric } from '@/data/quests';

export type GameEvent =
  | { type: 'meal_logged'; entry: FoodEntry; editedAiLines: number; sliderAdjusted: boolean }
  | { type: 'meal_deleted'; entry: FoodEntry }
  | { type: 'water_added'; dayKey: string; totalMl: number; goalMl: number; addedMl: number }
  | { type: 'weighed_in'; dayKey: string; firstToday: boolean }
  | { type: 'exercise_logged'; dayKey: string; countToday: number }
  | { type: 'fast_completed'; dayKey: string }
  | { type: 'quest_claimed'; questId: string }
  | {
      type: 'item_purchased';
      itemId: string;
      price: number;
      kind: 'outfit' | 'habitat' | 'consumable';
    }
  | { type: 'recalibrated' }
  | { type: 'search_used'; dayKey: string };

export interface GameResult {
  xpGained: number;
  coinsGained: number;
  levelUp?: { from: number; to: number };
  newBadges: BadgeDef[];
  questsCompleted: QuestInstance[];
  evolved?: GameState['pet']['stage'];
  streak?: { current: number; usedFreeze?: boolean; lost?: boolean };
}

const empty = (): GameResult => ({
  xpGained: 0,
  coinsGained: 0,
  newBadges: [],
  questsCompleted: [],
});

async function getNow(): Promise<{ now: number; dayStartHour: number; todayKey: string }> {
  const s = await db.settings.get('me');
  const now = Date.now() + (s?.timeOffsetMs ?? 0);
  const dayStartHour = s?.dayStartHour ?? 4;
  return { now, dayStartHour, todayKey: toDayKey(now, dayStartHour) };
}

function bump(state: GameState, counter: string, amount = 1) {
  state.counters[counter] = (state.counters[counter] ?? 0) + amount;
}

function grantXp(state: GameState, amount: number, res: GameResult) {
  if (amount <= 0) return;
  const oldXp = state.xp;
  const oldLevel = state.level;
  state.xp += amount;
  const coins = coinsGained(oldXp, state.xp);
  state.coins += coins;
  res.xpGained += amount;
  res.coinsGained += coins;
  const newLevel = levelForXp(state.xp);
  if (newLevel > oldLevel) {
    state.level = newLevel;
    const bonus = COINS.levelUpPerLevel * newLevel;
    state.coins += bonus;
    res.coinsGained += bonus;
    res.levelUp = { from: oldLevel, to: newLevel };
    for (const t of titlesUnlocked(newLevel)) if (!state.titles.includes(t)) state.titles.push(t);
  }
}

function quest(
  state: GameState,
  metric: QuestMetric,
  amount: number,
  dayKey: string,
  now: number,
  res: GameResult,
  mode: 'add' | 'set' = 'add',
) {
  const { quests, completed } = bumpQuests(state.quests, metric, amount, dayKey, now, mode);
  state.quests = quests;
  for (const q of completed) {
    res.questsCompleted.push(q);
    grantXp(state, q.period === 'daily' ? XP.dailyQuest : XP.weeklyQuest, res);
    const coins = q.period === 'daily' ? COINS.dailyQuest : COINS.weeklyQuest;
    state.coins += coins;
    res.coinsGained += coins;
    state.quests = state.quests.map((x) => (x.id === q.id ? { ...x, claimed: true } : x));
  }
}

function checkBadges(state: GameState, res: GameResult, now: number) {
  for (const b of newlyEarnedBadges(state)) {
    state.badges.push({ id: b.id, earnedAt: now });
    state.coins += b.coins;
    res.coinsGained += b.coins;
    res.newBadges.push(b);
  }
}

async function daysLoggedCount(): Promise<number> {
  const keys = await db.entries.orderBy('dayKey').uniqueKeys();
  return keys.length;
}

async function checkEvolution(state: GameState, res: GameResult) {
  const days = await daysLoggedCount();
  const next = stageFor(state.level, days, state.pet.stage);
  if (next !== state.pet.stage) {
    state.pet.stage = next;
    res.evolved = next;
    if (next === 'legend') bump(state, 'legend');
  }
}

async function loadState(): Promise<GameState> {
  const s = await db.game.get('me');
  if (!s) throw new Error('Game state missing');
  return s;
}

/** Progress of today's "meals logged" for anti-spam XP cap. */
async function rewardedMealsToday(dayKey: string): Promise<number> {
  const entries = await db.entries.where('dayKey').equals(dayKey).toArray();
  return entries.filter((e) => (e.xpAwarded ?? 0) > 0).length;
}

export async function applyEvent(event: GameEvent): Promise<GameResult> {
  const { now, dayStartHour, todayKey } = await getNow();
  return db.transaction(
    'rw',
    [db.game, db.entries, db.days, db.settings, db.profile, db.weights, db.water],
    async () => {
      const state = await loadState();
      const res = empty();
      if (!state.firstLogAt && event.type === 'meal_logged') state.firstLogAt = now;

      switch (event.type) {
        case 'meal_logged': {
          const e = event.entry;
          const rewarded = await rewardedMealsToday(e.dayKey);
          let xp = 0;
          if (rewarded < XP.mealsRewardedPerDay) {
            xp += XP.mealLogged;
            if (e.source === 'photo') xp += XP.photoBonus;
            if (event.editedAiLines > 0 || event.sliderAdjusted) xp += XP.editedBeforeSaveBonus;
          }
          await db.entries.update(e.id, { xpAwarded: xp });
          grantXp(state, xp, res);
          bump(state, 'meals');
          const srcCounter: Partial<Record<Source, string>> = {
            photo: 'photos',
            text: 'textLogs',
            voice: 'voiceLogs',
            barcode: 'barcodes',
            search: 'searches',
          };
          if (srcCounter[e.source]) bump(state, srcCounter[e.source]!);
          if (event.editedAiLines > 0) bump(state, 'aiLinesEdited', event.editedAiLines);
          const hour = localHour(e.loggedAt);
          if (e.slot === 'breakfast' && hour < 9) bump(state, 'earlyBreakfasts');

          quest(state, 'meals', 1, e.dayKey, now, res);
          if (e.source === 'photo') quest(state, 'photos', 1, e.dayKey, now, res);
          if (e.slot === 'breakfast' && hour < 10)
            quest(state, 'breakfastBefore10', 1, e.dayKey, now, res);
          if (e.slot === 'dinner' && hour < 20)
            quest(state, 'dinnerBefore8', 1, e.dayKey, now, res);
          if (e.items.some((i) => isVegOrFruit(i.name)))
            quest(state, 'vegItem', 1, e.dayKey, now, res);
          if (event.sliderAdjusted) quest(state, 'sliderAdjusted', 1, e.dayKey, now, res);
          // methods used this week
          const weekStart = shiftDayKey(e.dayKey, -6);
          const weekEntries = await db.entries
            .where('dayKey')
            .between(weekStart, e.dayKey, true, true)
            .toArray();
          const methods = new Set(weekEntries.map((x) => x.source));
          quest(state, 'methodsUsed', methods.size, e.dayKey, now, res, 'set');
          // days logged this week (for weekly everyday quest, live progress)
          const daysThisWeek = new Set(weekEntries.map((x) => x.dayKey)).size;
          quest(state, 'daysLogged', daysThisWeek, e.dayKey, now, res, 'set');
          // live protein/fibre check for today's quests (also confirmed at rollover)
          await liveTargetQuests(state, e.dayKey, now, res);
          break;
        }
        case 'meal_deleted': {
          const xp = event.entry.xpAwarded ?? 0;
          state.xp = Math.max(0, state.xp - xp);
          state.level = levelForXp(state.xp);
          state.counters.meals = Math.max(0, (state.counters.meals ?? 0) - 1);
          // Quests are not clawed back; being generous is fine, being punitive is not.
          break;
        }
        case 'water_added': {
          const glasses = Math.floor(event.addedMl / 250);
          const todayXp = state.counters[`waterXp:${event.dayKey}`] ?? 0;
          const xp = Math.min(XP.waterCapPerDay - todayXp, glasses * XP.waterPer250ml);
          if (xp > 0) {
            grantXp(state, xp, res);
            state.counters[`waterXp:${event.dayKey}`] = todayXp + xp;
          }
          if (event.totalMl >= event.goalMl && event.totalMl - event.addedMl < event.goalMl) {
            quest(state, 'waterGoal', 1, event.dayKey, now, res);
            await db.days.update(event.dayKey, { waterHit: true });
          }
          break;
        }
        case 'weighed_in': {
          if (event.firstToday) {
            grantXp(state, XP.weighIn, res);
            bump(state, 'weighIns');
            quest(state, 'weighIn', 1, event.dayKey, now, res);
          }
          break;
        }
        case 'exercise_logged': {
          if (event.countToday <= XP.exerciseCapPerDay) grantXp(state, XP.exercise, res);
          break;
        }
        case 'fast_completed': {
          grantXp(state, XP.fastCompleted, res);
          bump(state, 'fasts');
          quest(state, 'fastCompleted', 1, event.dayKey, now, res);
          break;
        }
        case 'quest_claimed': {
          // Quests auto-claim on completion in this design; kept for API symmetry.
          break;
        }
        case 'item_purchased': {
          if (state.coins < event.price) throw new Error('Not enough coins');
          state.coins -= event.price;
          bump(state, 'purchases');
          if (event.kind === 'consumable' && event.itemId === 'freeze') {
            state.streak.freezes = Math.min(COINS.freezeMaxHeld, state.streak.freezes + 1);
          } else {
            if (!state.inventory.includes(event.itemId)) state.inventory.push(event.itemId);
            if (event.kind === 'outfit') {
              state.counters.outfitsOwned = state.inventory.filter((id) =>
                ['bow', 'sunnies', 'bucket_hat', 'scarf', 'crown'].includes(id),
              ).length;
              state.pet.outfitId = event.itemId;
            }
            if (event.kind === 'habitat') state.pet.habitatId = event.itemId;
          }
          break;
        }
        case 'recalibrated': {
          bump(state, 'recalibrations');
          break;
        }
        case 'search_used': {
          bump(state, 'searches');
          break;
        }
      }

      checkBadges(state, res, now);
      await checkEvolution(state, res);
      state.pet.mood = await computeMood(state, now, dayStartHour, todayKey);
      state.pet.moodUpdatedAt = now;
      await db.game.put(state);
      return res;
    },
  );
}

async function liveTargetQuests(state: GameState, dayKey: string, now: number, res: GameResult) {
  const day = await db.days.get(dayKey);
  if (!day) return;
  const entries = await db.entries.where('dayKey').equals(dayKey).toArray();
  const t = sumEntries(entries);
  if (t.protein >= day.targetMacros.protein) quest(state, 'proteinHit', 1, dayKey, now, res, 'set');
  if (t.fibre >= day.targetMacros.fibre) quest(state, 'fibreHit', 1, dayKey, now, res, 'set');
}

export async function computeMood(
  state: GameState,
  now: number,
  dayStartHour: number,
  todayKey: string,
): Promise<Mood> {
  const since24 = now - 24 * 3_600_000;
  const since48 = now - 48 * 3_600_000;
  const recent = await db.entries.where('loggedAt').aboveOrEqual(since48).toArray();
  const last = await db.entries.orderBy('loggedAt').last();
  const yesterdayKey = shiftDayKey(todayKey, -1);
  const yesterday = await db.days.get(yesterdayKey);
  const twoDaysAgo = await db.days.get(shiftDayKey(todayKey, -2));
  const weighed = await db.weights.where('at').aboveOrEqual(since48).count();
  const days = [yesterday, twoDaysAgo].filter(Boolean) as DayLog[];
  void dayStartHour;
  return moodFrom({
    mealsLast24h: recent.filter((e) => e.loggedAt >= since24).length,
    waterGoalDaysLast48h: days.filter((d) => d.waterHit).length,
    weighInLast48h: weighed > 0,
    yesterdayWithinTarget: !!yesterday?.withinTarget,
    proteinFibreHitsLast48h: days.reduce(
      (a, d) => a + (d.proteinHit ? 1 : 0) + (d.fibreHit ? 1 : 0),
      0,
    ),
    hoursSinceLastLog: last ? (now - last.loggedAt) / 3_600_000 : null,
    streakLostWithin24h: !!state.streak.lostAt && now - state.streak.lostAt < 24 * 3_600_000,
  });
}

/**
 * Close every day between the last rollover and yesterday, award day XP, evaluate streak,
 * then roll today's quests. Idempotent: safe to call every minute.
 */
export async function runRollover(): Promise<GameResult | null> {
  const settings = await db.settings.get('me');
  if (!settings?.onboarded) return null;
  const { now, dayStartHour, todayKey } = await getNow();
  const state = await db.game.get('me');
  if (!state) return null;
  if (state.lastRolloverDay === todayKey) return null;

  return db.transaction(
    'rw',
    [db.game, db.entries, db.days, db.settings, db.profile, db.weights, db.water],
    async () => {
      const st = await loadState();
      if (st.lastRolloverDay === todayKey) return null;
      const res = empty();

      if (!st.lastRolloverDay) {
        // First run: nothing to close, just roll quests.
        st.lastRolloverDay = todayKey;
      } else {
        let k = st.lastRolloverDay;
        // Close days from lastRolloverDay up to yesterday.
        while (k < todayKey) {
          await closeDay(st, k, now, res);
          k = shiftDayKey(k, 1);
        }
        st.lastRolloverDay = todayKey;
      }
      await ensureDay(todayKey);
      const rolled = rollQuests(st.quests, todayKey, st.recentQuestTemplates);
      st.quests = rolled.quests;
      st.recentQuestTemplates = rolled.recent;
      // Comeback quest live progress: consecutive days logged ending yesterday.
      checkBadges(st, res, now);
      await checkEvolution(st, res);
      st.pet.mood = await computeMood(st, now, dayStartHour, todayKey);
      st.pet.moodUpdatedAt = now;
      await db.game.put(st);
      return res;
    },
  );
}

async function closeDay(state: GameState, dayKey: string, now: number, res: GameResult) {
  const day = (await db.days.get(dayKey)) ?? (await ensureDay(dayKey));
  if (day.closedAt) return;
  const entries = await db.entries.where('dayKey').equals(dayKey).toArray();
  const totals = sumEntries(entries);
  const weighed = (await db.weights.where('dayKey').equals(dayKey).count()) > 0;
  const waterHit = day.waterMl >= (await db.settings.get('me'))!.waterGoalMl || !!day.waterHit;
  const eaten = totals.kcal;
  const target = day.targetKcal + (day.eatBackExercise ? day.exerciseKcal : 0);
  const hasFood = entries.length > 0;
  const withinTarget = hasFood && Math.abs(eaten - target) <= target * TARGET_TOLERANCE;
  const proteinHit = hasFood && totals.protein >= day.targetMacros.protein;
  const fibreHit = hasFood && totals.fibre >= day.targetMacros.fibre;

  if (withinTarget) {
    grantXp(state, XP.dayWithinTarget, res);
    bump(state, 'withinTargetDays');
    quest(state, 'withinTarget', 1, dayKey, now, res);
  }
  if (proteinHit) {
    grantXp(state, XP.proteinHit, res);
    bump(state, 'proteinDays');
    quest(state, 'proteinHit', 1, dayKey, now, res);
  }
  if (fibreHit) {
    grantXp(state, XP.fibreHit, res);
    bump(state, 'fibreDays');
    quest(state, 'fibreHit', 1, dayKey, now, res);
  }
  if (waterHit) bump(state, 'waterGoalDays');

  const summary = { dayKey, entryCount: entries.length, weighedIn: weighed, waterHit };
  const prevCurrent = state.streak.current;
  const outcome = applyDayToStreak(state.streak, summary, now);
  state.streak = outcome.streak;
  if (outcome.xp) grantXp(state, outcome.xp, res);
  res.streak = {
    current: state.streak.current,
    usedFreeze: outcome.usedFreeze,
    lost: outcome.lost,
  };
  if (outcome.lost && prevCurrent > 0) {
    state.quests = injectComebackQuest(state.quests, shiftDayKey(dayKey, 1));
    state.counters.comebackArmed = 1;
  }
  if (outcome.counted) {
    quest(state, 'comebackDays', 1, shiftDayKey(dayKey, 1), now, res);
    if (state.counters.comebackArmed && state.streak.current >= 7) {
      bump(state, 'comebacks');
      state.counters.comebackArmed = 0;
    }
  } else if (!outcome.usedFreeze) {
    // reset comeback progress if a day is missed without freeze
    state.quests = state.quests.map((q) =>
      q.templateId === 's_comeback' && !q.completedAt ? { ...q, progress: 0 } : q,
    );
  }

  await db.days.update(dayKey, {
    closedAt: now,
    streakCounted: outcome.counted,
    withinTarget,
    proteinHit,
    fibreHit,
    waterHit,
  });
}
