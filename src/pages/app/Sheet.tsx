import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useEmployees } from '@/features/employees/useEmployees';
import { useAttendanceMonth } from '@/features/attendance/useAttendanceMonth';
import { usePayments } from '@/features/payments/usePayments';
import { SheetGrid } from '@/features/attendance/SheetGrid';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Loading';
import { ErrorState } from '@/components/shared/ErrorState';
import { monthOf, todayKey } from '@/domain/dates';
import { seedDemoData } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';
import type { MonthKey } from '@/domain/types';

export function Sheet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentMonth = monthOf(todayKey());
  const selectedMonth: MonthKey = searchParams.get('month') || currentMonth;

  const { employees, activeEmployees, loading: loadingEmployees, error: errorEmployees } =
    useEmployees();
  const { daysMapByEmployee, loading: loadingAttendance, setDayStatus } =
    useAttendanceMonth(selectedMonth);
  const { paymentsMapByEmployee, loading: loadingPayments } =
    usePayments(selectedMonth);

  const handleMonthChange = (newMonth: MonthKey) => {
    setSearchParams({ month: newMonth });
  };

  const handleLoadDemo = () => {
    if (user) {
      seedDemoData(user.uid);
    }
  };

  const isLoading = loadingEmployees || loadingAttendance || loadingPayments;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title={strings.sheet.title} subtitle={strings.sheet.subtitle} />
        <TableSkeleton rows={8} cols={10} />
      </div>
    );
  }

  if (errorEmployees) {
    return (
      <ErrorState
        message={errorEmployees.message}
        errorCode={errorEmployees.firestoreCode || errorEmployees.code}
        errorPath={errorEmployees.path}
        operation={errorEmployees.operation}
      />
    );
  }

  // Include active employees plus any archived employees that have attendance or payments in this month
  const visibleEmployees = employees.filter((emp) => {
    if (emp.active) return true;
    const hasAttendance = daysMapByEmployee.has(emp.id);
    const hasPayment = paymentsMapByEmployee.has(emp.id);
    return hasAttendance || hasPayment;
  });

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/app');
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>
      </div>

      <PageHeader title={strings.sheet.title} subtitle={strings.sheet.subtitle}>
        <MonthPicker value={selectedMonth} onChange={handleMonthChange} />
      </PageHeader>

      {visibleEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={strings.today.emptyTitle}
          description="Add employees to view and edit attendance on the spreadsheet."
          actionLabel={strings.today.addEmployee}
          onAction={() => navigate('/app/employees/new')}
          secondaryActionLabel={strings.demo.loadDemo}
          onSecondaryAction={handleLoadDemo}
        />
      ) : (
        <SheetGrid
          employees={visibleEmployees}
          month={selectedMonth}
          daysMapByEmployee={daysMapByEmployee}
          paymentsMapByEmployee={paymentsMapByEmployee}
          onSetDayStatus={setDayStatus}
        />
      )}
    </div>
  );
}
