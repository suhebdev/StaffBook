import type {
  AttendanceDoc,
  Employee,
  MonthKey,
  Payment,
  Status,
} from '@/domain/types';
import type { AppError } from '@/lib/errors';
import type { AuthUser, Unsub } from '../auth/types';
import type { DataRepo } from './types';
import {
  createEmptyDataStore,
  generateDemoData,
  type UserDataStore,
} from './seed';

function getStoreKey(uid: string): string {
  return `staffbook:mock:data:${uid}`;
}

function getLegacyStoreKey(uid: string): string {
  return `dihadi:mock:data:${uid}`;
}

function loadStore(uid: string): UserDataStore {
  try {
    const raw =
      localStorage.getItem(getStoreKey(uid)) ||
      localStorage.getItem(getLegacyStoreKey(uid));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return createEmptyDataStore();
}

function saveStore(uid: string, store: UserDataStore): void {
  try {
    localStorage.setItem(getStoreKey(uid), JSON.stringify(store));
  } catch (_) {}
}

type EventType = 'employees' | 'attendance' | 'payments';
interface SubscriptionListener {
  uid: string;
  type: EventType;
  filter?: string; // e.g. month for attendance / payments
  notify: () => void;
}

const listeners = new Set<SubscriptionListener>();

function triggerEvent(uid: string, type: EventType, filter?: string): void {
  listeners.forEach((sub) => {
    if (sub.uid === uid && sub.type === type) {
      if (!sub.filter || !filter || sub.filter === filter) {
        try {
          sub.notify();
        } catch (_) {}
      }
    }
  });
}

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockRepo: DataRepo = {
  async ensureUserProfile(user: AuthUser): Promise<void> {
    await delay(50);
    // Profile ensured in mock store
  },

  subscribeEmployees(
    uid: string,
    cb: (employees: Employee[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    const notify = () => {
      const store = loadStore(uid);
      const list = Object.values(store.employees);
      cb(list);
    };

    const sub: SubscriptionListener = {
      uid,
      type: 'employees',
      notify,
    };

    listeners.add(sub);
    setTimeout(notify, 150);

    return () => {
      listeners.delete(sub);
    };
  },

  async saveEmployee(
    uid: string,
    e: Omit<Employee, 'id'> & { id?: string }
  ): Promise<string> {
    await delay(150);
    const store = loadStore(uid);
    const nowIso = new Date().toISOString();

    const id = e.id || 'emp-' + Math.random().toString(36).substring(2, 9);
    const existing = store.employees[id];

    const employee: Employee = {
      ...e,
      id,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    store.employees[id] = employee;
    saveStore(uid, store);

    triggerEvent(uid, 'employees');
    return id;
  },

  async deleteEmployee(uid: string, employeeId: string): Promise<void> {
    await delay(120);
    const store = loadStore(uid);

    delete store.employees[employeeId];

    // Clean up all attendance docs for this employee
    Object.keys(store.attendance).forEach((key) => {
      if (store.attendance[key]?.employeeId === employeeId) {
        delete store.attendance[key];
      }
    });

    // Clean up all payment records for this employee
    Object.keys(store.payments).forEach((key) => {
      if (store.payments[key]?.employeeId === employeeId) {
        delete store.payments[key];
      }
    });

    saveStore(uid, store);
    triggerEvent(uid, 'employees');
    triggerEvent(uid, 'attendance');
    triggerEvent(uid, 'payments');
  },

  subscribeAttendance(
    uid: string,
    month: MonthKey,
    cb: (docs: AttendanceDoc[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    const notify = () => {
      const store = loadStore(uid);
      const docs = Object.values(store.attendance).filter((doc) => doc.month === month);
      cb(docs);
    };

    const sub: SubscriptionListener = {
      uid,
      type: 'attendance',
      filter: month,
      notify,
    };

    listeners.add(sub);
    setTimeout(notify, 150);

    return () => {
      listeners.delete(sub);
    };
  },

  async setDayStatus(
    uid: string,
    employeeId: string,
    month: MonthKey,
    day: number,
    status: Status | null
  ): Promise<void> {
    await delay(120);
    const store = loadStore(uid);
    const docId = `${employeeId}_${month}`;

    const existingDoc: AttendanceDoc = store.attendance[docId] || {
      employeeId,
      month,
      days: {},
    };

    const days = { ...existingDoc.days };
    if (status) {
      days[String(day)] = status;
    } else {
      delete days[String(day)];
    }

    store.attendance[docId] = {
      ...existingDoc,
      days,
      updatedAt: new Date().toISOString(),
    };

    saveStore(uid, store);
    triggerEvent(uid, 'attendance', month);
  },

  subscribePayments(
    uid: string,
    month: MonthKey,
    cb: (payments: Payment[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    const notify = () => {
      const store = loadStore(uid);
      const payments = Object.values(store.payments).filter((p) => p.month === month);
      cb(payments);
    };

    const sub: SubscriptionListener = {
      uid,
      type: 'payments',
      filter: month,
      notify,
    };

    listeners.add(sub);
    setTimeout(notify, 150);

    return () => {
      listeners.delete(sub);
    };
  },

  async markPaid(uid: string, payment: Payment): Promise<void> {
    await delay(150);
    const store = loadStore(uid);
    const docId = `${payment.employeeId}_${payment.month}`;

    store.payments[docId] = {
      ...payment,
      createdAt: new Date().toISOString(),
    };

    saveStore(uid, store);
    triggerEvent(uid, 'payments', payment.month);
  },

  async undoPaid(uid: string, employeeId: string, month: MonthKey): Promise<void> {
    await delay(150);
    const store = loadStore(uid);
    const docId = `${employeeId}_${month}`;

    delete store.payments[docId];
    saveStore(uid, store);
    triggerEvent(uid, 'payments', month);
  },

  async exportAll(uid: string): Promise<unknown> {
    await delay(150);
    const store = loadStore(uid);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      employees: Object.values(store.employees),
      attendance: Object.values(store.attendance),
      payments: Object.values(store.payments),
    };
  },
};

/**
 * Seed demo data into localStorage for given uid and trigger subscriptions
 */
export function seedDemoData(uid: string): void {
  const data = generateDemoData();
  saveStore(uid, data);
  triggerEvent(uid, 'employees');
  triggerEvent(uid, 'attendance');
  triggerEvent(uid, 'payments');
}

/**
 * Clear all data for given uid
 */
export function clearDemoData(uid: string): void {
  saveStore(uid, createEmptyDataStore());
  triggerEvent(uid, 'employees');
  triggerEvent(uid, 'attendance');
  triggerEvent(uid, 'payments');
}
