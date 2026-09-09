export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  counter: string;
  threshold: number;
  coins: number;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_bite', name: 'First Bite', desc: 'Log your first meal', emoji: '🍴', counter: 'meals', threshold: 1, coins: 25 },
  { id: 'snap_happy', name: 'Snap Happy', desc: '10 photo logs', emoji: '📸', counter: 'photos', threshold: 10, coins: 40 },
  { id: 'shutterbug', name: 'Shutterbug', desc: '100 photo logs', emoji: '🎞️', counter: 'photos', threshold: 100, coins: 100 },
  { id: 'wordsmith', name: 'Wordsmith', desc: '25 text logs', emoji: '✍️', counter: 'textLogs', threshold: 25, coins: 40 },
  { id: 'chatterbox', name: 'Chatterbox', desc: '10 voice logs', emoji: '🎙️', counter: 'voiceLogs', threshold: 10, coins: 40 },
  { id: 'beep_boop', name: 'Beep Boop', desc: '10 barcode scans', emoji: '🏷️', counter: 'barcodes', threshold: 10, coins: 40 },
  { id: 'librarian', name: 'Librarian', desc: '25 database searches', emoji: '📚', counter: 'searches', threshold: 25, coins: 40 },
  { id: 'week_warrior', name: 'Week Warrior', desc: '7 day streak', emoji: '🔥', counter: 'bestStreak', threshold: 7, coins: 50 },
  { id: 'fortnight_force', name: 'Fortnight Force', desc: '14 day streak', emoji: '🔥', counter: 'bestStreak', threshold: 14, coins: 75 },
  { id: 'monthly_legend', name: 'Monthly Legend', desc: '30 day streak', emoji: '🏅', counter: 'bestStreak', threshold: 30, coins: 100 },
  { id: 'century', name: 'Century', desc: '100 day streak', emoji: '💯', counter: 'bestStreak', threshold: 100, coins: 100 },
  { id: 'hydro_homie', name: 'Hydro Homie', desc: 'Water goal on 7 days', emoji: '💧', counter: 'waterGoalDays', threshold: 7, coins: 40 },
  { id: 'aqua_legend', name: 'Aqua Legend', desc: 'Water goal on 30 days', emoji: '🌊', counter: 'waterGoalDays', threshold: 30, coins: 80 },
  { id: 'scale_friend', name: 'Scale Friend', desc: '10 weigh-ins', emoji: '⚖️', counter: 'weighIns', threshold: 10, coins: 40 },
  { id: 'trend_setter', name: 'Trend Setter', desc: 'First target recalibration', emoji: '📐', counter: 'recalibrations', threshold: 1, coins: 60 },
  { id: 'protein_punch', name: 'Protein Punch', desc: 'Protein target on 10 days', emoji: '💪', counter: 'proteinDays', threshold: 10, coins: 50 },
  { id: 'fibre_fan', name: 'Fibre Fan', desc: 'Fibre target on 10 days', emoji: '🥦', counter: 'fibreDays', threshold: 10, coins: 50 },
  { id: 'balanced', name: 'Balanced', desc: 'Within 10% of target on 10 days', emoji: '🎯', counter: 'withinTargetDays', threshold: 10, coins: 60 },
  { id: 'faster', name: 'Faster', desc: '10 completed fasts', emoji: '⏳', counter: 'fasts', threshold: 10, coins: 50 },
  { id: 'early_bird', name: 'Early Bird', desc: '10 breakfasts before 9am', emoji: '🐦', counter: 'earlyBreakfasts', threshold: 10, coins: 40 },
  { id: 'honest_eater', name: 'Honest Eater', desc: 'Edited 50 AI estimates', emoji: '🧐', counter: 'aiLinesEdited', threshold: 50, coins: 60 },
  { id: 'big_spender', name: 'Big Spender', desc: 'Bought 5 shop items', emoji: '🛍️', counter: 'purchases', threshold: 5, coins: 30 },
  { id: 'fashionista', name: 'Fashionista', desc: 'Own 5 outfits', emoji: '👒', counter: 'outfitsOwned', threshold: 5, coins: 50 },
  { id: 'comeback_kid', name: 'Comeback Kid', desc: 'Rebuilt a streak to 7 after a break', emoji: '🔁', counter: 'comebacks', threshold: 1, coins: 60 },
  { id: 'quokkal_legend', name: 'Quokkal Legend', desc: 'Your quokka reached legend', emoji: '👑', counter: 'legend', threshold: 1, coins: 100 },
];
