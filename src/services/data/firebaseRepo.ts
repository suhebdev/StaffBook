import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { DataRepo } from './types';
import type { AuthUser, Unsub } from '../auth/types';
import type {
  AttendanceDoc,
  Employee,
  MonthKey,
  Payment,
  Status,
} from '@/domain/types';
import { AppError, type ErrorDebugInfo } from '@/lib/errors';

export function mapDataError(
  err: unknown,
  debug?: { path?: string; operation?: string }
): AppError {
  if (err instanceof AppError) return err;
  const rawCode = (err as { code?: string })?.code || 'unknown';
  const debugInfo: ErrorDebugInfo = {
    firestoreCode: rawCode,
    path: debug?.path,
    operation: debug?.operation,
  };
  switch (rawCode) {
    case 'permission-denied':
      return new AppError('data/permission', undefined, debugInfo);
    case 'unavailable':
      return new AppError('data/network', undefined, debugInfo);
    default:
      return new AppError('data/network', (err as Error)?.message || undefined, debugInfo);
  }
}

function convertDocToEmployee(id: string, data: Record<string, any>): Employee {
  const createdAtIso = data.createdAt?.toDate
    ? data.createdAt.toDate().toISOString()
    : typeof data.createdAt === 'string'
    ? data.createdAt
    : undefined;

  const updatedAtIso = data.updatedAt?.toDate
    ? data.updatedAt.toDate().toISOString()
    : typeof data.updatedAt === 'string'
    ? data.updatedAt
    : undefined;

  return {
    id,
    name: data.name || '',
    phone: data.phone || undefined,
    joinedOn: data.joinedOn || '',
    leftOn: data.leftOn || undefined,
    active: data.active !== false,
    rates: Array.isArray(data.rates) ? data.rates : [],
    reminder: data.reminder || {
      enabled: false,
      dayOfMonth: 1,
      hour: 9,
      minute: 0,
      forMonth: 'same',
    },
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
  };
}

