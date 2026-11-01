export type Status = 'F' | 'H' | 'A';
export type MonthKey = string;   // 'YYYY-MM'
export type DayKey = string;     // 'YYYY-MM-DD'

export interface RateEntry {
  effectiveFrom: MonthKey;
  full: number;
  half: number;
}

export interface Reminder {
  enabled: boolean;
  dayOfMonth: number;
  hour: number;
  minute: number;
  forMonth: 'previous' | 'same';
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  joinedOn: DayKey;
  leftOn?: DayKey;
  active: boolean;
  rates: RateEntry[];
  reminder: Reminder;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceDoc {
  employeeId: string;
  month: MonthKey;
  days: Record<string, Status>;
  updatedAt?: string;
}

export interface Payment {
  employeeId: string;
  month: MonthKey;
  amount: number;
  paidOn: DayKey;
  note?: string;
  createdAt?: string;
}

export interface MonthSalary {
  full: number;
  half: number;
  absent: number;
  unmarked: number;
  amount: number;
  rate: RateEntry;
}

export interface DueNowItem {
  employee: Employee;
  salaryMonth: MonthKey;
  dueDate: DayKey;
  overdueDays: number;
}
