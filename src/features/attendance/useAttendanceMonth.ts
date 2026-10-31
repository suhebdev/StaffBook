import { useEffect, useState, useMemo } from 'react';
import type { AttendanceDoc, MonthKey, Status } from '@/domain/types';
import { repo } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import type { AppError } from '@/lib/errors';

export function useAttendanceMonth(month: MonthKey) {
  const { user } = useAuth();
  const [attendanceDocs, setAttendanceDocs] = useState<AttendanceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!user) {
      setAttendanceDocs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = repo.subscribeAttendance(
      user.uid,
      month,
      (docs) => {
        setAttendanceDocs(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, month]);

  // Map employeeId -> Record<dayNumber, Status>
  const daysMapByEmployee = useMemo(() => {
    const map = new Map<string, Record<string, Status>>();
    attendanceDocs.forEach((doc) => {
      map.set(doc.employeeId, doc.days);
    });
    return map;
  }, [attendanceDocs]);

  const setDayStatus = async (
    employeeId: string,
    day: number,
    status: Status | null
  ) => {
    if (!user) throw new Error('Not authenticated');
    return repo.setDayStatus(user.uid, employeeId, month, day, status);
  };

  return {
    attendanceDocs,
    daysMapByEmployee,
    loading,
    error,
    setDayStatus,
  };
}
