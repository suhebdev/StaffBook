import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import { useEmployees } from '@/features/employees/useEmployees';
import { useAttendanceMonth } from '@/features/attendance/useAttendanceMonth';
import { usePayments } from '@/features/payments/usePayments';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loading } from '@/components/shared/Loading';
import { ErrorState } from '@/components/shared/ErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PaidDialog } from '@/features/payments/PaidDialog';
import {
  todayKey,
  monthOf,
  formatDisplayDate,
  formatDisplayMonth,
  daysInMonth,
  parseMonthKey,
  formatDayKey,
  checkDayEligibility,
  compareMonths,
} from '@/domain/dates';
import { getRateForMonth } from '@/domain/rates';
import { computeMonthSalary } from '@/domain/salary';
import { formatINR } from '@/domain/money';
import { strings } from '@/strings/en';
import type { MonthKey, Payment, Status } from '@/domain/types';

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = todayKey();
  const defaultMonth = monthOf(today);
  const selectedMonth: MonthKey = searchParams.get('month') || defaultMonth;
  const isCurrentMonth = selectedMonth === defaultMonth;
  const isPastMonth = compareMonths(selectedMonth, defaultMonth) < 0;

  // Subscriptions
  const { employees, loading: loadingEmployees, error: errorEmployees } = useEmployees();
  const { daysMapByEmployee, loading: loadingAttendance, setDayStatus } =
    useAttendanceMonth(selectedMonth);
  const { paymentsMapByEmployee, loading: loadingPayments, markPaid, undoPaid } =
    usePayments(selectedMonth);

  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const employee = useMemo(
    () => employees.find((e) => e.id === id),
    [employees, id]
  );

  const daysRecord = useMemo(
    () => (employee ? daysMapByEmployee.get(employee.id) || {} : {}),
    [employee, daysMapByEmployee]
  );

  const payment = useMemo(
    () => (employee ? paymentsMapByEmployee.get(employee.id) || null : null),
    [employee, paymentsMapByEmployee]
  );

  const salary = useMemo(() => {
    if (!employee) {
      return { full: 0, half: 0, absent: 0, unmarked: 0, amount: 0, rate: { effectiveFrom: selectedMonth, full: 0, half: 0 } };
    }
    return computeMonthSalary(employee, selectedMonth, daysRecord, today);
  }, [employee, selectedMonth, daysRecord, today]);

  // Changed since paid indicator
  const changedSincePaid = payment && payment.amount !== salary.amount;

  const handleMonthChange = (newMonth: MonthKey) => {
    setSearchParams({ month: newMonth });
  };

  const handleDayCycle = async (dayNumber: number, isEligible: boolean) => {
    if (!employee || !isEligible) return;

    const currentStatus = daysRecord[String(dayNumber)] || null;
    let nextStatus: Status | null = null;

    // Cycle order: unmarked -> F -> H -> A -> unmarked
    if (!currentStatus) nextStatus = 'F';
    else if (currentStatus === 'F') nextStatus = 'H';
    else if (currentStatus === 'H') nextStatus = 'A';
    else nextStatus = null;

    try {
      await setDayStatus(employee.id, dayNumber, nextStatus);
    } catch {
      toast.error('Failed to update attendance');
    }
  };

  const handleMarkPaidConfirm = async (p: Payment) => {
    try {
      await markPaid(p);
      toast.success('Salary payment recorded');
      setShowPaidDialog(false);
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const handleUndoPaidConfirm = async () => {
    if (!employee) return;
    try {
      await undoPaid(employee.id, selectedMonth);
      toast.success('Payment record removed');
      setShowUndoConfirm(false);
    } catch {
      toast.error('Failed to undo payment');
    }
  };

  if (loadingEmployees || loadingAttendance || loadingPayments) {
    return <Loading message="Loading employee attendance..." />;
  }

  if (errorEmployees || !employee) {
    return (
      <ErrorState
        message={errorEmployees ? errorEmployees.message : 'Employee not found'}
        errorCode={errorEmployees?.firestoreCode || errorEmployees?.code}
        errorPath={errorEmployees?.path}
        operation={errorEmployees?.operation}
        onRetry={() => navigate('/app/employees')}
      />
    );
  }

  const rate = getRateForMonth(employee.rates, selectedMonth);
  const totalDaysInMonth = daysInMonth(selectedMonth);
  const { year, month: monthNum } = parseMonthKey(selectedMonth);

  // Calendar Days calculation (starting Monday = 1)
  const firstDayOfMonth = new Date(year, monthNum - 1, 1).getDay(); // 0 is Sun, 1 is Mon
  // Adjust so Monday is 0, Sunday is 6
  const startingEmptyCells = (firstDayOfMonth + 6) % 7;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <Link
          to="/app/employees"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employees</span>
        </Link>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 sm:p-6 bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF8278]/20 to-[#FFA096]/10 border border-[#FF8278]/30 flex items-center justify-center font-mono font-bold text-sm text-[#B93A2B] dark:text-[#FF8278] shrink-0 shadow-sm">
            {employee.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-[#F2F0EC]">
                {employee.name}
              </h1>
              <StatusBadge status={payment ? 'paid' : 'pending'} />
              {!employee.active && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#1B1E24] text-[#5B6472] dark:text-[#858A94] border border-[#E5E7EB] dark:border-[#292B2F]">
                  Archived
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
              {employee.phone && (
                <a href={`tel:${employee.phone}`} className="hover:text-[#047857] dark:hover:text-[#34D399] transition-colors">
                  Phone: {employee.phone}
                </a>
              )}
              <span>·</span>
              <span>Joined: {formatDisplayDate(employee.joinedOn)}</span>
              <span>·</span>
              <span className="text-[#111827] dark:text-[#F2F0EC]">
                Rate: Full ₹{rate.full} / Half ₹{rate.half}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/app/employees/${employee.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#F3F4F6] dark:bg-[#1F2226] text-[#111827] dark:text-[#F2F0EC] hover:bg-[#E5E7EB] dark:hover:bg-[#25282D] border border-[#E5E7EB] dark:border-[#292B2F] transition-colors cursor-pointer min-h-[38px]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{strings.common.edit}</span>
          </Link>

          {payment ? (
            <button
              type="button"
              onClick={() => setShowUndoConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#FFFBEB] dark:bg-[#2A200F] text-[#B45309] dark:text-[#FBBF24] hover:bg-[#FFFBEB] dark:hover:bg-[#3D2E15] border border-[#FDE68A] dark:border-[#4D3815] transition-colors cursor-pointer min-h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{strings.monthView.undoPaid}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPaidDialog(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] transition-colors cursor-pointer min-h-[38px]"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{strings.monthView.markPaid}</span>
            </button>
          )}
        </div>
      </div>

      {/* Month Navigator & Warning Chip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <MonthPicker value={selectedMonth} onChange={handleMonthChange} />

        {isPastMonth && salary.unmarked > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFBEB] dark:bg-[#2A200F] border border-[#FDE68A] dark:border-[#4D3815] text-xs font-mono text-[#B45309] dark:text-[#FBBF24]">
            <AlertTriangle className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24] shrink-0" />
            <span>{strings.monthView.unmarkedWarning.replace('{count}', String(salary.unmarked))}</span>
          </div>
        )}
      </div>

      {/* Discrepancy Alert */}
      {changedSincePaid && (
        <div className="p-4 rounded-xl bg-[#FFFBEB] dark:bg-[#2A200F] border border-[#FDE68A] dark:border-[#4D3815] text-[#B45309] dark:text-[#FBBF24] text-xs font-mono flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24] shrink-0 mt-0.5" />
          <span>
            {strings.monthView.changedSincePaidWarning
              .replace('{paid}', formatINR(payment.amount))
              .replace('{current}', formatINR(salary.amount))}
          </span>
        </div>
      )}

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="text-xs font-mono text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider">{strings.monthView.statFull}</div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#047857] dark:text-[#34D399] tabular-nums">
            {salary.full}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="text-xs font-mono text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider">{strings.monthView.statHalf}</div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#B45309] dark:text-[#FBBF24] tabular-nums">
            {salary.half}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="text-xs font-mono text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider">{strings.monthView.statAbsent}</div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#B91C1C] dark:text-[#F87171] tabular-nums">
            {salary.absent}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="text-xs font-mono text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider">{strings.monthView.statUnmarked}</div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#5B6472] dark:text-[#60646C] tabular-nums">
            {salary.unmarked}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="text-xs font-mono font-medium text-[#B93A2B] dark:text-[#FF8278] uppercase tracking-wider">
            {isCurrentMonth ? strings.common.earnedSoFar : strings.monthView.earnedSalary}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#B93A2B] dark:text-[#FF8278] tabular-nums">
            {formatINR(salary.amount)}
          </div>
        </div>
      </div>

      {/* Calendar Grid (Mon to Sun) */}
      <div className="bg-white dark:bg-[#14161B] p-3.5 sm:p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E5E7EB] dark:border-[#292B2F]">
          <span className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
            Attendance Calendar
          </span>
          <span className="text-xs font-mono text-[#4B5563] dark:text-[#92969D]">
            {strings.monthView.calendarLegend}
          </span>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-mono text-[#4B5563] dark:text-[#92969D] uppercase py-1">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-[#B93A2B] dark:text-[#FF8278]">Sat</div>
          <div className="text-[#B93A2B] dark:text-[#FF8278]">Sun</div>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty prefix cells for proper day of week offset */}
          {Array.from({ length: startingEmptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 sm:h-18 rounded-lg bg-transparent" />
          ))}

          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayKey = formatDayKey(year, monthNum, dayNum);
            const eligibility = checkDayEligibility(
              dayKey,
              employee.joinedOn,
              employee.leftOn,
              today
            );
            const status = daysRecord[String(dayNum)] || null;

            return (
              <button
                key={dayNum}
                type="button"
                disabled={!eligibility.eligible}
                onClick={() => handleDayCycle(dayNum, eligibility.eligible)}
                title={
                  !eligibility.eligible
                    ? eligibility.reason === 'before_joined'
                      ? strings.today.beforeJoinedWarning
                      : eligibility.reason === 'after_left'
                      ? strings.today.afterLeftWarning
                      : strings.today.futureWarning
                    : `Day ${dayNum}: ${status || 'Unmarked'} (Click to cycle)`
                }
                className={`relative flex flex-col items-center justify-between p-1.5 sm:p-2 h-14 sm:h-18 rounded-lg border text-xs transition-all ${
                  !eligibility.eligible
                    ? 'bg-white/50 dark:bg-[#121416]/50 border-dashed border-[#E5E7EB] dark:border-[#292B2F] opacity-25 cursor-not-allowed'
                    : 'bg-white dark:bg-[#121416] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] border-[#E5E7EB] dark:border-[#292B2F] hover:border-[#FF8278]/50 cursor-pointer'
                }`}
              >
                <span className="font-mono text-[#4B5563] dark:text-[#92969D] self-start text-[11px] tabular-nums">
                  {dayNum}
                </span>

                {status ? (
                  <StatusBadge status={status} size="sm" />
                ) : eligibility.eligible ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB] dark:bg-[#292B2F] my-auto" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Record Section */}
      {payment && (
        <div className="bg-white dark:bg-[#17191C] p-6 rounded-xl border border-[#E5E7EB] dark:border-[#292B2F]">
          <h2 className="text-base font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-[#047857] dark:text-[#34D399]" />
            <span>{strings.monthView.paidSectionTitle}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
              <span className="text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider text-[11px]">Amount Paid</span>
              <div className="text-lg font-bold text-[#047857] dark:text-[#34D399] mt-1 tabular-nums">
                {formatINR(payment.amount)}
              </div>
            </div>
            <div className="p-3.5 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
              <span className="text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider text-[11px]">Payment Date</span>
              <div className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC] mt-1">
                {formatDisplayDate(payment.paidOn)}
              </div>
            </div>
            <div className="p-3.5 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
              <span className="text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider text-[11px]">Notes</span>
              <div className="text-sm text-[#111827] dark:text-[#F2F0EC] mt-1 truncate">
                {payment.note || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PaidDialog Modal */}
      <PaidDialog
        isOpen={showPaidDialog}
        employee={employee}
        month={selectedMonth}
        suggestedAmount={salary.amount}
        initialPayment={payment}
        onConfirm={handleMarkPaidConfirm}
        onCancel={() => setShowPaidDialog(false)}
      />

      {/* Undo Paid Confirmation */}
      <ConfirmDialog
        isOpen={showUndoConfirm}
        title="Undo Salary Payment?"
        description={strings.monthView.undoPaidConfirm.replace(
          '{month}',
          formatDisplayMonth(selectedMonth, 'long')
        )}
        confirmLabel="Undo Payment"
        variant="warning"
        onConfirm={handleUndoPaidConfirm}
        onCancel={() => setShowUndoConfirm(false)}
      />
    </div>
  );
}
