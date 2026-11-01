import { describe, it, expect } from 'vitest';
import { formatINR, parseMoneyInput } from '../money';
import {
  daysInMonth,
  addMonths,
  compareMonths,
  compareDays,
  daysDifference,
  parseDayKey,
  formatDayKey,
  checkDayEligibility,
} from '../dates';
import { getRateForMonth, applyRateChange } from '../rates';
import { computeMonthSalary } from '../salary';
import { computeDueNow } from '../reminders';
import { generateSummaryCsv } from '@/lib/csv';
import { generateEmployeeIcs } from '@/lib/ics';
import type { Employee, RateEntry } from '../types';

const defaultEmployee: Employee = {
  id: 'emp-1',
  name: 'Ramesh Patel',
  joinedOn: '2026-01-01',
  active: true,
  rates: [{ effectiveFrom: '2026-01', full: 600, half: 300 }],
  reminder: { enabled: true, dayOfMonth: 5, hour: 10, minute: 0, forMonth: 'previous' },
};

describe('M2 Domain: Money Formatting & Parsing', () => {
  it('formats 0 as ₹0', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('formats small amounts up to 3 digits without comma', () => {
    expect(formatINR(50)).toBe('₹50');
    expect(formatINR(500)).toBe('₹500');
  });

  it('formats 4 and 5 digit numbers in Indian format (thousands)', () => {
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(25000)).toBe('₹25,000');
  });

  it('formats 6 digits (lakhs) with 2-digit grouping', () => {
    expect(formatINR(123456)).toBe('₹1,23,456');
  });

  it('formats 7 digits (10 lakhs) as 12,34,567 per spec', () => {
    expect(formatINR(1234567)).toBe('₹12,34,567');
  });

  it('formats 8 digits (crores)', () => {
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
  });

  it('handles negative numbers safely in formatINR', () => {
    expect(formatINR(-500)).toBe('-₹500');
    expect(formatINR(-1234567)).toBe('-₹12,34,567');
  });

  it('parses numeric string to integer', () => {
    expect(parseMoneyInput('650')).toBe(650);
    expect(parseMoneyInput('₹ 1,500 ')).toBe(1500);
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
  });
});

describe('M2 Domain: Dates & Helpers', () => {
  it('calculates days in month including leap year 2024 vs non-leap 2025/2026', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2025-02')).toBe(28);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2026-04')).toBe(30);
    expect(daysInMonth('2026-07')).toBe(31);
  });

  it('adds months across year boundaries', () => {
    expect(addMonths('2026-01', 1)).toBe('2026-02');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-06', -6)).toBe('2025-12');
  });

  it('compares months and days', () => {
    expect(compareMonths('2026-01', '2026-02')).toBeLessThan(0);
    expect(compareMonths('2026-05', '2026-05')).toBe(0);
    expect(compareDays('2026-03-10', '2026-03-15')).toBeLessThan(0);
  });

  it('computes days difference accurately without timezone drift', () => {
    expect(daysDifference('2026-03-15', '2026-03-10')).toBe(5);
    expect(daysDifference('2026-03-01', '2026-02-28')).toBe(1);
  });

  it('checks day eligibility for future, joining, and leaving dates', () => {
    const joined = '2026-03-10';
    const left = '2026-03-20';
    const asOf = '2026-03-25';

    expect(checkDayEligibility('2026-03-05', joined, left, asOf).eligible).toBe(false);
    expect(checkDayEligibility('2026-03-05', joined, left, asOf).reason).toBe('before_joined');

    expect(checkDayEligibility('2026-03-12', joined, left, asOf).eligible).toBe(true);

    expect(checkDayEligibility('2026-03-22', joined, left, asOf).eligible).toBe(false);
    expect(checkDayEligibility('2026-03-22', joined, left, asOf).reason).toBe('after_left');

    expect(checkDayEligibility('2026-03-28', joined, undefined, '2026-03-25').eligible).toBe(false);
    expect(checkDayEligibility('2026-03-28', joined, undefined, '2026-03-25').reason).toBe('future');
  });

  it('formats day key and parses day key correctly', () => {
    expect(formatDayKey(2026, 4, 9)).toBe('2026-04-09');
    expect(parseDayKey('2026-04-09')).toEqual({ year: 2026, month: 4, day: 9 });
  });
});

