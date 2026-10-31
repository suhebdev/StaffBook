import React, { useState, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCheck,
  Users,
  Phone,
  Sparkles,
  Check,
  Clock,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import { useEmployees } from '@/features/employees/useEmployees';
import { useAttendanceMonth } from '@/features/attendance/useAttendanceMonth';
import { useDueNow } from '@/features/reminders/useDueNow';
import { DueNowPanel } from '@/features/reminders/DueNowPanel';
import { StatusButtons } from '@/features/attendance/StatusButtons';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Loading';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getRateForMonth } from '@/domain/rates';
import {
  todayKey,
  monthOf,
  formatDisplayDate,
  formatDayKey,
  parseDayKey,
  compareDays,
  checkDayEligibility,
} from '@/domain/dates';
import { seedDemoData } from '@/services/data';
import { strings } from '@/strings/en';
import type { Status } from '@/domain/types';

// Deterministic subtle avatar color palette
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

export function Today() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const selectedDate = searchParams.get('date') || todayKey();
  const today = todayKey();
  const isToday = selectedDate === today;
  const isFuture = compareDays(selectedDate, today) > 0;

  const currentMonth = monthOf(selectedDate);
  const { day: dayNumber } = parseDayKey(selectedDate);

  const { activeEmployees, loading: loadingEmployees } = useEmployees();
  const { daysMapByEmployee, loading: loadingAttendance, setDayStatus } =
    useAttendanceMonth(currentMonth);
  const { dueNowItems } = useDueNow(today);

  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const handlePrevDay = () => {
    const { year, month, day } = parseDayKey(selectedDate);
    const d = new Date(year, month - 1, day - 1);
    const newDate = formatDayKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
    setSearchParams({ date: newDate });
  };

  const handleNextDay = () => {
    if (isToday || isFuture) return;
    const { year, month, day } = parseDayKey(selectedDate);
    const d = new Date(year, month - 1, day + 1);
    const newDate = formatDayKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (compareDays(newDate, today) <= 0) {
      setSearchParams({ date: newDate });
    }
  };

  const handleJumpToday = () => {
    setSearchParams({ date: today });
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && compareDays(val, today) <= 0) {
      setSearchParams({ date: val });
    }
  };

  const triggerDatePicker = () => {
    try {
      if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current?.focus();
      }
    } catch (_) {
      dateInputRef.current?.focus();
    }
  };

  const employeeStatuses = useMemo(() => {
    return activeEmployees.map((emp) => {
      const eligibility = checkDayEligibility(
        selectedDate,
        emp.joinedOn,
        emp.leftOn,
        today
      );
      const days = daysMapByEmployee.get(emp.id) || {};
      const status = days[String(dayNumber)] || null;
      const rate = getRateForMonth(emp.rates, currentMonth);

      return {
        emp,
        eligibility,
        status,
        rate,
      };
    });
  }, [activeEmployees, selectedDate, dayNumber, daysMapByEmployee, currentMonth, today]);

  const counts = useMemo(() => {
    let full = 0;
    let half = 0;
    let absent = 0;
    let unmarked = 0;

    employeeStatuses.forEach(({ eligibility, status }) => {
      if (!eligibility.eligible) return;
      if (status === 'F') full++;
      else if (status === 'H') half++;
      else if (status === 'A') absent++;
      else unmarked++;
    });

    return { full, half, absent, unmarked };
  }, [employeeStatuses]);

  const handleStatusChange = async (employeeId: string, newStatus: Status | null) => {
    try {
      await setDayStatus(employeeId, dayNumber, newStatus);
    } catch {
      toast.error('Failed to update attendance');
    }
  };

  const eligibleUnmarked = employeeStatuses.filter(
    (item) => item.eligibility.eligible && !item.status
  );

  const handleMarkAllFull = async () => {
    if (counts.full > 0 || counts.half > 0 || counts.absent > 0) {
      setShowMarkAllConfirm(true);
    } else {
      executeMarkAllFull();
    }
  };

  const executeMarkAllFull = async () => {
    setShowMarkAllConfirm(false);
    setMarkingAll(true);
    try {
      const promises = eligibleUnmarked.map(({ emp }) =>
        setDayStatus(emp.id, dayNumber, 'F')
      );
      await Promise.all(promises);
      toast.success(`Marked ${eligibleUnmarked.length} staff as Full`);
    } catch {
      toast.error('Failed to mark all as Full');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLoadDemo = () => {
    if (user) {
      seedDemoData(user.uid);
      toast.success(strings.demo.demoLoaded);
    }
  };

  const isLoading = loadingEmployees || loadingAttendance;

  // Format nice human date header (e.g. "Today · 20 Oct 2026")
  const dateSubtitle = isToday
    ? `Today · ${formatDisplayDate(selectedDate)}`
    : formatDisplayDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* Date Navigator Header */}
      <PageHeader
        title={strings.today.title}
        subtitle={dateSubtitle}
      >
        <div className="flex items-center gap-1 bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={handlePrevDay}
            className="w-8 h-8 flex items-center justify-center text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={triggerDatePicker}
            className="relative flex items-center gap-2 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[#111827] dark:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer group"
          >
            <Calendar className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278] group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs sm:text-sm tabular-nums">
              {selectedDate}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              max={today}
              value={selectedDate}
              onChange={handleDateSelect}
              className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              tabIndex={-1}
            />
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={isToday || isFuture}
            className="w-8 h-8 flex items-center justify-center text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="ml-1 px-2.5 py-1 text-xs font-mono font-medium text-[#B93A2B] dark:text-[#FF8278] bg-[#FF8278]/10 hover:bg-[#FF8278]/20 rounded-lg transition-colors cursor-pointer"
            >
              {strings.common.today}
            </button>
          )}
        </div>
      </PageHeader>

      {/* Due Now Panel */}
      <DueNowPanel items={dueNowItems} />

      {/* Future warning */}
      {isFuture && (
        <div className="p-4 rounded-xl bg-[#FFFBEB] dark:bg-[#2A200F] border border-[#FDE68A] dark:border-[#4D3815] text-[#B45309] dark:text-[#FBBF24] text-xs font-mono">
          {strings.today.futureWarning}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : activeEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={strings.today.emptyTitle}
          description={strings.today.emptyDesc}
          actionLabel={strings.today.addEmployee}
          onAction={() => navigate('/app/employees/new')}
          secondaryActionLabel={strings.demo.loadDemo}
          onSecondaryAction={handleLoadDemo}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F4F6] dark:bg-[#101215] text-[#5B6472] dark:text-[#858A94] uppercase text-xs font-mono border-b border-[#E5E7EB] dark:border-[#23262D]">
                <tr>
                  <th className="py-3.5 px-6 font-medium">{strings.common.name}</th>
                  <th className="py-3.5 px-6 font-medium">Daily Wage</th>
                  <th className="py-3.5 px-6 text-right font-medium">Attendance Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#23262D]">
                {employeeStatuses.map(({ emp, eligibility, status, rate }) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#F3F4F6]/60 dark:hover:bg-[#1A1D23]/60 transition-colors"
                  >
                    {/* Employee Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br border flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm ${getAvatarColor(
                            emp.name
                          )}`}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <Link
                            to={`/app/employees/${emp.id}?month=${currentMonth}`}
                            className="font-medium text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors block text-sm leading-tight"
                          >
                            {emp.name}
                          </Link>
                          {emp.phone && (
                            <a
                              href={`tel:${emp.phone}`}
                              className="inline-flex items-center gap-1 text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#047857] dark:hover:text-[#34D399] transition-colors mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{emp.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Wage Column */}
                    <td className="py-4 px-6 text-xs font-mono tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F] text-[#111827] dark:text-[#F2F0EC] font-semibold">
                          Full ₹{rate.full}
                        </span>
                        <span className="text-[#5B6472] dark:text-[#60646C]">/</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F] text-[#5B6472] dark:text-[#858A94]">
                          Half ₹{rate.half}
                        </span>
                      </div>
                    </td>

                    {/* Attendance Action */}
                    <td className="py-4 px-6 text-right">
                      {eligibility.eligible ? (
                        <StatusButtons
                          currentStatus={status}
                          onChange={(newStatus) => handleStatusChange(emp.id, newStatus)}
                          size="md"
                        />
                      ) : (
                        <span className="text-xs font-mono text-[#5B6472] dark:text-[#60646C]">
                          {eligibility.reason === 'before_joined'
                            ? strings.today.beforeJoinedWarning
                            : eligibility.reason === 'after_left'
                            ? strings.today.afterLeftWarning
                            : strings.today.futureWarning}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (< 768px) */}
          <div className="md:hidden space-y-3.5">
            {employeeStatuses.map(({ emp, eligibility, status, rate }) => {
              const statusLabel =
                status === 'F'
                  ? 'Full Day (₹' + rate.full + ')'
                  : status === 'H'
                  ? 'Half Day (₹' + rate.half + ')'
                  : status === 'A'
                  ? 'Absent (₹0)'
                  : 'Not Marked Today';

              const statusColor =
                status === 'F'
                  ? 'text-[#047857] dark:text-[#34D399] bg-[#ECFDF5]/40 dark:bg-[#064E3B]/40 border-[#10B981]/30'
                  : status === 'H'
                  ? 'text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB]/40 dark:bg-[#78350F]/40 border-[#F59E0B]/30'
                  : status === 'A'
                  ? 'text-[#B91C1C] dark:text-[#F87171] bg-[#FEF2F2]/40 dark:bg-[#7F1D1D]/40 border-[#EF4444]/30'
                  : 'text-[#5B6472] dark:text-[#858A94] bg-[#F3F4F6] dark:bg-[#1B1E24] border-[#E5E7EB] dark:border-[#292B2F]';

              return (
                <div
                  key={emp.id}
                  className="p-4 bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-3.5"
                >
                  {/* Top: Avatar, Name, Phone, and Wage */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br border flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-sm ${getAvatarColor(
                          emp.name
                        )}`}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <Link
                          to={`/app/employees/${emp.id}?month=${currentMonth}`}
                          className="font-semibold text-base text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] block leading-tight"
                        >
                          {emp.name}
                        </Link>
                        {emp.phone ? (
                          <a
                            href={`tel:${emp.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#047857] dark:hover:text-[#34D399] transition-colors mt-1"
                          >
                            <Phone className="w-3 h-3 text-[#047857] dark:text-[#34D399]" />
                            <span>{emp.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C]">No phone</span>
                        )}
                      </div>
                    </div>

                    {/* Wage badge */}
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#111827] dark:text-[#F2F0EC] tabular-nums">
                        ₹{rate.full}
                        <span className="text-[10px] text-[#5B6472] dark:text-[#858A94] font-normal"> /day</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#5B6472] dark:text-[#858A94] tabular-nums">
                        Half ₹{rate.half}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator Chip */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] uppercase tracking-wider">
                      Status:
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Attendance 3-Button Control (Thumb friendly) */}
                  {eligibility.eligible ? (
                    <div className="pt-1">
                      <StatusButtons
                        currentStatus={status}
                        onChange={(newStatus) => handleStatusChange(emp.id, newStatus)}
                        size="lg"
                      />
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-[#5B6472] dark:text-[#60646C] py-2 text-center bg-[#F3F4F6] dark:bg-[#1B1E24] rounded-xl border border-[#E5E7EB] dark:border-[#292B2F]">
                      {eligibility.reason === 'before_joined'
                        ? strings.today.beforeJoinedWarning
                        : eligibility.reason === 'after_left'
                        ? strings.today.afterLeftWarning
                        : strings.today.futureWarning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Footer Bar with Counts and Mark All Full */}
          <div className="sticky bottom-20 lg:bottom-5 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 p-3.5 sm:p-4 bg-white/95 dark:bg-[#121417]/95 backdrop-blur-xl rounded-2xl border border-[#E5E7EB] dark:border-[#2B2F38] shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/80 no-print">
            {/* Stat Counters */}
            <div className="grid grid-cols-4 sm:flex items-center gap-2 sm:gap-3 text-xs font-mono tabular-nums">
              {/* Full */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#A7F3D0] dark:border-[#10B981]/30">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-bold text-[#047857] dark:text-[#6EE7B7]">{counts.full}</span>
                <span className="text-[#5B6472] dark:text-[#858A94] hidden xs:inline">{strings.common.full}</span>
              </div>

              {/* Half */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFBEB] dark:bg-[#78350F]/30 border border-[#FDE68A] dark:border-[#F59E0B]/30">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="font-bold text-[#B45309] dark:text-[#FDE68A]">{counts.half}</span>
                <span className="text-[#5B6472] dark:text-[#858A94] hidden xs:inline">{strings.common.half}</span>
              </div>

              {/* Absent */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#EF4444]/30">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="font-bold text-[#B91C1C] dark:text-[#FECACA]">{counts.absent}</span>
                <span className="text-[#5B6472] dark:text-[#858A94] hidden xs:inline">{strings.common.absent}</span>
              </div>

              {/* Unmarked */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F3F4F6] dark:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F]">
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] dark:bg-[#60646C]" />
                <span className="font-bold text-[#4B5563] dark:text-[#858A94]">{counts.unmarked}</span>
                <span className="text-[#5B6472] dark:text-[#60646C] hidden xs:inline">{strings.common.unmarked}</span>
              </div>
            </div>

            {/* Mark All Full Button */}
            <button
              type="button"
              disabled={isFuture || eligibleUnmarked.length === 0 || markingAll}
              onClick={handleMarkAllFull}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0D0D0F] bg-gradient-to-r from-[#FF8278] to-[#FFA096] hover:from-[#FF958C] hover:to-[#FFB0A7] rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed shadow-md shadow-[#FF8278]/20 min-h-[42px] active:scale-[0.98]"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              <span>{strings.today.markAllFull}</span>
              {eligibleUnmarked.length > 0 && (
                <span className="bg-[#F8F9FA]/20 dark:bg-[#0D0D0F]/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  {eligibleUnmarked.length}
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {/* Confirm dialog for Mark All Full */}
      <ConfirmDialog
        isOpen={showMarkAllConfirm}
        title="Mark All Unmarked as Full?"
        description={strings.today.markAllConfirm.replace(
          '{count}',
          String(eligibleUnmarked.length)
        )}
        confirmLabel="Mark Full"
        variant="primary"
        onConfirm={executeMarkAllFull}
        onCancel={() => setShowMarkAllConfirm(false)}
      />
    </div>
  );
}
