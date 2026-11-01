import { useEffect, useState, useMemo } from 'react';
import type { Employee } from '@/domain/types';
import { repo } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import type { AppError } from '@/lib/errors';

export function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!user) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = repo.subscribeEmployees(
      user.uid,
      (data) => {
        setEmployees(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.active),
    [employees]
  );

  const archivedEmployees = useMemo(
    () => employees.filter((e) => !e.active),
    [employees]
  );

  const saveEmployee = async (e: Omit<Employee, 'id'> & { id?: string }) => {
    if (!user) throw new Error('Not authenticated');
    return repo.saveEmployee(user.uid, e);
  };

  const deleteEmployee = async (employeeId: string) => {
    if (!user) throw new Error('Not authenticated');
    return repo.deleteEmployee(user.uid, employeeId);
  };

  return {
    employees,
    activeEmployees,
    archivedEmployees,
    loading,
    error,
    saveEmployee,
    deleteEmployee,
  };
}
