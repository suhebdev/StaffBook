import { useEffect, useState, useMemo } from 'react';
import type { DueNowItem, Employee, MonthKey, Payment } from '@/domain/types';
import { repo } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import { addMonths, monthOf, todayKey } from '@/domain/dates';
import { computeDueNow } from '@/domain/reminders';

export function useDueNow(asOfDate: string = todayKey()) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<MonthKey, Payment[]>>({});
  const [loading, setLoading] = useState(true);

  const currentMonth = monthOf(asOfDate);
  const prevMonth1 = addMonths(currentMonth, -1);
  const prevMonth2 = addMonths(currentMonth, -2);
  const months = useMemo(() => [prevMonth2, prevMonth1, currentMonth], [currentMonth, prevMonth1, prevMonth2]);

  useEffect(() => {
    if (!user) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubEmp = repo.subscribeEmployees(
      user.uid,
      (list) => {
        setEmployees(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubs = months.map((m) =>
      repo.subscribePayments(
        user.uid,
        m,
        (pList) => {
          setPaymentsMap((prev) => ({ ...prev, [m]: pList }));
        },
        () => {}
      )
    );

    return () => {
      unsubEmp();
      unsubs.forEach((u) => u());
    };
  }, [user, months]);

  const paidKeys = useMemo(() => {
    const keys = new Set<string>();
    Object.values(paymentsMap).forEach((list) => {
      list.forEach((p) => {
        keys.add(`${p.employeeId}_${p.month}`);
      });
    });
    return keys;
  }, [paymentsMap]);

  const dueNowItems: DueNowItem[] = useMemo(() => {
    return computeDueNow(employees, paidKeys, asOfDate);
  }, [employees, paidKeys, asOfDate]);

  return {
    dueNowItems,
    loading,
  };
}
