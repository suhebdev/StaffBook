import { useEffect, useState, useMemo } from 'react';
import type { MonthKey, Payment } from '@/domain/types';
import { repo } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import type { AppError } from '@/lib/errors';

export function usePayments(month: MonthKey) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = repo.subscribePayments(
      user.uid,
      month,
      (list) => {
        setPayments(list);
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

  // Map employeeId -> Payment
  const paymentsMapByEmployee = useMemo(() => {
    const map = new Map<string, Payment>();
    payments.forEach((p) => {
      map.set(p.employeeId, p);
    });
    return map;
  }, [payments]);

  const markPaid = async (payment: Payment) => {
    if (!user) throw new Error('Not authenticated');
    return repo.markPaid(user.uid, payment);
  };

  const undoPaid = async (employeeId: string, paymentMonth: MonthKey) => {
    if (!user) throw new Error('Not authenticated');
    return repo.undoPaid(user.uid, employeeId, paymentMonth);
  };

  return {
    payments,
    paymentsMapByEmployee,
    loading,
    error,
    markPaid,
    undoPaid,
  };
}