describe('M2 Domain: Rates Selection and Changes', () => {
  const rates: RateEntry[] = [
    { effectiveFrom: '2026-01', full: 500, half: 250 },
    { effectiveFrom: '2026-06', full: 600, half: 300 },
  ];

  it('returns earliest rate for month prior to first entry', () => {
    const rate = getRateForMonth(rates, '2025-11');
    expect(rate.full).toBe(500);
  });

  it('returns appropriate rate for past months before rate increase', () => {
    expect(getRateForMonth(rates, '2026-01').full).toBe(500);
    expect(getRateForMonth(rates, '2026-05').full).toBe(500);
  });

  it('returns updated rate for effective month and subsequent months', () => {
    expect(getRateForMonth(rates, '2026-06').full).toBe(600);
    expect(getRateForMonth(rates, '2026-10').full).toBe(600);
  });

  it('handles rates when only one initial entry exists', () => {
    const singleRate: RateEntry[] = [{ effectiveFrom: '2026-01', full: 400, half: 200 }];
    expect(getRateForMonth(singleRate, '2025-10').full).toBe(400);
    expect(getRateForMonth(singleRate, '2026-05').full).toBe(400);
  });

  it('applies new rate change without mutating past records and maintains sort order', () => {
    const updated = applyRateChange(rates, { effectiveFrom: '2026-04', full: 550, half: 275 });
    expect(updated).toHaveLength(3);
    expect(updated[0].effectiveFrom).toBe('2026-01');
    expect(updated[1].effectiveFrom).toBe('2026-04');
    expect(updated[2].effectiveFrom).toBe('2026-06');
    expect(getRateForMonth(updated, '2026-04').full).toBe(550);
    expect(getRateForMonth(updated, '2026-03').full).toBe(500);
  });
});

describe('M2 Domain: Salary Computation', () => {
  it('computes salary for mixed attendance (Full, Half, Absent)', () => {
    const days = {
      '1': 'F' as const,
      '2': 'F' as const,
      '3': 'H' as const,
      '4': 'A' as const,
    };
    const result = computeMonthSalary(defaultEmployee, '2026-03', days, '2026-03-31');
    expect(result.full).toBe(2);
    expect(result.half).toBe(1);
    expect(result.absent).toBe(1);
    expect(result.amount).toBe(2 * 600 + 1 * 300); // 1500
    expect(result.unmarked).toBe(27);
  });

  it('handles mid-month joiner: days before joinedOn are NOT unmarked and NOT eligible', () => {
    const midJoiner: Employee = {
      ...defaultEmployee,
      joinedOn: '2026-03-15',
    };
    const result = computeMonthSalary(midJoiner, '2026-03', { '15': 'F', '16': 'H' }, '2026-03-31');
    expect(result.full).toBe(1);
    expect(result.half).toBe(1);
    expect(result.amount).toBe(900);
    expect(result.unmarked).toBe(15);
  });

  it('handles leaving date: days after leftOn are NOT unmarked and NOT eligible', () => {
    const leaver: Employee = {
      ...defaultEmployee,
      joinedOn: '2026-03-01',
      leftOn: '2026-03-10',
    };
    const result = computeMonthSalary(leaver, '2026-03', { '1': 'F', '2': 'F', '3': 'F' }, '2026-03-31');
    expect(result.full).toBe(3);
    expect(result.amount).toBe(1800);
    expect(result.unmarked).toBe(7);
  });

  it('evaluates current month up to today: future days are NOT unmarked', () => {
    const result = computeMonthSalary(defaultEmployee, '2026-03', { '1': 'F', '2': 'F' }, '2026-03-05');
    expect(result.full).toBe(2);
    expect(result.amount).toBe(1200);
    expect(result.unmarked).toBe(3);
  });

  it('handles empty attendance record properly (all eligible days unmarked)', () => {
    const result = computeMonthSalary(defaultEmployee, '2026-02', {}, '2026-02-28');
    expect(result.full).toBe(0);
    expect(result.half).toBe(0);
    expect(result.absent).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.unmarked).toBe(28);
  });
});

