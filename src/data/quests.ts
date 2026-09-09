export type QuestMetric =
  | 'meals'
  | 'photos'
  | 'breakfastBefore10'
  | 'dinnerBefore8'
  | 'proteinHit'
  | 'fibreHit'
  | 'waterGoal'
  | 'weighIn'
  | 'vegItem'
  | 'sliderAdjusted'
  | 'withinTarget'
  | 'fastCompleted'
  | 'daysLogged'
  | 'methodsUsed'
  | 'comebackDays';

export interface QuestTemplate {
  id: string;
  period: 'daily' | 'weekly';
  title: string;
  emoji: string;
  metric: QuestMetric;
  target: number;
  weight: number;
  /** Set for special quests that are injected rather than rolled. */
  special?: boolean;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'd_breakfast',
    period: 'daily',
    title: 'Log breakfast before 10am',
    emoji: '🌅',
    metric: 'breakfastBefore10',
    target: 1,
    weight: 3,
  },
  {
    id: 'd_three_meals',
    period: 'daily',
    title: 'Log 3 meals or snacks',
    emoji: '🍽️',
    metric: 'meals',
    target: 3,
    weight: 4,
  },
  {
    id: 'd_photo',
    period: 'daily',
    title: 'Take one photo log',
    emoji: '📸',
    metric: 'photos',
    target: 1,
    weight: 3,
  },
  {
    id: 'd_protein',
    period: 'daily',
    title: 'Hit your protein target',
    emoji: '💪',
    metric: 'proteinHit',
    target: 1,
    weight: 3,
  },
  {
    id: 'd_fibre',
    period: 'daily',
    title: 'Hit your fibre target',
    emoji: '🥦',
    metric: 'fibreHit',
    target: 1,
    weight: 2,
  },
  {
    id: 'd_water',
    period: 'daily',
    title: 'Reach your water goal',
    emoji: '💧',
    metric: 'waterGoal',
    target: 1,
    weight: 3,
  },
  {
    id: 'd_weigh',
    period: 'daily',
    title: 'Weigh in',
    emoji: '⚖️',
    metric: 'weighIn',
    target: 1,
    weight: 2,
  },
  {
    id: 'd_veg',
    period: 'daily',
    title: 'Log a veg or fruit item',
    emoji: '🍎',
    metric: 'vegItem',
    target: 1,
    weight: 3,
  },
  {
    id: 'd_slider',
    period: 'daily',
    title: 'Adjust a portion slider',
    emoji: '🎚️',
    metric: 'sliderAdjusted',
    target: 1,
    weight: 2,
  },
  {
    id: 'd_target',
    period: 'daily',
    title: 'Finish within 10% of target',
    emoji: '🎯',
    metric: 'withinTarget',
    target: 1,
    weight: 3,
  },
  {
    id: 'd_dinner',
    period: 'daily',
    title: 'Log dinner before 8pm',
    emoji: '🌆',
    metric: 'dinnerBefore8',
    target: 1,
    weight: 2,
  },
  {
    id: 'd_fast',
    period: 'daily',
    title: 'Complete a fasting window',
    emoji: '⏳',
    metric: 'fastCompleted',
    target: 1,
    weight: 1,
  },
  {
    id: 'w_everyday',
    period: 'weekly',
    title: 'Log every day this week',
    emoji: '📅',
    metric: 'daysLogged',
    target: 7,
    weight: 4,
  },
  {
    id: 'w_photos',
    period: 'weekly',
    title: 'Five photo logs',
    emoji: '📷',
    metric: 'photos',
    target: 5,
    weight: 3,
  },
  {
    id: 'w_weigh',
    period: 'weekly',
    title: 'Three weigh-ins',
    emoji: '⚖️',
    metric: 'weighIn',
    target: 3,
    weight: 3,
  },
  {
    id: 'w_protein',
    period: 'weekly',
    title: 'Hit protein on 4 days',
    emoji: '💪',
    metric: 'proteinHit',
    target: 4,
    weight: 3,
  },
  {
    id: 'w_water',
    period: 'weekly',
    title: 'Water goal on 5 days',
    emoji: '💧',
    metric: 'waterGoal',
    target: 5,
    weight: 3,
  },
  {
    id: 'w_methods',
    period: 'weekly',
    title: 'Use 3 different log methods',
    emoji: '🧰',
    metric: 'methodsUsed',
    target: 3,
    weight: 2,
  },
  {
    id: 'w_meals',
    period: 'weekly',
    title: 'Log 15 meals',
    emoji: '🍱',
    metric: 'meals',
    target: 15,
    weight: 3,
  },
  {
    id: 's_comeback',
    period: 'weekly',
    title: 'Comeback: log 3 days in a row',
    emoji: '🔥',
    metric: 'comebackDays',
    target: 3,
    weight: 0,
    special: true,
  },
];

export const DAILY_QUEST_COUNT = 3;
export const WEEKLY_QUEST_COUNT = 2;
