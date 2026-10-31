import type { Employee, AttendanceDoc, Payment, MonthKey, Status } from '@/domain/types';
import type { AppError } from '@/lib/errors';
import type { AuthUser, Unsub } from '../auth/types';

export interface DataRepo {
  ensureUserProfile(user: AuthUser): Promise<void>;
  subscribeEmployees(
    uid: string,
    cb: (employees: Employee[]) => void,
    onError: (e: AppError) => void
  ): Unsub;
  saveEmployee(
    uid: string,
    e: Omit<Employee, 'id'> & { id?: string }
  ): Promise<string>;
  deleteEmployee(uid: string, employeeId: string): Promise<void>;
  subscribeAttendance(
    uid: string,
    month: MonthKey,
    cb: (docs: AttendanceDoc[]) => void,
    onError: (e: AppError) => void
  ): Unsub;
  setDayStatus(
    uid: string,
    employeeId: string,
    month: MonthKey,
    day: number,
    status: Status | null
  ): Promise<void>;
  subscribePayments(
    uid: string,
    month: MonthKey,
    cb: (payments: Payment[]) => void,
    onError: (e: AppError) => void
  ): Unsub;
  markPaid(uid: string, payment: Payment): Promise<void>;
  undoPaid(uid: string, employeeId: string, month: MonthKey): Promise<void>;
  exportAll(uid: string): Promise<unknown>; // JSON backup
}
