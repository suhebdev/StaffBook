import type { AttendanceDoc, Employee, Payment, Status } from '@/domain/types';
import { addMonths, daysInMonth, formatDayKey, formatMonthKey, monthOf, todayKey } from '@/domain/dates';
import { computeMonthSalary } from '@/domain/salary';

export interface UserDataStore {
  employees: Record<string, Employee>;
  attendance: Record<string, AttendanceDoc>; // key: `${employeeId}_${month}`
  payments: Record<string, Payment>;         // key: `${employeeId}_${month}`
}

export function createEmptyDataStore(): UserDataStore {
  return {
    employees: {},
    attendance: {},
    payments: {},
  };
}

/**
 * Creates realistic demo data for testing and mock mode:
 * 6 employees (mix of Indian names), varied rates, one with mid-year rate change,
 * one archived, one joined mid-month, reminders on for 3, deterministic attendance
 * for previous 2 months and current month up to today, payments for older month.
 */
export function generateDemoData(asOfToday: string = todayKey()): UserDataStore {
  const currentMonth = monthOf(asOfToday);
  const prevMonth1 = addMonths(currentMonth, -1);
  const prevMonth2 = addMonths(currentMonth, -2);

  const employees: Record<string, Employee> = {
    'emp-ramesh': {
      id: 'emp-ramesh',
      name: 'Ramesh Patel',
      phone: '9820123456',
      joinedOn: `${prevMonth2}-01`,
      active: true,
      rates: [
        { effectiveFrom: prevMonth2, full: 650, half: 350 },
      ],
      reminder: {
        enabled: true,
        dayOfMonth: 5,
        hour: 10,
        minute: 0,
        forMonth: 'previous',
      },
    },
    'emp-sunita': {
      id: 'emp-sunita',
      name: 'Sunita Sharma',
      phone: '9876543210',
      joinedOn: `${prevMonth2}-01`,
      active: true,
      rates: [
        { effectiveFrom: prevMonth2, full: 550, half: 300 },
        { effectiveFrom: currentMonth, full: 650, half: 350 }, // mid-year rate increase!
      ],
      reminder: {
        enabled: true,
        dayOfMonth: 7,
        hour: 9,
        minute: 30,
        forMonth: 'previous',
      },
    },
    'emp-vikram': {
      id: 'emp-vikram',
      name: 'Vikram Singh',
      phone: '9811223344',
      joinedOn: `${prevMonth1}-12`, // joined mid-month!
      active: true,
      rates: [
        { effectiveFrom: prevMonth1, full: 700, half: 380 },
      ],
      reminder: {
        enabled: true,
        dayOfMonth: 1,
        hour: 10,
        minute: 0,
        forMonth: 'previous',
      },
    },
    'emp-abdul': {
      id: 'emp-abdul',
      name: 'Abdul Rehman',
      phone: '9988776655',
      joinedOn: `${prevMonth2}-01`,
      active: true,
      rates: [
        { effectiveFrom: prevMonth2, full: 600, half: 300 },
      ],
      reminder: {
        enabled: false,
        dayOfMonth: 10,
        hour: 18,
        minute: 0,
        forMonth: 'same',
      },
    },
    'emp-priya': {
      id: 'emp-priya',
      name: 'Priya Joshi',
      phone: '9765432109',
      joinedOn: `${prevMonth2}-01`,
      leftOn: `${prevMonth1}-20`, // archived / left!
      active: false,
      rates: [
        { effectiveFrom: prevMonth2, full: 500, half: 250 },
      ],
      reminder: {
        enabled: false,
        dayOfMonth: 5,
        hour: 10,
        minute: 0,
        forMonth: 'previous',
      },
    },
    'emp-manoj': {
      id: 'emp-manoj',
      name: 'Manoj Kumar',
      phone: '9123456780',
      joinedOn: `${prevMonth2}-15`,
      active: true,
      rates: [
        { effectiveFrom: prevMonth2, full: 580, half: 290 },
      ],
      reminder: {
        enabled: true,
        dayOfMonth: 10,
        hour: 11,
        minute: 0,
        forMonth: 'previous',
      },
    },
  };

  const attendance: Record<string, AttendanceDoc> = {};
  const payments: Record<string, Payment> = {};

  const months = [prevMonth2, prevMonth1, currentMonth];

  // Pseudo-random deterministic generator based on seed
  function getStatus(empIndex: number, day: number, monthIndex: number): Status | null {
    const seed = (empIndex * 37 + day * 13 + monthIndex * 53) % 100;
    if (seed < 70) return 'F';
    if (seed < 85) return 'H';
    if (seed < 95) return 'A';
    return null;
  }

  const empList = Object.values(employees);

  empList.forEach((emp, empIdx) => {
    months.forEach((m, monthIdx) => {
      const daysCount = daysInMonth(m);
      const isCurrent = m === currentMonth;
      const todayParts = asOfToday.split('-').map(Number);
      const maxDay = isCurrent ? todayParts[2] : daysCount;

      const days: Record<string, Status> = {};

      for (let d = 1; d <= maxDay; d++) {
        const dayKey = formatDayKey(Number(m.slice(0, 4)), Number(m.slice(5, 7)), d);

        // Check eligibility
        if (dayKey < emp.joinedOn) continue;
        if (emp.leftOn && dayKey > emp.leftOn) continue;

        const status = getStatus(empIdx, d, monthIdx);
        if (status) {
          days[String(d)] = status;
        }
      }

      const docId = `${emp.id}_${m}`;
      attendance[docId] = {
        employeeId: emp.id,
        month: m,
        days,
        updatedAt: new Date().toISOString(),
      };

      // Older month (prevMonth2) gets recorded payment
      if (m === prevMonth2 && emp.joinedOn <= `${prevMonth2}-28`) {
        const sal = computeMonthSalary(emp, m, days, asOfToday);
        if (sal.amount > 0) {
          payments[docId] = {
            employeeId: emp.id,
            month: m,
            amount: sal.amount,
            paidOn: `${prevMonth1}-05`,
            note: 'Bank Transfer / Cash',
            createdAt: new Date().toISOString(),
          };
        }
      }
    });
  });

  return {
    employees,
    attendance,
    payments,
  };
}
