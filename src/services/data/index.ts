import type { DataRepo } from './types';
import type { AuthUser, Unsub } from '../auth/types';
import type {
  AttendanceDoc,
  Employee,
  MonthKey,
  Payment,
  Status,
} from '@/domain/types';
import type { AppError } from '@/lib/errors';

export * from './types';
import { isFirebaseConfigured } from '../firebase';

export const isMockMode =
  import.meta.env.VITE_DATA_MODE === 'mock' || !isFirebaseConfigured;

let cachedRepo: DataRepo | null = null;

async function getDataRepo(): Promise<DataRepo> {
  if (cachedRepo) return cachedRepo;
  if (isMockMode) {
    const { mockRepo } = await import('./mockRepo');
    cachedRepo = mockRepo;
  } else {
    const { firebaseRepo } = await import('./firebaseRepo');
    cachedRepo = firebaseRepo;
  }
  return cachedRepo;
}

export const repo: DataRepo = {
  async ensureUserProfile(user: AuthUser): Promise<void> {
    const r = await getDataRepo();
    return r.ensureUserProfile(user);
  },

  subscribeEmployees(
    uid: string,
    cb: (employees: Employee[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    let innerUnsub: Unsub | null = null;
    let isCancelled = false;

    getDataRepo()
      .then((r) => {
        if (isCancelled) return;
        innerUnsub = r.subscribeEmployees(uid, cb, onError);
      })
      .catch((err) => {
        if (!isCancelled) onError(err);
      });

    return () => {
      isCancelled = true;
      if (innerUnsub) {
        innerUnsub();
      }
    };
  },

  async saveEmployee(
    uid: string,
    e: Omit<Employee, 'id'> & { id?: string }
  ): Promise<string> {
    const r = await getDataRepo();
    return r.saveEmployee(uid, e);
  },

  async deleteEmployee(uid: string, employeeId: string): Promise<void> {
    const r = await getDataRepo();
    return r.deleteEmployee(uid, employeeId);
  },

  subscribeAttendance(
    uid: string,
    month: MonthKey,
    cb: (docs: AttendanceDoc[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    let innerUnsub: Unsub | null = null;
    let isCancelled = false;

    getDataRepo()
      .then((r) => {
        if (isCancelled) return;
        innerUnsub = r.subscribeAttendance(uid, month, cb, onError);
      })
      .catch((err) => {
        if (!isCancelled) onError(err);
      });

    return () => {
      isCancelled = true;
      if (innerUnsub) {
        innerUnsub();
      }
    };
  },

  async setDayStatus(
    uid: string,
    employeeId: string,
    month: MonthKey,
    day: number,
    status: Status | null
  ): Promise<void> {
    const r = await getDataRepo();
    return r.setDayStatus(uid, employeeId, month, day, status);
  },

  subscribePayments(
    uid: string,
    month: MonthKey,
    cb: (payments: Payment[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    let innerUnsub: Unsub | null = null;
    let isCancelled = false;

    getDataRepo()
      .then((r) => {
        if (isCancelled) return;
        innerUnsub = r.subscribePayments(uid, month, cb, onError);
      })
      .catch((err) => {
        if (!isCancelled) onError(err);
      });

    return () => {
      isCancelled = true;
      if (innerUnsub) {
        innerUnsub();
      }
    };
  },

  async markPaid(uid: string, payment: Payment): Promise<void> {
    const r = await getDataRepo();
    return r.markPaid(uid, payment);
  },

  async undoPaid(uid: string, employeeId: string, month: MonthKey): Promise<void> {
    const r = await getDataRepo();
    return r.undoPaid(uid, employeeId, month);
  },

  async exportAll(uid: string): Promise<unknown> {
    const r = await getDataRepo();
    return r.exportAll(uid);
  },
};

export async function seedDemoData(uid: string): Promise<void> {
  if (isMockMode) {
    const { seedDemoData: seed } = await import('./mockRepo');
    seed(uid);
  }
}

export async function clearDemoData(uid: string): Promise<void> {
  if (isMockMode) {
    const { clearDemoData: clear } = await import('./mockRepo');
    clear(uid);
  }
}