describe('M2 Domain: Due Now Reminders', () => {
  const employees: Employee[] = [
    {
      id: 'emp-feb-31',
      name: 'Feb Clamp Test',
      joinedOn: '2025-01-01',
      active: true,
      rates: [{ effectiveFrom: '2025-01', full: 500, half: 250 }],
      reminder: { enabled: true, dayOfMonth: 31, hour: 10, minute: 0, forMonth: 'previous' },
    },
    {
      id: 'emp-same-month',
      name: 'Same Month Test',
      joinedOn: '2025-01-01',
      active: true,
      rates: [{ effectiveFrom: '2025-01', full: 500, half: 250 }],
      reminder: { enabled: true, dayOfMonth: 15, hour: 10, minute: 0, forMonth: 'same' },
    },
    {
      id: 'emp-disabled',
      name: 'Disabled Reminder',
      joinedOn: '2025-01-01',
      active: true,
      rates: [{ effectiveFrom: '2025-01', full: 500, half: 250 }],
      reminder: { enabled: false, dayOfMonth: 5, hour: 10, minute: 0, forMonth: 'previous' },
    },
  ];

  it('clamps pay day 31 in February to Feb 28 on non-leap year', () => {
    const paidKeys = new Set<string>();
    const due = computeDueNow([employees[0]], paidKeys, '2026-03-01');
    expect(due).toHaveLength(1);
    expect(due[0].dueDate).toBe('2026-02-28');
    expect(due[0].salaryMonth).toBe('2026-01');
    expect(due[0].overdueDays).toBe(1);
  });

  it('handles forMonth="same" vs forMonth="previous"', () => {
    const unpaidDue = computeDueNow([employees[1]], new Set(), '2026-03-20');
    expect(unpaidDue).toHaveLength(2);
    expect(unpaidDue[0].salaryMonth).toBe('2026-02');
    expect(unpaidDue[1].salaryMonth).toBe('2026-03');

    const paidFeb = new Set(['emp-same-month_2026-02']);
    const singleDue = computeDueNow([employees[1]], paidFeb, '2026-03-20');
    expect(singleDue).toHaveLength(1);
    expect(singleDue[0].salaryMonth).toBe('2026-03');
    expect(singleDue[0].dueDate).toBe('2026-03-15');
    expect(singleDue[0].overdueDays).toBe(5);
  });

  it('filters out already paid months', () => {
    const paidKeys = new Set<string>(['emp-feb-31_2026-01']);
    const due = computeDueNow([employees[0]], paidKeys, '2026-03-01');
    expect(due.find((d) => d.employee.id === 'emp-feb-31' && d.salaryMonth === '2026-01')).toBeUndefined();
  });

  it('ignores employees with reminder disabled or inactive', () => {
    const paidKeys = new Set<string>();
    const due = computeDueNow([employees[2]], paidKeys, '2026-03-20');
    expect(due).toHaveLength(0);
  });

  it('sorts multiple due now items by due date', () => {
    const empEarly: Employee = {
      ...defaultEmployee,
      id: 'early-1',
      reminder: { enabled: true, dayOfMonth: 2, hour: 9, minute: 0, forMonth: 'same' },
    };
    const empLate: Employee = {
      ...defaultEmployee,
      id: 'late-1',
      reminder: { enabled: true, dayOfMonth: 20, hour: 9, minute: 0, forMonth: 'same' },
    };
    const due = computeDueNow([empLate, empEarly], new Set(), '2026-03-25');
    expect(due[0].employee.id).toBe('early-1');
  });
});

describe('M2 Lib: CSV & ICS generation', () => {
  it('generates CSV with UTF-8 BOM, headers, and quoted RFC 4180 cells', () => {
    const csv = generateSummaryCsv([
      {
        employeeName: 'Sunita "Soni" Sharma',
        month: '2026-03',
        salary: {
          full: 20,
          half: 2,
          absent: 1,
          unmarked: 0,
          amount: 13000,
          rate: { effectiveFrom: '2026-01', full: 600, half: 300 },
        },
        payment: { employeeId: 'emp-1', month: '2026-03', amount: 13000, paidOn: '2026-04-02' },
      },
    ]);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Employee","Month","Full days","Half days"');
    expect(csv).toContain('"Sunita ""Soni"" Sharma"');
    expect(csv).toContain('"13000"');
    expect(csv).toContain('"Paid"');
    expect(csv).toContain('"2026-04-02"');
  });

  it('escapes quotes and special characters in CSV correctly', () => {
    const csv = generateSummaryCsv([
      {
        employeeName: 'Raju, "The Welder"',
        month: '2026-02',
        salary: { full: 10, half: 0, absent: 0, unmarked: 18, amount: 6000, rate: { effectiveFrom: '2026-01', full: 600, half: 300 } },
      },
    ]);
    expect(csv).toContain('"Raju, ""The Welder"""');
  });

  it('generates valid RFC 5545 .ics content with VALARM and CRLF line endings', () => {
    const employee: Employee = {
      id: 'emp-ics',
      name: 'Mohan Lal, Plumber',
      joinedOn: '2026-01-01',
      active: true,
      rates: [{ effectiveFrom: '2026-01', full: 500, half: 250 }],
      reminder: { enabled: true, dayOfMonth: 5, hour: 9, minute: 30, forMonth: 'previous' },
    };

    const ics = generateEmployeeIcs(employee, new Date(2026, 2, 1)); // March 1, 2026
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=5');
    expect(ics).toContain('SUMMARY:Pay salary: Mohan Lal\\, Plumber');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('\r\n');
  });
});