export const firebaseRepo: DataRepo = {
  async ensureUserProfile(_user: AuthUser): Promise<void> {
    // StaffBook must NOT read, create, update or delete the users/{userId} document itself.
    // That document belongs to other apps in this shared project and has strict schema validation.
    return Promise.resolve();
  },

  subscribeEmployees(
    uid: string,
    cb: (employees: Employee[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    const colRef = collection(db, 'users', uid, 'employees');
    const path = `users/${uid}/employees`;
    const operation = 'list';

    return onSnapshot(
      colRef,
      (snapshot) => {
        const employees: Employee[] = snapshot.docs.map((d) =>
          convertDocToEmployee(d.id, d.data())
        );
        cb(employees);
      },
      (err: any) => {
        const code = err?.code || 'unknown';
        console.error('[Firestore Error]', {
          code,
          path,
          operation,
          message: err?.message,
          error: err,
        });
        onError(mapDataError(err, { path, operation }));
      }
    );
  },

  async saveEmployee(
    uid: string,
    e: Omit<Employee, 'id'> & { id?: string }
  ): Promise<string> {
    const operation = e.id ? 'update' : 'create';
    const path = e.id ? `users/${uid}/employees/${e.id}` : `users/${uid}/employees`;
    try {
      if (e.id) {
        const employeeRef = doc(db, 'users', uid, 'employees', e.id);
        const payload: Record<string, any> = {
          name: e.name,
          joinedOn: e.joinedOn,
          active: e.active,
          rates: e.rates,
          reminder: e.reminder,
          updatedAt: serverTimestamp(),
        };
        if (e.phone !== undefined) payload.phone = e.phone;
        if (e.leftOn !== undefined) payload.leftOn = e.leftOn;

        await setDoc(employeeRef, payload, { merge: true });
        return e.id;
      } else {
        const newRef = doc(collection(db, 'users', uid, 'employees'));
        const payload: Record<string, any> = {
          name: e.name,
          joinedOn: e.joinedOn,
          active: e.active,
          rates: e.rates,
          reminder: e.reminder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (e.phone !== undefined) payload.phone = e.phone;
        if (e.leftOn !== undefined) payload.leftOn = e.leftOn;

        await setDoc(newRef, payload);
        return newRef.id;
      }
    } catch (err: any) {
      const code = err?.code || 'unknown';
      console.error('[Firestore Error]', {
        code,
        path,
        operation,
        message: err?.message,
        error: err,
      });
      throw mapDataError(err, { path, operation });
    }
  },

  async deleteEmployee(uid: string, employeeId: string): Promise<void> {
    const path = `users/${uid}/employees/${employeeId}`;
    const operation = 'delete';
    try {
      // 1. Delete main employee document
      const empRef = doc(db, 'users', uid, 'employees', employeeId);
      await deleteDoc(empRef);

      // 2. Delete all related attendance documents
      try {
        const attQuery = query(
          collection(db, 'users', uid, 'attendance'),
          where('employeeId', '==', employeeId)
        );
        const attSnap = await getDocs(attQuery);
        await Promise.all(attSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch (attErr) {
        console.warn('[Firestore] Note: Could not purge attendance sub-records on employee delete', attErr);
      }

      // 3. Delete all related payment documents
      try {
        const payQuery = query(
          collection(db, 'users', uid, 'payments'),
          where('employeeId', '==', employeeId)
        );
        const paySnap = await getDocs(payQuery);
        await Promise.all(paySnap.docs.map((d) => deleteDoc(d.ref)));
      } catch (payErr) {
        console.warn('[Firestore] Note: Could not purge payment sub-records on employee delete', payErr);
      }
    } catch (err: any) {
      const code = err?.code || 'unknown';
      console.error('[Firestore Error]', {
        code,
        path,
        operation,
        message: err?.message,
        error: err,
      });
      throw mapDataError(err, { path, operation });
    }
  },

  subscribeAttendance(
    uid: string,
    month: MonthKey,
    cb: (docs: AttendanceDoc[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    const q = query(
      collection(db, 'users', uid, 'attendance'),
      where('month', '==', month)
    );
    const path = `users/${uid}/attendance`;
    const operation = 'list';

    return onSnapshot(
      q,
      (snapshot) => {
        const docs: AttendanceDoc[] = snapshot.docs.map((d) => {
          const data = d.data();
          const updatedAtIso = data.updatedAt?.toDate
            ? data.updatedAt.toDate().toISOString()
            : typeof data.updatedAt === 'string'
            ? data.updatedAt
            : undefined;

          return {
            employeeId: data.employeeId,
            month: data.month,
            days: data.days || {},
            updatedAt: updatedAtIso,
          };
        });
        cb(docs);
      },
      (err: any) => {
        const code = err?.code || 'unknown';
        console.error('[Firestore Error]', {
          code,
          path,
          operation,
          message: err?.message,
          error: err,
        });
        onError(mapDataError(err, { path, operation }));
      }
    );
  },

  async setDayStatus(
    uid: string,
    employeeId: string,
    month: MonthKey,
    day: number,
    status: Status | null
  ): Promise<void> {
    const docId = `${employeeId}_${month}`;
    const path = `users/${uid}/attendance/${docId}`;
    const operation = status !== null ? 'update' : 'delete';

    try {
      const attRef = doc(db, 'users', uid, 'attendance', docId);

      if (status !== null) {
        await setDoc(
          attRef,
          {
            employeeId,
            month,
            days: {
              [String(day)]: status,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        try {
          await updateDoc(attRef, {
            [`days.${day}`]: deleteField(),
            updatedAt: serverTimestamp(),
          });
        } catch (err: any) {
          // If document does not exist yet, clearing a day is a no-op
          if (err?.code !== 'not-found') {
            throw err;
          }
        }
      }
    } catch (err: any) {
      const code = err?.code || 'unknown';
      console.error('[Firestore Error]', {
        code,
        path,
        operation,
        message: err?.message,
        error: err,
      });
      throw mapDataError(err, { path, operation });
    }
  },

  subscribePayments(
    uid: string,
    month: MonthKey,
    cb: (payments: Payment[]) => void,
    onError: (e: AppError) => void
  ): Unsub {
    const q = query(
      collection(db, 'users', uid, 'payments'),
      where('month', '==', month)
    );
    const path = `users/${uid}/payments`;
    const operation = 'list';

    return onSnapshot(
      q,
      (snapshot) => {
        const payments: Payment[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAtIso = data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : typeof data.createdAt === 'string'
            ? data.createdAt
            : undefined;

          return {
            employeeId: data.employeeId,
            month: data.month,
            amount: Number(data.amount) || 0,
            paidOn: data.paidOn,
            note: data.note || undefined,
            createdAt: createdAtIso,
          };
        });
        cb(payments);
      },
      (err: any) => {
        const code = err?.code || 'unknown';
        console.error('[Firestore Error]', {
          code,
          path,
          operation,
          message: err?.message,
          error: err,
        });
        onError(mapDataError(err, { path, operation }));
      }
    );
  },

  async markPaid(uid: string, payment: Payment): Promise<void> {
    const docId = `${payment.employeeId}_${payment.month}`;
    const path = `users/${uid}/payments/${docId}`;
    const operation = 'create';
    try {
      const payRef = doc(db, 'users', uid, 'payments', docId);
      const payload: Record<string, any> = {
        employeeId: payment.employeeId,
        month: payment.month,
        amount: payment.amount,
        paidOn: payment.paidOn,
        createdAt: serverTimestamp(),
      };
      if (payment.note) {
        payload.note = payment.note;
      }
      await setDoc(payRef, payload);
    } catch (err: any) {
      const code = err?.code || 'unknown';
      console.error('[Firestore Error]', {
        code,
        path,
        operation,
        message: err?.message,
        error: err,
      });
      throw mapDataError(err, { path, operation });
    }
  },

  async undoPaid(uid: string, employeeId: string, month: MonthKey): Promise<void> {
    const docId = `${employeeId}_${month}`;
    const path = `users/${uid}/payments/${docId}`;
    const operation = 'delete';
    try {
      await deleteDoc(doc(db, 'users', uid, 'payments', docId));
    } catch (err: any) {
      const code = err?.code || 'unknown';
      console.error('[Firestore Error]', {
        code,
        path,
        operation,
        message: err?.message,
        error: err,
      });
      throw mapDataError(err, { path, operation });
    }
  },

  async exportAll(uid: string): Promise<unknown> {
    const path = `users/${uid}/*`;
    const operation = 'get';
    try {
      const [empSnap, attSnap, paySnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'employees')),
        getDocs(collection(db, 'users', uid, 'attendance')),
        getDocs(collection(db, 'users', uid, 'payments')),
      ]);

      const employees = empSnap.docs.map((d) =>
        convertDocToEmployee(d.id, d.data())
      );
      const attendance = attSnap.docs.map((d) => {
        const data = d.data();
        return {
          employeeId: data.employeeId,
          month: data.month,
          days: data.days || {},
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt,
        };
      });
      const payments = paySnap.docs.map((d) => {
        const data = d.data();
        return {
          employeeId: data.employeeId,
          month: data.month,
          amount: Number(data.amount) || 0,
          paidOn: data.paidOn,
          note: data.note || undefined,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
        };
      });

      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        employees,
        attendance,
        payments,
      };
    } catch (err: any) {
      const code = err?.code || 'unknown';
      console.error('[Firestore Error]', {
        code,
        path,
        operation,
        message: err?.message,
        error: err,
      });
      throw mapDataError(err, { path, operation });
    }
  },
};
