/**
 * Day keys are local-time 'YYYY-MM-DD' strings, shifted by `dayStartHour` so a
 * 1am snack lands on the evening before. Everything else is stored as epoch ms.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(ts: number, dayStartHour = 4): string {
  // Shift by a calendar day in local time instead of subtracting a fixed number
  // of milliseconds. A fixed subtraction crosses the wrong local hour when a
  // daylight-saving transition makes the day 23 or 25 hours long.
  const d = new Date(ts);
  if (d.getHours() < dayStartHour) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDayKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

/** Epoch ms when the given day key starts (local time, honouring dayStartHour). */
export function dayStart(key: string, dayStartHour = 4): number {
  const { y, m, d } = parseDayKey(key);
  return new Date(y, m - 1, d, dayStartHour, 0, 0, 0).getTime();
}

export function dayEnd(key: string, dayStartHour = 4): number {
  return dayStart(shiftDayKey(key, 1), dayStartHour) - 1;
}

export function shiftDayKey(key: string, days: number): string {
  const { y, m, d } = parseDayKey(key);
  const dt = new Date(y, m - 1, d + days, 12, 0, 0, 0);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const A = parseDayKey(a);
  const B = parseDayKey(b);
  const ta = Date.UTC(A.y, A.m - 1, A.d);
  const tb = Date.UTC(B.y, B.m - 1, B.d);
  return Math.round((tb - ta) / 86_400_000);
}

export function dayKeyRange(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  while (k <= to) {
    out.push(k);
    k = shiftDayKey(k, 1);
  }
  return out;
}

/** ISO-8601 week key like '2026-W37' (weeks start Monday). */
export function isoWeekKey(key: string): string {
  const { y, m, d } = parseDayKey(key);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

export function todayKey(now: number, dayStartHour = 4): string {
  return toDayKey(now, dayStartHour);
}

export function formatDayLabel(key: string, todayKeyStr: string): string {
  if (key === todayKeyStr) return 'Today';
  if (key === shiftDayKey(todayKeyStr, -1)) return 'Yesterday';
  const { y, m, d } = parseDayKey(key);
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

/** Local hour (0-23) of a timestamp, for "breakfast before 10am" style quests. */
export function localHour(ts: number): number {
  return new Date(ts).getHours();
}
