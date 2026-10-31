import type { Employee, MonthKey, MonthSalary, Status } from './types';
import {
  daysInMonth,
  formatDayKey,
  monthOf,
  parseMonthKey,
  todayKey,
  compareDays,
} from './dates';
import { getRateForMonth } from './rates';

/**
 * Computes monthly salary, attendance counts, and unmarked days for an employee in a given month.
 *
 * Formula:
 * amount = (count of 'F') * rate.full + (count of 'H') * rate.half
 *
 * Eligible days:
 * Days in the month that are >= joinedOn, <= leftOn (if set), and <= asOfToday (cannot mark future days).
 *
 * Unmarked:
 * Count of eligible days where no status ('F', 'H', 'A') was recorded.
 */
export function computeMonthSalary(
  employee: Employee,
  month: MonthKey,
  days: Record<string, Status> = {},
  asOfToday: string = todayKey()
): MonthSalary {
  const rate = getRateForMonth(employee.rates, month);
  const totalDays = daysInMonth(month);
  const { year, month: monthNum } = parseMonthKey(month);

  let full = 0;
  let half = 0;
  let absent = 0;
  let unmarked = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dayKey = formatDayKey(year, monthNum, d);

    // Check eligibility
    const isAfterJoined = compareDays(dayKey, employee.joinedOn) >= 0;
    const isBeforeLeft = !employee.leftOn || compareDays(dayKey, employee.leftOn) <= 0;
    const isNotFuture = compareDays(dayKey, asOfToday) <= 0;

    const isEligible = isAfterJoined && isBeforeLeft && isNotFuture;

    const status = days[String(d)] || days[dayKey];

    if (status === 'F') {
      full++;
    } else if (status === 'H') {
      half++;
    } else if (status === 'A') {
      absent++;
    } else if (isEligible) {
      unmarked++;
    }
  }

  const amount = full * rate.full + half * rate.half;

  return {
    full,
    half,
    absent,
    unmarked,
    amount,
    rate,
  };
}
