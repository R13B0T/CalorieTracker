import type { QuestInstance } from '../db/types';
import { DAILY_QUEST_COUNT, QUEST_TEMPLATES, WEEKLY_QUEST_COUNT, type QuestMetric, type QuestTemplate } from '@/data/quests';
import { isoWeekKey } from '../date';

function weightedPick(pool: QuestTemplate[], n: number, rnd: () => number): QuestTemplate[] {
  const out: QuestTemplate[] = [];
  const remaining = [...pool];
  while (out.length < n && remaining.length) {
    const total = remaining.reduce((a, t) => a + t.weight, 0);
    let r = rnd() * total;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      r -= remaining[idx].weight;
      if (r <= 0) break;
    }
    const [t] = remaining.splice(Math.min(idx, remaining.length - 1), 1);
    out.push(t);
  }
  return out;
}

export function rollQuests(
  existing: QuestInstance[],
  dayKey: string,
  recent: { templateId: string; dayKey: string }[],
  rnd: () => number = Math.random,
): { quests: QuestInstance[]; recent: { templateId: string; dayKey: string }[] } {
  const week = isoWeekKey(dayKey);
  const keep = existing.filter(
    (q) => (q.period === 'daily' && q.periodKey === dayKey) || (q.period === 'weekly' && q.periodKey === week),
  );
  const recentIds = new Set(recent.filter((r) => daysAgo(r.dayKey, dayKey) < 3).map((r) => r.templateId));
  const newRecent = recent.filter((r) => daysAgo(r.dayKey, dayKey) < 3);

  const needDaily = DAILY_QUEST_COUNT - keep.filter((q) => q.period === 'daily').length;
  if (needDaily > 0) {
    const pool = QUEST_TEMPLATES.filter((t) => t.period === 'daily' && !t.special && !recentIds.has(t.id));
    for (const t of weightedPick(pool, needDaily, rnd)) {
      keep.push(instance(t, dayKey));
      newRecent.push({ templateId: t.id, dayKey });
    }
  }
  const needWeekly = WEEKLY_QUEST_COUNT - keep.filter((q) => q.period === 'weekly' && q.templateId !== 's_comeback').length;
  if (needWeekly > 0) {
    const pool = QUEST_TEMPLATES.filter((t) => t.period === 'weekly' && !t.special);
    for (const t of weightedPick(pool, needWeekly, rnd)) keep.push(instance(t, week));
  }
  return { quests: keep, recent: newRecent };
}

export function injectComebackQuest(quests: QuestInstance[], dayKey: string): QuestInstance[] {
  if (quests.some((q) => q.templateId === 's_comeback' && !q.claimed)) return quests;
  const t = QUEST_TEMPLATES.find((q) => q.id === 's_comeback')!;
  return [...quests, instance(t, isoWeekKey(dayKey))];
}

function instance(t: QuestTemplate, periodKey: string): QuestInstance {
  return {
    id: `${t.id}:${periodKey}`,
    templateId: t.id,
    period: t.period,
    periodKey,
    progress: 0,
    target: t.target,
  };
}

function daysAgo(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Bump progress on active quests that track `metric` in the given period keys. Returns newly completed. */
export function bumpQuests(
  quests: QuestInstance[],
  metric: QuestMetric,
  amount: number,
  dayKey: string,
  now: number,
  mode: 'add' | 'set' = 'add',
): { quests: QuestInstance[]; completed: QuestInstance[] } {
  const week = isoWeekKey(dayKey);
  const completed: QuestInstance[] = [];
  const next = quests.map((q) => {
    const t = QUEST_TEMPLATES.find((x) => x.id === q.templateId);
    if (!t || t.metric !== metric) return q;
    const inPeriod = q.period === 'daily' ? q.periodKey === dayKey : q.periodKey === week;
    if (!inPeriod || q.completedAt) return q;
    const progress = Math.min(q.target, mode === 'set' ? amount : q.progress + amount);
    const done = progress >= q.target;
    const updated = { ...q, progress, completedAt: done ? now : undefined };
    if (done) completed.push(updated);
    return updated;
  });
  return { quests: next, completed };
}

export function templateFor(q: QuestInstance): QuestTemplate | undefined {
  return QUEST_TEMPLATES.find((t) => t.id === q.templateId);
}
