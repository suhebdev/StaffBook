import type { Employee } from '@/domain/types';
import { daysInMonth, formatMonthKey } from '@/domain/dates';

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatIcsDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

/**
 * Computes next occurrence of pay day at reminder time (local)
 */
export function getNextPayDayOccurrence(
  dayOfMonth: number,
  hour: number,
  minute: number,
  baseDate: Date = new Date()
): { start: Date; end: Date } {
  let year = baseDate.getFullYear();
  let month = baseDate.getMonth() + 1; // 1-12

  // Check this month
  const currentMonthTotalDays = daysInMonth(formatMonthKey(year, month));
  const clampedDayThisMonth = Math.min(dayOfMonth, currentMonthTotalDays);
  const candidate = new Date(year, month - 1, clampedDayThisMonth, hour, minute, 0);

  let start: Date;
  if (candidate.getTime() > baseDate.getTime()) {
    start = candidate;
  } else {
    // Next month
    if (month === 12) {
      year += 1;
      month = 1;
    } else {
      month += 1;
    }
    const nextMonthTotalDays = daysInMonth(formatMonthKey(year, month));
    const clampedDayNextMonth = Math.min(dayOfMonth, nextMonthTotalDays);
    start = new Date(year, month - 1, clampedDayNextMonth, hour, minute, 0);
  }

  const end = new Date(start.getTime() + 15 * 60 * 1000); // 15 mins
  return { start, end };
}

/**
 * Generates an RFC 5545 compliant .ics string for an employee's salary reminder.
 */
export function generateEmployeeIcs(employee: Employee, baseDate?: Date): string {
  const { dayOfMonth, hour, minute } = employee.reminder;
  const { start, end } = getNextPayDayOccurrence(dayOfMonth, hour, minute, baseDate);

  const rrule =
    dayOfMonth <= 28
      ? `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`
      : 'RRULE:FREQ=MONTHLY;BYMONTHDAY=-1';

  const summary = escapeIcsText(`Pay salary: ${employee.name}`);
  const description = escapeIcsText(
    `Monthly salary payment due for ${employee.name} on StaffBook.`
  );
  const uid = `staffbook-payday-${employee.id}@staffbook.app`;
  const dtstamp = formatIcsDateTime(baseDate || new Date());
  const dtstart = formatIcsDateTime(start);
  const dtend = formatIcsDateTime(end);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StaffBook//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    rrule,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder to pay salary',
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}

/**
 * Downloads the .ics file in browser.
 */
export function downloadEmployeeIcs(employee: Employee): void {
  const ics = generateEmployeeIcs(employee);
  const cleanName = employee.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `staffbook-payday-${cleanName || 'staff'}.ics`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
