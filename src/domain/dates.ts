import type { DayKey, MonthKey } from './types';

export function parseDayKey(dayKey: DayKey): { year: number; month: number; day: number } {
  const parts = dayKey.split('-').map(Number);
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  };
}

export function parseMonthKey(monthKey: MonthKey): { year: number; month: number } {
  const parts = monthKey.split('-').map(Number);
  return {
    year: parts[0],
    month: parts[1],
  };
}

export function formatDayKey(year: number, month: number, day: number): DayKey {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function formatMonthKey(year: number, month: number): MonthKey {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}`;
}

/** Returns today in YYYY-MM-DD using local time (never UTC parsing) */
export function todayKey(): DayKey {
  const now = new Date();
  return formatDayKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Given YYYY-MM-DD, returns YYYY-MM */
export function monthOf(dayKey: DayKey): MonthKey {
  return dayKey.slice(0, 7);
}

/** Returns the number of days in the given month (handles leap years correctly) */
export function daysInMonth(monthKey: MonthKey): number {
  const { year, month } = parseMonthKey(monthKey);
  // Day 0 of next month is the last day of current month in local time
  return new Date(year, month, 0).getDate();
}

/** Adds n months to a MonthKey (n can be negative) */
export function addMonths(monthKey: MonthKey, n: number): MonthKey {
  const { year, month } = parseMonthKey(monthKey);
  const totalMonths = year * 12 + (month - 1) + n;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return formatMonthKey(newYear, newMonth);
}

/** Compares two month keys. Returns negative if m1 < m2, 0 if equal, positive if m1 > m2 */
export function compareMonths(m1: MonthKey, m2: MonthKey): number {
  return m1.localeCompare(m2);
}

/** Compares two day keys. Returns negative if d1 < d2, 0 if equal, positive if d1 > d2 */
export function compareDays(d1: DayKey, d2: DayKey): number {
  return d1.localeCompare(d2);
}

/** Returns d1 - d2 in days */
export function daysDifference(d1: DayKey, d2: DayKey): number {
  const p1 = parseDayKey(d1);
  const p2 = parseDayKey(d2);
  const date1 = new Date(p1.year, p1.month - 1, p1.day).getTime();
  const date2 = new Date(p2.year, p2.month - 1, p2.day).getTime();
  return Math.round((date1 - date2) / (1000 * 60 * 60 * 24));
}

/** Formats a month key for display: e.g. "Oct 2026" or "October 2026" */
export function formatDisplayMonth(monthKey: MonthKey, format: 'short' | 'long' = 'short'): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', {
    month: format === 'short' ? 'short' : 'long',
    year: 'numeric',
  });
}

/** Formats a day key for display: e.g. "19 Oct 2026" */
export function formatDisplayDate(dayKey: DayKey): string {
  const { year, month, day } = parseDayKey(dayKey);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Get weekday initial / name for dayOfMonth in monthKey */
export function getWeekdayName(monthKey: MonthKey, day: number, style: 'narrow' | 'short' = 'narrow'): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: style });
}

/** Check if day is weekend (Sunday = 0, Saturday = 6) */
export function isWeekend(monthKey: MonthKey, day: number): boolean {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export interface DayEligibility {
  eligible: boolean;
  reason?: 'before_joined' | 'after_left' | 'future';
}

export function checkDayEligibility(
  date: DayKey,
  joinedOn: DayKey,
  leftOn?: DayKey,
  asOfToday: DayKey = todayKey()
): DayEligibility {
  if (compareDays(date, asOfToday) > 0) {
    return { eligible: false, reason: 'future' };
  }
  if (compareDays(date, joinedOn) < 0) {
    return { eligible: false, reason: 'before_joined' };
  }
  if (leftOn && compareDays(date, leftOn) > 0) {
    return { eligible: false, reason: 'after_left' };
  }
  return { eligible: true };
}
