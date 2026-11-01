import type { DueNowItem, Employee, MonthKey } from './types';
import {
  addMonths,
  compareDays,
  compareMonths,
  daysDifference,
  daysInMonth,
  formatDayKey,
  monthOf,
  parseMonthKey,
  todayKey,
} from './dates';

/**
 * Computes list of overdue / due salaries for the Web "Due now" panel.
 *
 * Algorithm per BUSINESS_LOGIC.md §11:
 * Checks both previous month and current month cursors.
 * Clamps day of month (e.g. day 31 in Feb clamps to 28/29).
 * Checks if due date <= today.
 * Verifies salaryMonth is within employee's joinedOn and leftOn bounds.
 * Filters out already paid salary months.
 * Dedupes by (employeeId, salaryMonth) and sorts by dueDate ascending.
 */
export function computeDueNow(
  employees: Employee[],
  paidKeys: Set<string>,
  today: string = todayKey()
): DueNowItem[] {
  const currentMonth = monthOf(today);
  const prevMonth = addMonths(currentMonth, -1);
  const cursors: MonthKey[] = [prevMonth, currentMonth];

  const results: DueNowItem[] = [];
  const seen = new Set<string>();

  for (const emp of employees) {
    if (!emp.active || !emp.reminder?.enabled) {
      continue;
    }

    for (const cursor of cursors) {
      const { year, month } = parseMonthKey(cursor);
      const totalDays = daysInMonth(cursor);
      const clampedDay = Math.min(emp.reminder.dayOfMonth, totalDays);
      const dueDate = formatDayKey(year, month, clampedDay);

      if (compareDays(dueDate, today) <= 0) {
        const salaryMonth =
          emp.reminder.forMonth === 'previous' ? addMonths(cursor, -1) : cursor;

        const joinedMonth = monthOf(emp.joinedOn);
        const leftMonth = emp.leftOn ? monthOf(emp.leftOn) : null;

        const isAfterJoined = compareMonths(salaryMonth, joinedMonth) >= 0;
        const isBeforeLeft = !leftMonth || compareMonths(salaryMonth, leftMonth) <= 0;
        const isPaid = paidKeys.has(`${emp.id}_${salaryMonth}`);

        if (isAfterJoined && isBeforeLeft && !isPaid) {
          const dedupeKey = `${emp.id}_${salaryMonth}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            results.push({
              employee: emp,
              salaryMonth,
              dueDate,
              overdueDays: Math.max(0, daysDifference(today, dueDate)),
            });
          }
        }
      }
    }
  }

  // Sort by dueDate ascending, then employee name
  return results.sort((a, b) => {
    const cmp = compareDays(a.dueDate, b.dueDate);
    if (cmp !== 0) return cmp;
    return a.employee.name.localeCompare(b.employee.name);
  });
}
