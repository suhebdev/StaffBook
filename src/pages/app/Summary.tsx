import React, { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Printer,
  CreditCard,
  RotateCcw,
  Eye,
  AlertTriangle,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmployees } from '@/features/employees/useEmployees';
import { useAttendanceMonth } from '@/features/attendance/useAttendanceMonth';
import { usePayments } from '@/features/payments/usePayments';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Loading';
import { ErrorState } from '@/components/shared/ErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PaidDialog } from '@/features/payments/PaidDialog';
import {
  monthOf,
  todayKey,
  formatDisplayMonth,
  formatDisplayDate,
} from '@/domain/dates';
import { computeMonthSalary } from '@/domain/salary';
import { formatINR } from '@/domain/money';
import { downloadSummaryCsv, type CsvRowData } from '@/lib/csv';
import { seedDemoData } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';
import type { Employee, MonthKey, Payment } from '@/domain/types';

const AVATAR_COLORS = [
  'from-rose-500/20 to-orange-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'from-sky-500/20 to-blue-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Summary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = todayKey();
  const currentMonth = monthOf(today);
  const selectedMonth: MonthKey = searchParams.get('month') || currentMonth;
  const isCurrentMonth = selectedMonth === currentMonth;

  // Subscriptions
  const { employees, loading: loadingEmployees, error: errorEmployees } = useEmployees();
  const { daysMapByEmployee, loading: loadingAttendance } =
    useAttendanceMonth(selectedMonth);
  const { paymentsMapByEmployee, loading: loadingPayments, markPaid, undoPaid } =
    usePayments(selectedMonth);

  // Dialog states
  const [selectedForPayment, setSelectedForPayment] = useState<{
    emp: Employee;
    computedAmount: number;
    payment?: Payment | null;
  } | null>(null);

  const [undoPaymentTarget, setUndoPaymentTarget] = useState<Employee | null>(null);

  const handleMonthChange = (newMonth: MonthKey) => {
    setSearchParams({ month: newMonth });
  };

  // Filter employees: active + archived who have attendance or payments in this month
  const relevantEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.active) return true;
      const hasAttendance = daysMapByEmployee.has(emp.id);
      const hasPayment = paymentsMapByEmployee.has(emp.id);
      return hasAttendance || hasPayment;
    });
  }, [employees, daysMapByEmployee, paymentsMapByEmployee]);

  // Compute rows
  const summaryRows = useMemo(() => {
    return relevantEmployees.map((emp) => {
      const days = daysMapByEmployee.get(emp.id) || {};
      const salary = computeMonthSalary(emp, selectedMonth, days, today);
      const payment = paymentsMapByEmployee.get(emp.id) || null;
      const isPaid = !!payment;
      const changedSincePaid = isPaid && payment.amount !== salary.amount;

      return {
        emp,
        salary,
        payment,
        isPaid,
        changedSincePaid,
      };
    });
  }, [relevantEmployees, daysMapByEmployee, selectedMonth, today, paymentsMapByEmployee]);

  // Totals
  const totals = useMemo(() => {
    let payable = 0;
    let paid = 0;
    let pending = 0;

    summaryRows.forEach((row) => {
      payable += row.salary.amount;
      if (row.isPaid && row.payment) {
        paid += row.payment.amount;
      } else {
        pending += row.salary.amount;
      }
    });

    return { payable, paid, pending };
  }, [summaryRows]);

  const handleExportCsv = () => {
    const csvRows: CsvRowData[] = summaryRows.map((r) => ({
      employeeName: r.emp.name,
      month: selectedMonth,
      salary: r.salary,
      payment: r.payment,
    }));
    downloadSummaryCsv(selectedMonth, csvRows);
    toast.success('CSV exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaidConfirm = async (payment: Payment) => {
    try {
      await markPaid(payment);
      toast.success('Salary payment recorded');
      setSelectedForPayment(null);
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const handleUndoPaidConfirm = async () => {
    if (!undoPaymentTarget) return;
    try {
      await undoPaid(undoPaymentTarget.id, selectedMonth);
      toast.success('Payment record removed');
      setUndoPaymentTarget(null);
    } catch {
      toast.error('Failed to undo payment');
    }
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
        <PageHeader title={strings.summary.title} subtitle={strings.summary.subtitle} />
        <TableSkeleton rows={6} cols={6} />
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

  return (
    <div className="space-y-6">
      {/* Page Header (No-print) */}
      <div className="no-print space-y-4">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/app');
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        <PageHeader title={strings.summary.title} subtitle={strings.summary.subtitle}>
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker value={selectedMonth} onChange={handleMonthChange} />
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={summaryRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono rounded-xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] transition-colors cursor-pointer min-h-[38px] disabled:opacity-30 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278]" />
              <span className="hidden sm:inline">{strings.summary.exportCsv}</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={summaryRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono rounded-xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] transition-colors cursor-pointer min-h-[38px] disabled:opacity-30 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#5B6472] dark:text-[#858A94]" />
              <span className="hidden sm:inline">{strings.summary.print}</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </PageHeader>
      </div>

      {/* Print-Only Document Title */}
      <div className="hidden print-only mb-6 text-center">
        <h1 className="text-xl font-bold text-black">
          StaffBook — Salary Summary, {formatDisplayMonth(selectedMonth, 'long')}
        </h1>
        <p className="text-xs text-gray-600 mt-1">Generated on {formatDisplayDate(today)}</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Payable / Earned */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#5B6472] dark:text-[#858A94]">
              {isCurrentMonth ? strings.common.earnedSoFar : strings.common.totalPayable}
            </span>
            <TrendingUp className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#111827] dark:text-[#F2F0EC] tabular-nums tracking-tight">
            {formatINR(totals.payable)}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
            {summaryRows.length} staff members
          </div>
        </div>

        {/* Paid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#047857] dark:text-[#34D399]">
              {strings.common.totalPaid}
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#047857] dark:text-[#34D399]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#047857] dark:text-[#34D399] tabular-nums tracking-tight">
            {formatINR(totals.paid)}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
            Settled payments
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#B45309] dark:text-[#FBBF24]">
              {strings.common.totalPending}
            </span>
            <Clock className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#B45309] dark:text-[#FBBF24] tabular-nums tracking-tight">
            {formatINR(totals.pending)}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
            Remaining to be disbursed
          </div>
        </div>
      </div>

      {/* Summary Table or Cards */}
      {summaryRows.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title={strings.summary.emptyTitle}
          description={strings.summary.emptyDesc}
          actionLabel={strings.today.addEmployee}
          onAction={() => navigate('/app/employees/new')}
          secondaryActionLabel={strings.demo.loadDemo}
          onSecondaryAction={handleLoadDemo}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F3F4F6] dark:bg-[#101215] text-[#5B6472] dark:text-[#858A94] uppercase text-xs font-mono border-b border-[#E5E7EB] dark:border-[#23262D]">
                  <tr>
                    <th className="py-3.5 px-6 font-medium">{strings.common.name}</th>
                    <th className="py-3.5 px-3 text-center font-bold text-[#047857] dark:text-[#34D399]">{strings.common.full}</th>
                    <th className="py-3.5 px-3 text-center font-bold text-[#B45309] dark:text-[#FBBF24]">{strings.common.half}</th>
                    <th className="py-3.5 px-3 text-center font-bold text-[#B91C1C] dark:text-[#F87171]">{strings.common.absent}</th>
                    <th className="py-3.5 px-3 text-center font-medium text-[#5B6472] dark:text-[#60646C]">{strings.common.unmarked}</th>
                    <th className="py-3.5 px-5 text-right font-medium">{strings.common.amount}</th>
                    <th className="py-3.5 px-4 text-center font-medium">{strings.common.status}</th>
                    <th className="py-3.5 px-6 text-right font-medium no-print">{strings.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#23262D]">
                  {summaryRows.map(({ emp, salary, payment, isPaid, changedSincePaid }) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#F3F4F6]/60 dark:hover:bg-[#1A1D23]/60 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-br border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${getAvatarColor(
                              emp.name
                            )}`}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <Link
                              to={`/app/employees/${emp.id}?month=${selectedMonth}`}
                              className="font-medium text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors block text-sm"
                            >
                              {emp.name}
                            </Link>
                            {!emp.active && (
                              <span className="text-[10px] font-mono text-[#5B6472] dark:text-[#60646C]">
                                (Archived)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center font-mono font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                        {salary.full}
                      </td>
                      <td className="py-4 px-3 text-center font-mono font-bold text-[#B45309] dark:text-[#FBBF24] tabular-nums">
                        {salary.half}
                      </td>
                      <td className="py-4 px-3 text-center font-mono font-bold text-[#B91C1C] dark:text-[#F87171] tabular-nums">
                        {salary.absent}
                      </td>
                      <td className="py-4 px-3 text-center font-mono text-[#5B6472] dark:text-[#60646C] tabular-nums">
                        {salary.unmarked}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-semibold text-[#111827] dark:text-[#F2F0EC] tabular-nums text-sm">
                        {formatINR(salary.amount)}
                        {changedSincePaid && payment && (
                          <div
                            className="text-[10px] font-mono text-[#B45309] dark:text-[#FBBF24] font-normal"
                            title="Paid snapshot differs from current attendance calculation"
                          >
                            (Paid: {formatINR(payment.amount)})
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={isPaid ? 'paid' : 'pending'} size="sm" />
                          {changedSincePaid && (
                            <span className="text-[10px] font-mono text-[#B45309] dark:text-[#FBBF24] font-medium">
                              {strings.summary.changedSincePaidBadge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right no-print">
                        <div className="flex items-center justify-end gap-2">
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => setUndoPaymentTarget(emp)}
                              className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#B45309] dark:hover:text-[#FBBF24] hover:bg-[#FFFBEB] dark:hover:bg-[#2A200F] rounded-lg transition-colors cursor-pointer"
                              title="Undo Payment"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedForPayment({
                                  emp,
                                  computedAmount: salary.amount,
                                  payment,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0D0D0F] bg-gradient-to-r from-[#34D399] to-[#10B981] hover:from-[#4ADE80] hover:to-[#34D399] rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}
                          <Link
                            to={`/app/employees/${emp.id}?month=${selectedMonth}`}
                            className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer"
                            title="View Attendance Calendar"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="md:hidden space-y-3.5">
            {summaryRows.map(({ emp, salary, payment, isPaid, changedSincePaid }) => (
              <div
                key={emp.id}
                className="p-4 bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-3"
              >
                {/* Header: Name + Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${getAvatarColor(
                        emp.name
                      )}`}
                    >
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <Link
                        to={`/app/employees/${emp.id}?month=${selectedMonth}`}
                        className="font-semibold text-base text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] block leading-tight"
                      >
                        {emp.name}
                      </Link>
                      {!emp.active && (
                        <span className="text-[10px] font-mono text-[#5B6472] dark:text-[#60646C]">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>

                  <StatusBadge status={isPaid ? 'paid' : 'pending'} size="sm" />
                </div>

                {/* Days Breakdown Grid */}
                <div className="grid grid-cols-4 gap-1.5 py-2 px-3 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] text-center font-mono text-xs tabular-nums">
                  <div>
                    <div className="text-[10px] text-[#5B6472] dark:text-[#858A94]">Full</div>
                    <div className="font-bold text-[#047857] dark:text-[#34D399] mt-0.5">{salary.full}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5B6472] dark:text-[#858A94]">Half</div>
                    <div className="font-bold text-[#B45309] dark:text-[#FBBF24] mt-0.5">{salary.half}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5B6472] dark:text-[#858A94]">Absent</div>
                    <div className="font-bold text-[#B91C1C] dark:text-[#F87171] mt-0.5">{salary.absent}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5B6472] dark:text-[#858A94]">Unmarked</div>
                    <div className="font-medium text-[#5B6472] dark:text-[#60646C] mt-0.5">{salary.unmarked}</div>
                  </div>
                </div>

                {/* Amount and Action */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] dark:border-[#23262D]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#5B6472] dark:text-[#858A94] block">
                      Total Payable
                    </span>
                    <span className="text-lg font-bold font-mono text-[#111827] dark:text-[#F2F0EC] tabular-nums">
                      {formatINR(salary.amount)}
                    </span>
                    {changedSincePaid && payment && (
                      <span className="text-[10px] font-mono text-[#B45309] dark:text-[#FBBF24] block">
                        (Paid: {formatINR(payment.amount)})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => setUndoPaymentTarget(emp)}
                        className="px-3 py-2 text-xs font-mono font-medium text-[#5B6472] dark:text-[#858A94] hover:text-[#B45309] dark:hover:text-[#FBBF24] bg-[#F3F4F6] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#2B2F38] rounded-xl transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedForPayment({
                            emp,
                            computedAmount: salary.amount,
                            payment,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-gradient-to-r from-[#34D399] to-[#10B981] hover:from-[#4ADE80] hover:to-[#34D399] rounded-xl transition-all cursor-pointer shadow-sm min-h-[38px] active:scale-[0.98]"
                      >
                        <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Pay Wage</span>
                      </button>
                    )}

                    <Link
                      to={`/app/employees/${emp.id}?month=${selectedMonth}`}
                      className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] bg-[#F3F4F6] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#2B2F38] rounded-xl transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Print Signature Line */}
      <div className="hidden print-only pt-16">
        <div className="text-right text-xs font-semibold text-black">
          {strings.summary.signatureLine}
        </div>
      </div>

      {/* PaidDialog Modal */}
      {selectedForPayment && (
        <PaidDialog
          isOpen={true}
          employee={selectedForPayment.emp}
          month={selectedMonth}
          suggestedAmount={selectedForPayment.computedAmount}
          initialPayment={selectedForPayment.payment}
          onConfirm={handleMarkPaidConfirm}
          onCancel={() => setSelectedForPayment(null)}
        />
      )}

      {/* Undo Paid Confirm Dialog */}
      {undoPaymentTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Undo Salary Payment?"
          description={`Remove payment record for ${undoPaymentTarget.name} in ${formatDisplayMonth(
            selectedMonth,
            'long'
          )}?`}
          confirmLabel="Undo Payment"
          variant="warning"
          onConfirm={handleUndoPaidConfirm}
          onCancel={() => setUndoPaymentTarget(null)}
        />
      )}
    </div>
  );
}
