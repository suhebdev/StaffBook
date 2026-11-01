import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Calendar,
  TableProperties,
  CalendarDays,
  Check,
  Clock,
  X,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Employee, MonthKey, Payment, Status } from '@/domain/types';
import {
  daysInMonth,
  formatDayKey,
  parseMonthKey,
  isWeekend,
  getWeekdayName,
  checkDayEligibility,
  todayKey,
  monthOf,
  formatDisplayDate,
} from '@/domain/dates';
import { computeMonthSalary } from '@/domain/salary';
import { formatINR } from '@/domain/money';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { strings } from '@/strings/en';

interface SheetGridProps {
  employees: Employee[];
  month: MonthKey;
  daysMapByEmployee: Map<string, Record<string, Status>>;
  paymentsMapByEmployee: Map<string, Payment>;
  onSetDayStatus: (
    employeeId: string,
    dayNumber: number,
    status: Status | null
  ) => Promise<void>;
}

type SheetViewMode = 'week' | 'calendar' | 'matrix';

export function SheetGrid({
  employees,
  month,
  daysMapByEmployee,
  paymentsMapByEmployee,
  onSetDayStatus,
}: SheetGridProps) {
  const totalDays = daysInMonth(month);
  const { year, month: monthNum } = parseMonthKey(month);
  const today = todayKey();
  const isSelectedMonthCurrent = month === monthOf(today);
  const currentDayNum = isSelectedMonthCurrent ? new Date().getDate() : null;

  // View modes: 'week' (default) | 'calendar' | 'matrix'
  const [viewMode, setViewMode] = useState<SheetViewMode>('week');

  // Compute weeks in this month (7-day chunks: 1-7, 8-14, 15-21, 22-28, 29-end)
  const weeks = useMemo(() => {
    const list: { id: number; label: string; startDay: number; endDay: number }[] = [];
    let start = 1;
    let wNum = 1;
    while (start <= totalDays) {
      const end = Math.min(start + 6, totalDays);
      list.push({
        id: wNum,
        label: `W${wNum} (${start}–${end})`,
        startDay: start,
        endDay: end,
      });
      start = end + 1;
      wNum++;
    }
    return list;
  }, [totalDays]);

  // Find default week index (where today is, or week 1)
  const defaultWeekIndex = useMemo(() => {
    if (currentDayNum) {
      const foundIdx = weeks.findIndex(
        (w) => currentDayNum >= w.startDay && currentDayNum <= w.endDay
      );
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  }, [weeks, currentDayNum]);

  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(defaultWeekIndex);
  const activeWeekChipRef = useRef<HTMLButtonElement | null>(null);

  // Sync default week when month changes
  useEffect(() => {
    setSelectedWeekIdx(defaultWeekIndex);
  }, [defaultWeekIndex]);

  // Auto-scroll active week chip into view on change
  useEffect(() => {
    if (activeWeekChipRef.current) {
      activeWeekChipRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedWeekIdx]);

  // Filter employee tab in calendar view
  const [selectedEmpTab, setSelectedEmpTab] = useState<string>('all');

  // Cell focus for matrix view keyboard shortcuts
  const [focusedCell, setFocusedCell] = useState<{ empIndex: number; day: number } | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Quick edit modal for mobile/calendar day tapping
  const [quickEditDay, setQuickEditDay] = useState<{
    emp: Employee;
    day: number;
    currentStatus: Status | null;
  } | null>(null);

  // Paid month edit warning
  const [pendingEdit, setPendingEdit] = useState<{
    empId: string;
    day: number;
    status: Status | null;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLTableCellElement>(null);

  const isEmployeeMonthPaid = (empId: string) => {
    return paymentsMapByEmployee.has(empId);
  };

  const hasSessionWarnedPaidEdit = () => {
    try {
      return (
        sessionStorage.getItem('staffbook:warned-paid-edit') === 'true' ||
        sessionStorage.getItem('dihadi:warned-paid-edit') === 'true'
      );
    } catch {
      return false;
    }
  };

  const markSessionWarnedPaidEdit = () => {
    try {
      sessionStorage.setItem('staffbook:warned-paid-edit', 'true');
    } catch (_) {}
  };

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (_) {}
  };

  const applyStatusChange = async (
    empId: string,
    dayNumber: number,
    status: Status | null
  ) => {
    if (isEmployeeMonthPaid(empId) && !hasSessionWarnedPaidEdit()) {
      setPendingEdit({ empId, day: dayNumber, status });
      return;
    }

    triggerHaptic();
    try {
      await onSetDayStatus(empId, dayNumber, status);
    } catch {
      toast.error('Failed to update attendance');
    }
  };

  const handleConfirmPaidEdit = async () => {
    if (!pendingEdit) return;
    markSessionWarnedPaidEdit();
    triggerHaptic();
    try {
      await onSetDayStatus(pendingEdit.empId, pendingEdit.day, pendingEdit.status);
    } catch {
      toast.error('Failed to update attendance');
    } finally {
      setPendingEdit(null);
    }
  };

  // Scroll to today in spreadsheet matrix or switch to current week
  const handleScrollToToday = () => {
    if (viewMode === 'week') {
      setSelectedWeekIdx(defaultWeekIndex);
      toast.success('Jumped to current week');
      return;
    }
    if (todayColRef.current && tableContainerRef.current) {
      todayColRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    } else {
      toast.info('Today is not in this month');
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedCell) return;
      const { empIndex, day } = focusedCell;

      if (e.key === '?') {
        e.preventDefault();
        setShowHelpDialog((prev) => !prev);
        return;
      }

      const currentEmp = employees[empIndex];
      if (!currentEmp) return;

      const dayKey = formatDayKey(year, monthNum, day);
      const eligibility = checkDayEligibility(
        dayKey,
        currentEmp.joinedOn,
        currentEmp.leftOn,
        today
      );

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (empIndex > 0) {
            setFocusedCell({ empIndex: empIndex - 1, day });
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (empIndex < employees.length - 1) {
            setFocusedCell({ empIndex: empIndex + 1, day });
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (day > 1) {
            setFocusedCell({ empIndex, day: day - 1 });
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (day < totalDays) {
            setFocusedCell({ empIndex, day: day + 1 });
          }
          break;

        case 'Home':
          e.preventDefault();
          setFocusedCell({ empIndex, day: 1 });
          break;

        case 'End':
          e.preventDefault();
          setFocusedCell({ empIndex, day: totalDays });
          break;

        case 'f':
        case 'F':
          if (eligibility.eligible) {
            e.preventDefault();
            applyStatusChange(currentEmp.id, day, 'F');
          }
          break;

        case 'h':
        case 'H':
          if (eligibility.eligible) {
            e.preventDefault();
            applyStatusChange(currentEmp.id, day, 'H');
          }
          break;

        case 'a':
        case 'A':
          if (eligibility.eligible) {
            e.preventDefault();
            applyStatusChange(currentEmp.id, day, 'A');
          }
          break;

        case 'Backspace':
        case 'Delete':
          if (eligibility.eligible) {
            e.preventDefault();
            applyStatusChange(currentEmp.id, day, null);
          }
          break;

        case ' ':
          if (eligibility.eligible) {
            e.preventDefault();
            const daysRecord = daysMapByEmployee.get(currentEmp.id) || {};
            const cur = daysRecord[String(day)] || null;
            let nxt: Status | null = null;
            if (!cur) nxt = 'F';
            else if (cur === 'F') nxt = 'H';
            else if (cur === 'H') nxt = 'A';
            else nxt = null;
            applyStatusChange(currentEmp.id, day, nxt);
          }
          break;
      }
    },
    [focusedCell, employees, totalDays, year, monthNum, today, daysMapByEmployee]
  );

  const rowSummaries = employees.map((emp) => {
    const days = daysMapByEmployee.get(emp.id) || {};
    const salary = computeMonthSalary(emp, month, days, today);
    const payment = paymentsMapByEmployee.get(emp.id) || null;
    return { emp, salary, payment, days };
  });

  const grandTotalSalary = rowSummaries.reduce(
    (sum, row) => sum + row.salary.amount,
    0
  );

  const totalFullDaysAllStaff = rowSummaries.reduce(
    (sum, row) => sum + row.salary.full,
    0
  );

  const totalHalfDaysAllStaff = rowSummaries.reduce(
    (sum, row) => sum + row.salary.half,
    0
  );

  const paidStaffCount = rowSummaries.filter((r) => !!r.payment).length;

  const perDayFullCounts: number[] = [];
  for (let d = 1; d <= totalDays; d++) {
    let count = 0;
    employees.forEach((emp) => {
      const days = daysMapByEmployee.get(emp.id) || {};
      if (days[String(d)] === 'F') count++;
    });
    perDayFullCounts.push(count);
  }

  // Filtered employees for calendar view
  const calendarEmployees =
    selectedEmpTab === 'all'
      ? rowSummaries
      : rowSummaries.filter((r) => r.emp.id === selectedEmpTab);

  // Calculate calendar grid prefix empty cells for Monday-first layout
  const firstDayOfMonthDate = new Date(year, monthNum - 1, 1);
  const startingEmptyCells = (firstDayOfMonthDate.getDay() + 6) % 7;

  // Active Week Details
  const activeWeek = weeks[selectedWeekIdx] || weeks[0];
  const activeWeekDays = Array.from(
    { length: activeWeek.endDay - activeWeek.startDay + 1 },
    (_, i) => activeWeek.startDay + i
  );

  // Helper for cycling status
  const cycleStatus = (current: Status | null | undefined): Status | null => {
    if (!current) return 'F';
    if (current === 'F') return 'H';
    if (current === 'H') return 'A';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-[#1E222A] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] shrink-0 border border-[#D1D5DB] dark:border-[#2D3139]">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] uppercase tracking-wider">
              Staff Count
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#111827] dark:text-[#F2F0EC] truncate">
              {employees.length} Workers
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] dark:bg-[#10241A] flex items-center justify-center text-[#047857] dark:text-[#34D399] shrink-0 border border-[#A7F3D0] dark:border-[#1B422E]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] uppercase tracking-wider">
              Total Wages
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#047857] dark:text-[#34D399] truncate">
              {formatINR(grandTotalSalary)}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] dark:bg-[#262013] flex items-center justify-center text-[#B45309] dark:text-[#FBBF24] shrink-0 border border-[#FDE68A] dark:border-[#483B1B]">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] uppercase tracking-wider">
              Headcount
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#111827] dark:text-[#F2F0EC] truncate">
              {totalFullDaysAllStaff} Full · {totalHalfDaysAllStaff} Half
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] dark:bg-[#1E222A] flex items-center justify-center text-[#4B5563] dark:text-[#92969D] shrink-0 border border-[#D1D5DB] dark:border-[#2D3139]">
            <Check className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] uppercase tracking-wider">
              Payment Status
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-[#111827] dark:text-[#F2F0EC] truncate">
              {paidStaffCount} / {employees.length} Paid
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: 3 Clean View Tabs & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        {/* 3 View Tabs: Mobile full width grid-cols-3, desktop inline-flex */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex p-1 bg-[#F3F4F6] dark:bg-[#101216] border border-[#E5E7EB] dark:border-[#23262D] rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-[#FF8278] text-[#0D0D0F] shadow-sm font-semibold'
                : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F9FAFB] dark:hover:bg-[#181B20]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate sm:hidden">Week</span>
            <span className="hidden sm:inline">Week View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[#FF8278] text-[#0D0D0F] shadow-sm font-semibold'
                : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F9FAFB] dark:hover:bg-[#181B20]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate sm:hidden">Cards</span>
            <span className="hidden sm:inline">Calendar Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-[#FF8278] text-[#0D0D0F] shadow-sm font-semibold'
                : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F9FAFB] dark:hover:bg-[#181B20]'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate sm:hidden">Matrix</span>
            <span className="hidden sm:inline">31-Day Matrix</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          {isSelectedMonthCurrent && (
            <button
              type="button"
              onClick={handleScrollToToday}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#14161B] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#23262D] text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] transition-colors cursor-pointer min-h-[38px]"
              title="Jump to Today"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Today ({currentDayNum})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHelpDialog(true)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-white dark:bg-[#14161B] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#23262D] text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] transition-colors cursor-pointer min-h-[38px]"
            title="Keyboard Shortcuts"
            aria-label="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Shortcuts (?)</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* VIEW 1: WEEK VIEW                                          */}
      {/* ========================================================== */}
      {viewMode === 'week' && (
        <div className="space-y-3">
          {/* Week Selector Bar */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D]">
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedWeekIdx((prev) => Math.max(0, prev - 1))}
                disabled={selectedWeekIdx === 0}
                className="w-10 h-10 rounded-xl text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center cursor-pointer shrink-0 border border-[#E5E7EB] dark:border-[#23262D] transition-colors"
                title="Previous Week"
                aria-label="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none snap-x snap-mandatory flex-1 sm:flex-initial py-0.5">
                {weeks.map((w, idx) => {
                  const isCurrent =
                    currentDayNum !== null &&
                    currentDayNum >= w.startDay &&
                    currentDayNum <= w.endDay;
                  const isSelected = selectedWeekIdx === idx;

                  return (
                    <button
                      key={w.id}
                      ref={isSelected ? activeWeekChipRef : undefined}
                      type="button"
                      onClick={() => setSelectedWeekIdx(idx)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap snap-center border ${
                        isSelected
                          ? 'bg-[#FF8278] text-[#0D0D0F] font-bold border-[#FF8278] shadow-sm'
                          : 'bg-[#F3F4F6] dark:bg-[#101216] text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] border-[#E5E7EB] dark:border-[#23262D]'
                      }`}
                    >
                      <span>{w.label}</span>
                      {isCurrent && !isSelected && (
                        <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#FF8278] inline-block align-middle" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setSelectedWeekIdx((prev) => Math.min(weeks.length - 1, prev + 1))}
                disabled={selectedWeekIdx === weeks.length - 1}
                className="w-10 h-10 rounded-xl text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center cursor-pointer shrink-0 border border-[#E5E7EB] dark:border-[#23262D] transition-colors"
                title="Next Week"
                aria-label="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94] hidden lg:block pr-2">
              {activeWeek.label}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* A) MOBILE (below 640px): PER-WORKER CARDS (NO SCROLL) */}
          {/* ---------------------------------------------------- */}
          <div className="block sm:hidden space-y-3">
            {rowSummaries.map(({ emp, salary, payment, days }) => {
              const isPaid = !!payment;

              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] rounded-2xl p-3.5 shadow-sm space-y-3"
                >
                  {/* Card Header: Avatar + Name + Daily Rate on left; Month Total + Status on right */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] dark:bg-[#1E222A] text-[#B93A2B] dark:text-[#FF8278] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D1D5DB] dark:border-[#2D3139]">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/app/employees/${emp.id}?month=${month}`}
                          className="font-semibold text-sm text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors truncate block"
                        >
                          {emp.name}
                        </Link>
                        <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] leading-tight">
                          ₹{salary.rate.full}/d
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-base text-[#B93A2B] dark:text-[#FF8278] tabular-nums leading-tight">
                        {formatINR(salary.amount)}
                      </div>
                      <div className="mt-1 flex justify-end">
                        <StatusBadge status={isPaid ? 'paid' : 'pending'} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Card Body: ONE row of day cells matching the week (grid-cols-7) */}
                  <div className="grid grid-cols-7 gap-1">
                    {activeWeekDays.map((dayNum) => {
                      const dayKey = formatDayKey(year, monthNum, dayNum);
                      const eligibility = checkDayEligibility(
                        dayKey,
                        emp.joinedOn,
                        emp.leftOn,
                        today
                      );
                      const status = days[String(dayNum)] || null;
                      const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;
                      const weekend = isWeekend(month, dayNum);
                      const dayLetter = getWeekdayName(month, dayNum, 'narrow');

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          disabled={!eligibility.eligible}
                          onClick={() => {
                            if (!eligibility.eligible) return;
                            const next = cycleStatus(status);
                            applyStatusChange(emp.id, dayNum, next);
                          }}
                          aria-label={`${emp.name}, ${dayLetter} ${dayNum}, ${
                            status === 'F'
                              ? 'Full Day'
                              : status === 'H'
                              ? 'Half Day'
                              : status === 'A'
                              ? 'Absent'
                              : 'Unmarked'
                          }`}
                          className={`relative flex flex-col items-center justify-between p-1 min-h-[46px] w-full rounded-xl transition-transform active:scale-95 border select-none ${
                            !eligibility.eligible
                              ? 'opacity-30 bg-[#F3F4F6] dark:bg-[#101216] cursor-not-allowed border-transparent text-[#9CA3AF]'
                              : status === 'F'
                              ? 'bg-[#ECFDF5] dark:bg-[#10241A] border-[#A7F3D0] dark:border-[#1B422E] text-[#047857] dark:text-[#34D399]'
                              : status === 'H'
                              ? 'bg-[#FFFBEB] dark:bg-[#262013] border-[#FDE68A] dark:border-[#483B1B] text-[#B45309] dark:text-[#FBBF24]'
                              : status === 'A'
                              ? 'bg-[#FEF2F2] dark:bg-[#291717] border-[#FECACA] dark:border-[#4E2424] text-[#B91C1C] dark:text-[#F87171]'
                              : weekend
                              ? 'bg-[#F9FAFB] dark:bg-[#181B20] border-[#E5E7EB] dark:border-[#262932] text-[#4B5563] dark:text-[#858A94]'
                              : 'bg-white dark:bg-[#121418] border-[#E5E7EB] dark:border-[#21242C] text-[#4B5563] dark:text-[#858A94]'
                          } ${
                            isToday
                              ? 'ring-2 ring-[#FF8278] ring-offset-1 ring-offset-white dark:ring-offset-[#14161B] bg-[#FFF5F5] dark:bg-[#2A1616]/70'
                              : ''
                          }`}
                        >
                          {/* Weekday abbreviation + Date Number */}
                          <div className="flex flex-col items-center leading-none">
                            <span
                              className={`text-[9px] font-mono uppercase ${
                                isToday
                                  ? 'text-[#B93A2B] dark:text-[#FF8278] font-bold'
                                  : weekend
                                  ? 'text-[#E05244]/90 dark:text-[#FF8278]/90'
                                  : 'text-[#5B6472] dark:text-[#858A94]'
                              }`}
                            >
                              {dayLetter}
                            </span>
                            <span
                              className={`text-[11px] font-bold font-mono tabular-nums mt-0.5 ${
                                isToday ? 'text-[#B93A2B] dark:text-[#FF8278]' : 'text-[#111827] dark:text-[#F2F0EC]'
                              }`}
                            >
                              {dayNum}
                            </span>
                          </div>

                          {/* Status Letter / Dot */}
                          <div className="w-full flex items-center justify-center my-0.5">
                            {status === 'F' ? (
                              <span className="text-xs font-bold font-mono leading-none">F</span>
                            ) : status === 'H' ? (
                              <span className="text-xs font-bold font-mono leading-none">H</span>
                            ) : status === 'A' ? (
                              <span className="text-xs font-bold font-mono leading-none">A</span>
                            ) : eligibility.eligible ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] dark:bg-[#343842]" />
                            ) : (
                              <span className="text-[10px] text-[#9CA3AF] dark:text-[#555] leading-none">—</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Compact Mobile Week Summary Card */}
            <div className="bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] rounded-2xl p-3.5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                <span className="font-semibold text-[#111827] dark:text-[#F2F0EC]">Week Headcount</span>
                <span>{activeWeek.label}</span>
              </div>

              {/* Headcounts in the same 7-column grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                {activeWeekDays.map((dayNum) => {
                  const count = perDayFullCounts[dayNum - 1] || 0;
                  const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;

                  return (
                    <div
                      key={dayNum}
                      className={`p-1.5 rounded-lg border text-center ${
                        isToday
                          ? 'border-[#FF8278] bg-[#FFF1F0] dark:bg-[#2A1616]/50'
                          : 'border-[#E5E7EB] dark:border-[#23262D] bg-[#F9FAFB] dark:bg-[#101216]'
                      }`}
                    >
                      <div className="text-[9px] text-[#5B6472] dark:text-[#858A94] uppercase">d{dayNum}</div>
                      <div className="font-bold tabular-nums mt-0.5">
                        {count > 0 ? (
                          <span className="text-[#047857] dark:text-[#34D399]">{count}F</span>
                        ) : (
                          <span className="text-[#5B6472] dark:text-[#60646C]">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#23262D] flex items-center justify-between text-xs font-mono">
                <span className="text-[#5B6472] dark:text-[#858A94]">Total Wages Payable (Month)</span>
                <span className="font-bold text-sm text-[#B93A2B] dark:text-[#FF8278] tabular-nums">
                  {formatINR(grandTotalSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* B) TABLET & DESKTOP (640px and above): FIXED TABLE   */}
          {/* ---------------------------------------------------- */}
          <div className="hidden sm:block rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] bg-white dark:bg-[#14161B] overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs border-collapse table-fixed min-w-[640px]">
                <thead>
                  <tr className="bg-[#F3F4F6] dark:bg-[#101216] border-b border-[#E5E7EB] dark:border-[#23262D] text-[#5B6472] dark:text-[#858A94] font-mono select-none">
                    {/* Fixed 200px Staff Column */}
                    <th
                      scope="col"
                      className="py-3 px-3.5 text-left font-semibold text-[#111827] dark:text-[#F2F0EC] w-[190px] min-w-[190px] max-w-[190px] border-r border-[#E5E7EB] dark:border-[#23262D]"
                    >
                      Staff Member
                    </th>

                    {/* Equal Day Columns with min-width 64px */}
                    {activeWeekDays.map((dayNum) => {
                      const weekend = isWeekend(month, dayNum);
                      const dayLetter = getWeekdayName(month, dayNum, 'short');
                      const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;

                      return (
                        <th
                          key={dayNum}
                          scope="col"
                          className={`py-2 px-1 text-center min-w-[64px] border-r border-[#E5E7EB] dark:border-[#23262D] ${
                            isToday
                              ? 'bg-[#FFF1F0] dark:bg-[#2A1616] text-[#B93A2B] dark:text-[#FF8278] border-b-2 border-b-[#FF8278]'
                              : weekend
                              ? 'bg-[#F9FAFB] dark:bg-[#181B20] text-[#B93A2B] dark:text-[#FF8278]/90'
                              : 'text-[#4B5563] dark:text-[#858A94]'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-medium">{dayLetter}</div>
                          <div
                            className={`font-bold tabular-nums text-xs mt-0.5 ${
                              isToday ? 'text-[#B93A2B] dark:text-[#FF8278]' : 'text-[#111827] dark:text-[#F2F0EC]'
                            }`}
                          >
                            {dayNum}
                          </div>
                          {isToday && (
                            <div className="text-[9px] font-mono text-[#B93A2B] dark:text-[#FF8278] leading-none mt-0.5 font-bold">
                              TODAY
                            </div>
                          )}
                        </th>
                      );
                    })}

                    {/* Compact Month Total Column (amount & status stacked) */}
                    <th
                      scope="col"
                      className="py-3 px-3 text-right font-semibold text-[#B93A2B] dark:text-[#FF8278] w-[130px] min-w-[130px] max-w-[130px] border-l border-[#E5E7EB] dark:border-[#23262D]"
                    >
                      Month Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#23262D]">
                  {rowSummaries.map(({ emp, salary, payment, days }) => {
                    const isPaid = !!payment;

                    return (
                      <tr key={emp.id} className="hover:bg-[#F3F4F6]/60 dark:hover:bg-[#1A1D23]/60 transition-colors">
                        {/* Staff Member Column */}
                        <td className="py-2.5 px-3.5 border-r border-[#E5E7EB] dark:border-[#23262D] truncate w-[190px] min-w-[190px] max-w-[190px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-[#1E222A] text-[#B93A2B] dark:text-[#FF8278] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D1D5DB] dark:border-[#2D3139]">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 truncate">
                              <Link
                                to={`/app/employees/${emp.id}?month=${month}`}
                                className="font-semibold text-xs text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors truncate block"
                              >
                                {emp.name}
                              </Link>
                              <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
                                ₹{salary.rate.full}/d
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Full-width 40px tall day buttons */}
                        {activeWeekDays.map((dayNum) => {
                          const dayKey = formatDayKey(year, monthNum, dayNum);
                          const eligibility = checkDayEligibility(
                            dayKey,
                            emp.joinedOn,
                            emp.leftOn,
                            today
                          );
                          const status = days[String(dayNum)] || null;
                          const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;
                          const weekend = isWeekend(month, dayNum);
                          const dayLetter = getWeekdayName(month, dayNum, 'narrow');

                          return (
                            <td
                              key={dayNum}
                              className={`p-1.5 text-center border-r border-[#E5E7EB] dark:border-[#23262D] ${
                                isToday
                                  ? 'bg-[#FFF5F5] dark:bg-[#2A1616]/30'
                                  : weekend
                                  ? 'bg-[#F9FAFB] dark:bg-[#121416]/40'
                                  : ''
                              }`}
                            >
                              <button
                                type="button"
                                disabled={!eligibility.eligible}
                                onClick={() => {
                                  if (!eligibility.eligible) return;
                                  const next = cycleStatus(status);
                                  applyStatusChange(emp.id, dayNum, next);
                                }}
                                aria-label={`${emp.name}, ${dayLetter} ${dayNum}, ${
                                  status === 'F'
                                    ? 'Full Day'
                                    : status === 'H'
                                    ? 'Half Day'
                                    : status === 'A'
                                    ? 'Absent'
                                    : 'Unmarked'
                                }`}
                                className={`w-full h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8278] active:scale-95 cursor-pointer select-none ${
                                  !eligibility.eligible
                                    ? 'opacity-30 bg-[#F3F4F6] dark:bg-[#101216] cursor-not-allowed border-transparent text-[#9CA3AF]'
                                    : status === 'F'
                                    ? 'bg-[#ECFDF5] dark:bg-[#10241A] border-[#A7F3D0] dark:border-[#1B422E] text-[#047857] dark:text-[#34D399] hover:border-[#10B981]'
                                    : status === 'H'
                                    ? 'bg-[#FFFBEB] dark:bg-[#262013] border-[#FDE68A] dark:border-[#483B1B] text-[#B45309] dark:text-[#FBBF24] hover:border-[#F59E0B]'
                                    : status === 'A'
                                    ? 'bg-[#FEF2F2] dark:bg-[#291717] border-[#FECACA] dark:border-[#4E2424] text-[#B91C1C] dark:text-[#F87171] hover:border-[#EF4444]'
                                    : 'bg-white dark:bg-[#121418] border-[#E5E7EB] dark:border-[#21242C] text-[#4B5563] dark:text-[#858A94] hover:border-[#D1D5DB] dark:hover:border-[#3A3E48]'
                                } ${isToday ? 'ring-2 ring-[#FF8278]' : ''}`}
                              >
                                {status ? (
                                  <span>{status}</span>
                                ) : eligibility.eligible ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] dark:bg-[#343842]" />
                                ) : (
                                  <span className="text-[#9CA3AF] dark:text-[#555]">—</span>
                                )}
                              </button>
                            </td>
                          );
                        })}

                        {/* Month Total Column (amount and badge stacked) */}
                        <td className="py-2.5 px-3.5 text-right w-[130px] min-w-[130px] max-w-[130px] border-l border-[#E5E7EB] dark:border-[#23262D]">
                          <div className="font-mono font-bold text-xs text-[#B93A2B] dark:text-[#FF8278] tabular-nums">
                            {formatINR(salary.amount)}
                          </div>
                          <div className="mt-1 flex justify-end">
                            <StatusBadge status={isPaid ? 'paid' : 'pending'} size="sm" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-[#F3F4F6] dark:bg-[#101216] font-mono border-t-2 border-[#D1D5DB] dark:border-[#292D35] text-[#111827] dark:text-[#F2F0EC]">
                    <td className="py-3 px-3.5 font-semibold border-r border-[#D1D5DB] dark:border-[#292D35]">
                      Week Attendance
                    </td>

                    {activeWeekDays.map((dayNum) => (
                      <td
                        key={dayNum}
                        className="py-2 px-1 text-center text-[#5B6472] dark:text-[#858A94] text-xs font-bold tabular-nums border-r border-[#E5E7EB] dark:border-[#23262D]"
                      >
                        {perDayFullCounts[dayNum - 1] > 0 ? (
                          <span className="text-[#047857] dark:text-[#34D399]">{perDayFullCounts[dayNum - 1]}F</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    ))}

                    <td className="py-3 px-3.5 text-right font-bold text-xs text-[#B93A2B] dark:text-[#FF8278] tabular-nums border-l border-[#D1D5DB] dark:border-[#292D35]">
                      {formatINR(grandTotalSalary)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Unified Legend & Hint Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#5B6472] dark:text-[#858A94] pt-1 px-1">
            <span className="text-center sm:text-left text-[11px] sm:text-xs">
              Tap any day to cycle: Unmarked → Full → Half → Absent → Clear
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[#047857] dark:text-[#34D399]">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" /> Full (F)
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#B45309] dark:text-[#FBBF24]">
                <span className="w-2 h-2 rounded-full bg-[#FBBF24]" /> Half (H)
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#B91C1C] dark:text-[#F87171]">
                <span className="w-2 h-2 rounded-full bg-[#F87171]" /> Absent (A)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 2: CALENDAR CARDS (MONTH-AT-A-GLANCE PER WORKER)       */}
      {/* ========================================================== */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Employee Filter Bar */}
          {employees.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedEmpTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 border ${
                  selectedEmpTab === 'all'
                    ? 'bg-[#F3F4F6] dark:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] border-[#FF8278]'
                    : 'bg-[#F3F4F6] dark:bg-[#101216] text-[#5B6472] dark:text-[#858A94] border-[#E5E7EB] dark:border-[#23262D] hover:text-[#111827] dark:hover:text-[#F2F0EC]'
                }`}
              >
                All Staff ({employees.length})
              </button>
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedEmpTab(emp.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 border ${
                    selectedEmpTab === emp.id
                      ? 'bg-[#F3F4F6] dark:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] border-[#FF8278]'
                      : 'bg-[#F3F4F6] dark:bg-[#101216] text-[#5B6472] dark:text-[#858A94] border-[#E5E7EB] dark:border-[#23262D] hover:text-[#111827] dark:hover:text-[#F2F0EC]'
                  }`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-5">
            {calendarEmployees.map(({ emp, salary, payment, days }) => {
              const isPaid = !!payment;

              return (
                <div
                  key={emp.id}
                  className="rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] bg-white dark:bg-[#14161B] p-4 sm:p-5 shadow-sm space-y-4 transition-all hover:border-[#D1D5DB] dark:hover:border-[#30343D]"
                >
                  {/* Card Header: Profile, Wage, Status */}
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E5E7EB] dark:border-[#23262D]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#1E222A] text-[#B93A2B] dark:text-[#FF8278] font-bold text-sm flex items-center justify-center border border-[#D1D5DB] dark:border-[#2D3139] shrink-0">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/app/employees/${emp.id}?month=${month}`}
                          className="font-semibold text-base text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors truncate block flex items-center gap-1.5 group"
                        >
                          <span>{emp.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#5B6472] dark:text-[#858A94] group-hover:text-[#B93A2B] dark:group-hover:text-[#FF8278] group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94] mt-0.5">
                          Daily Rate: ₹{salary.rate.full} (Full) · ₹{salary.rate.half} (Half)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold font-mono text-[#B93A2B] dark:text-[#FF8278] tabular-nums">
                        {formatINR(salary.amount)}
                      </div>
                      <div className="mt-1 flex justify-end">
                        <StatusBadge status={isPaid ? 'paid' : 'pending'} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Summary Badges */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded-lg bg-[#ECFDF5] dark:bg-[#10241A] border border-[#A7F3D0] dark:border-[#1B422E]">
                      <div className="text-[#047857] dark:text-[#34D399] font-bold text-sm">{salary.full}</div>
                      <div className="text-[10px] text-[#059669]/80 dark:text-[#34D399]/80 uppercase mt-0.5">Full (F)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#FFFBEB] dark:bg-[#262013] border border-[#FDE68A] dark:border-[#483B1B]">
                      <div className="text-[#B45309] dark:text-[#FBBF24] font-bold text-sm">{salary.half}</div>
                      <div className="text-[10px] text-[#D97706]/80 dark:text-[#FBBF24]/80 uppercase mt-0.5">Half (H)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#FEF2F2] dark:bg-[#291717] border border-[#FECACA] dark:border-[#4E2424]">
                      <div className="text-[#B91C1C] dark:text-[#F87171] font-bold text-sm">{salary.absent}</div>
                      <div className="text-[10px] text-[#DC2626]/80 dark:text-[#F87171]/80 uppercase mt-0.5">Absent (A)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F9FAFB] dark:bg-[#181B20] border border-[#D1D5DB] dark:border-[#292D35]">
                      <div className="text-[#5B6472] dark:text-[#858A94] font-bold text-sm">{salary.unmarked}</div>
                      <div className="text-[10px] text-[#5B6472] dark:text-[#858A94] uppercase mt-0.5">Unmarked</div>
                    </div>
                  </div>

                  {/* 7-Day Calendar Matrix (Mon to Sun) */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] font-mono font-medium text-[#5B6472] dark:text-[#858A94] uppercase py-1">
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div className="text-[#E05244]/90 dark:text-[#FF8278]/90">Sat</div>
                      <div className="text-[#B93A2B] dark:text-[#FF8278]">Sun</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                      {Array.from({ length: startingEmptyCells }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-11 sm:h-13 rounded-lg bg-transparent" />
                      ))}

                      {Array.from({ length: totalDays }).map((_, i) => {
                        const dayNum = i + 1;
                        const dayKey = formatDayKey(year, monthNum, dayNum);
                        const eligibility = checkDayEligibility(
                          dayKey,
                          emp.joinedOn,
                          emp.leftOn,
                          today
                        );
                        const status = days[String(dayNum)] || null;
                        const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;
                        const weekend = isWeekend(month, dayNum);

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            disabled={!eligibility.eligible}
                            onClick={() => {
                              if (!eligibility.eligible) return;
                              setQuickEditDay({
                                emp,
                                day: dayNum,
                                currentStatus: status,
                              });
                            }}
                            className={`relative flex flex-col items-center justify-between p-1 rounded-xl text-xs transition-all cursor-pointer ${
                              !eligibility.eligible
                                ? 'opacity-30 bg-[#F3F4F6] dark:bg-[#101216] cursor-not-allowed border border-transparent'
                                : status === 'F'
                                ? 'bg-[#ECFDF5] dark:bg-[#10241A] border border-[#A7F3D0] dark:border-[#1B422E] hover:border-[#10B981]'
                                : status === 'H'
                                ? 'bg-[#FFFBEB] dark:bg-[#262013] border border-[#FDE68A] dark:border-[#483B1B] hover:border-[#F59E0B]'
                                : status === 'A'
                                ? 'bg-[#FEF2F2] dark:bg-[#291717] border border-[#FECACA] dark:border-[#4E2424] hover:border-[#EF4444]'
                                : weekend
                                ? 'bg-[#F9FAFB] dark:bg-[#191B21] border border-[#E5E7EB] dark:border-[#262932] hover:border-[#D1D5DB]'
                                : 'bg-white dark:bg-[#121418] border border-[#E5E7EB] dark:border-[#21242C] hover:border-[#D1D5DB]'
                            } ${
                              isToday
                                ? 'ring-2 ring-[#FF8278] ring-offset-1 ring-offset-white dark:ring-offset-[#14161B]'
                                : ''
                            } h-11 sm:h-13`}
                          >
                            <div className="flex items-center justify-between w-full px-0.5 leading-none">
                              <span
                                className={`font-mono text-[10px] sm:text-xs font-semibold tabular-nums ${
                                  isToday
                                    ? 'text-[#B93A2B] dark:text-[#FF8278] font-bold'
                                    : weekend
                                    ? 'text-[#E05244]/80 dark:text-[#FF8278]/80'
                                    : 'text-[#1F2937] dark:text-[#C5C8CF]'
                                }`}
                              >
                                {dayNum}
                              </span>
                              {isToday && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8278] animate-pulse" />
                              )}
                            </div>

                            <div className="flex items-center justify-center w-full">
                              {status === 'F' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#34D399] text-[#0D0D0F]">
                                  F
                                </span>
                              ) : status === 'H' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FBBF24] text-[#0D0D0F]">
                                  H
                                </span>
                              ) : status === 'A' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F87171] text-[#0D0D0F]">
                                  A
                                </span>
                              ) : eligibility.eligible ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] dark:bg-[#2A2D35]" />
                              ) : (
                                <span className="text-[#9CA3AF] dark:text-[#555] text-[10px]">—</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] flex items-center justify-between pt-1">
                    <span>Tap any date to edit attendance</span>
                    <span className="text-[#047857] dark:text-[#34D399]">● Full</span>
                    <span className="text-[#B45309] dark:text-[#FBBF24]">● Half</span>
                    <span className="text-[#B91C1C] dark:text-[#F87171]">● Absent</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 3: 31-DAY MATRIX                                      */}
      {/* ========================================================== */}
      {viewMode === 'matrix' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#5B6472] dark:text-[#858A94]">
            <span className="inline-flex items-center gap-1.5">
              <span>Full 31-Day View · Horizontal scroll to view all days</span>
            </span>
            <span className="font-mono text-[11px] text-[#B93A2B] dark:text-[#FF8278]">
              Tip: Click any cell or use Arrow Keys + F/H/A
            </span>
          </div>

          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="grid"
            aria-label="Attendance Sheet"
            className="rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] bg-white dark:bg-[#14161B] focus:outline-none focus:ring-1 focus:ring-[#FF8278] shadow-sm overflow-hidden"
          >
            <div ref={tableContainerRef} className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F3F4F6] dark:bg-[#101216] border-b border-[#E5E7EB] dark:border-[#23262D] text-[#5B6472] dark:text-[#858A94] font-mono select-none sticky top-0 z-20">
                    <th
                      scope="col"
                      className="sticky left-0 z-30 bg-[#F3F4F6] dark:bg-[#101216] py-3.5 px-3.5 w-44 min-w-[176px] max-w-[176px] text-left font-semibold text-[#111827] dark:text-[#F2F0EC] border-r-2 border-[#D1D5DB] dark:border-[#2D3139] shadow-[4px_0_12px_rgba(0,0,0,0.5)]"
                    >
                      Staff Member
                    </th>

                    {Array.from({ length: totalDays }).map((_, i) => {
                      const dayNum = i + 1;
                      const weekend = isWeekend(month, dayNum);
                      const dayLetter = getWeekdayName(month, dayNum, 'narrow');
                      const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;

                      return (
                        <th
                          key={dayNum}
                          ref={isToday ? todayColRef : undefined}
                          scope="col"
                          className={`py-2 px-1 text-center min-w-[36px] sm:min-w-[40px] border-r border-[#E5E7EB] dark:border-[#23262D] transition-colors ${
                            isToday
                              ? 'bg-[#FFF1F0] dark:bg-[#2A1616] text-[#B93A2B] dark:text-[#FF8278] border-b-2 border-b-[#FF8278]'
                              : weekend
                              ? 'bg-[#F9FAFB] dark:bg-[#181B20] text-[#B93A2B] dark:text-[#FF8278]/90'
                              : 'text-[#4B5563] dark:text-[#858A94]'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-medium">{dayLetter}</div>
                          <div
                            className={`font-bold tabular-nums text-xs mt-0.5 ${
                              isToday ? 'text-[#B93A2B] dark:text-[#FF8278]' : 'text-[#111827] dark:text-[#F2F0EC]'
                            }`}
                          >
                            {dayNum}
                          </div>
                          {isToday && (
                            <div className="text-[9px] font-mono text-[#B93A2B] dark:text-[#FF8278] tracking-tighter font-bold">
                              TODAY
                            </div>
                          )}
                        </th>
                      );
                    })}

                    <th scope="col" className="py-3 px-2 text-center min-w-[36px] font-bold text-[#047857] dark:text-[#34D399]">
                      F
                    </th>
                    <th scope="col" className="py-3 px-2 text-center min-w-[36px] font-bold text-[#B45309] dark:text-[#FBBF24]">
                      H
                    </th>
                    <th scope="col" className="py-3 px-2 text-center min-w-[36px] font-bold text-[#B91C1C] dark:text-[#F87171]">
                      A
                    </th>
                    <th scope="col" className="py-3 px-3 text-right min-w-[90px] font-semibold text-[#B93A2B] dark:text-[#FF8278]">
                      Total Wage
                    </th>
                    <th scope="col" className="py-3 px-2 text-center min-w-[75px] font-medium text-[#5B6472] dark:text-[#858A94]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#23262D]">
                  {rowSummaries.map(({ emp, salary, payment, days }, empIdx) => {
                    const isPaid = !!payment;

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-[#F3F4F6]/60 dark:hover:bg-[#1A1D23]/60 transition-colors group"
                      >
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-white dark:bg-[#14161B] group-hover:bg-[#F3F4F6] dark:group-hover:bg-[#1A1D23] py-2.5 px-3.5 w-44 min-w-[176px] max-w-[176px] font-normal text-[#111827] dark:text-[#F2F0EC] border-r-2 border-[#D1D5DB] dark:border-[#2D3139] truncate text-left shadow-[4px_0_12px_rgba(0,0,0,0.4)]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] dark:bg-[#1E222A] text-[#B93A2B] dark:text-[#FF8278] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#D1D5DB] dark:border-[#2D3139]">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 truncate">
                              <Link
                                to={`/app/employees/${emp.id}?month=${month}`}
                                className="font-semibold text-xs text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors truncate block"
                              >
                                {emp.name}
                              </Link>
                              <div className="text-[10px] font-mono text-[#5B6472] dark:text-[#858A94]">
                                ₹{salary.rate.full}/d
                              </div>
                            </div>
                          </div>
                        </th>

                        {Array.from({ length: totalDays }).map((_, i) => {
                          const dayNum = i + 1;
                          const dayKey = formatDayKey(year, monthNum, dayNum);
                          const eligibility = checkDayEligibility(
                            dayKey,
                            emp.joinedOn,
                            emp.leftOn,
                            today
                          );
                          const status = days[String(dayNum)] || null;
                          const weekend = isWeekend(month, dayNum);
                          const isToday = isSelectedMonthCurrent && dayNum === currentDayNum;
                          const isFocused =
                            focusedCell?.empIndex === empIdx && focusedCell?.day === dayNum;

                          return (
                            <td
                              key={dayNum}
                              onClick={() => {
                                setFocusedCell({ empIndex: empIdx, day: dayNum });
                                if (eligibility.eligible) {
                                  let next: Status | null = null;
                                  if (!status) next = 'F';
                                  else if (status === 'F') next = 'H';
                                  else if (status === 'H') next = 'A';
                                  else next = null;
                                  applyStatusChange(emp.id, dayNum, next);
                                }
                              }}
                              className={`p-0 text-center border-r border-[#E5E7EB] dark:border-[#23262D] transition-all select-none ${
                                isToday
                                  ? 'bg-[#FFF5F5] dark:bg-[#2A1616]/40'
                                  : weekend
                                  ? 'bg-[#F9FAFB] dark:bg-[#121416]/50'
                                  : ''
                              } ${
                                !eligibility.eligible
                                  ? 'bg-[#F9FAFB] dark:bg-[#101216]/90 cursor-not-allowed opacity-30'
                                  : 'cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                              } ${isFocused ? 'ring-2 ring-[#FF8278] z-10' : ''}`}
                            >
                              <div className="w-full h-9 flex items-center justify-center">
                                {status ? (
                                  <StatusBadge status={status} size="sm" />
                                ) : eligibility.eligible ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] dark:bg-[#2A2D35]" />
                                ) : (
                                  <span className="text-[#9CA3AF] dark:text-[#555] text-[10px]">—</span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-2 px-1 text-center font-mono font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                          {salary.full}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-bold text-[#B45309] dark:text-[#FBBF24] tabular-nums">
                          {salary.half}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-bold text-[#B91C1C] dark:text-[#F87171] tabular-nums">
                          {salary.absent}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#B93A2B] dark:text-[#FF8278] tabular-nums">
                          {formatINR(salary.amount)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <StatusBadge status={isPaid ? 'paid' : 'pending'} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-[#F3F4F6] dark:bg-[#101216] font-mono border-t-2 border-[#D1D5DB] dark:border-[#292D35] text-[#111827] dark:text-[#F2F0EC]">
                    <td className="sticky left-0 z-30 bg-[#F3F4F6] dark:bg-[#101216] py-3.5 px-3.5 font-semibold border-r-2 border-[#D1D5DB] dark:border-[#292D35] w-44 min-w-[176px] max-w-[176px]">
                      {strings.sheet.grandTotal}
                    </td>

                    {perDayFullCounts.map((count, i) => (
                      <td
                        key={i}
                        className="py-2 px-1 text-center text-[#5B6472] dark:text-[#858A94] text-[11px] tabular-nums border-r border-[#E5E7EB] dark:border-[#23262D]"
                      >
                        {count > 0 ? count : ''}
                      </td>
                    ))}

                    <td className="py-3 px-1 text-center font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                      {totalFullDaysAllStaff}
                    </td>
                    <td className="py-3 px-1 text-center font-bold text-[#B45309] dark:text-[#FBBF24] tabular-nums">
                      {totalHalfDaysAllStaff}
                    </td>
                    <td className="py-3 px-1 text-center text-[#5B6472] dark:text-[#60646C]">
                      —
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-sm text-[#B93A2B] dark:text-[#FF8278] tabular-nums">
                      {formatINR(grandTotalSalary)}
                    </td>
                    <td className="py-3 px-2 text-center text-[#5B6472] dark:text-[#60646C]">
                      —
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* QUICK DAY EDIT MODAL / BOTTOM SHEET (FOR CALENDAR VIEW)     */}
      {/* ========================================================== */}
      {quickEditDay && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md p-5 bg-white dark:bg-[#17191C] rounded-t-2xl sm:rounded-2xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 space-y-4">
            <button
              type="button"
              onClick={() => setQuickEditDay(null)}
              className="absolute top-4 right-4 p-1.5 text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] rounded transition-colors cursor-pointer"
              aria-label={strings.common.close}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] uppercase tracking-wider">
                Mark Attendance
              </div>
              <h3 className="text-base font-bold text-[#111827] dark:text-[#F2F0EC] mt-0.5">
                {quickEditDay.emp.name}
              </h3>
              <p className="text-xs font-mono text-[#5B6472] dark:text-[#858A94] mt-0.5">
                {formatDisplayDate(formatDayKey(year, monthNum, quickEditDay.day))}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  applyStatusChange(quickEditDay.emp.id, quickEditDay.day, 'F');
                  setQuickEditDay(null);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  quickEditDay.currentStatus === 'F'
                    ? 'bg-[#ECFDF5] dark:bg-[#10241A] border-[#34D399] text-[#047857] dark:text-[#34D399] ring-1 ring-[#34D399]'
                    : 'bg-white dark:bg-[#121418] border-[#D1D5DB] dark:border-[#292D35] text-[#111827] dark:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1B1E26]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#34D399] text-[#0D0D0F] font-bold text-sm flex items-center justify-center">
                    F
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Full Day</div>
                    <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                      Wage: ₹{quickEditDay.emp.rates[0]?.full ?? 0}
                    </div>
                  </div>
                </div>
                {quickEditDay.currentStatus === 'F' && <Check className="w-5 h-5 text-[#047857] dark:text-[#34D399]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  applyStatusChange(quickEditDay.emp.id, quickEditDay.day, 'H');
                  setQuickEditDay(null);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  quickEditDay.currentStatus === 'H'
                    ? 'bg-[#FFFBEB] dark:bg-[#262013] border-[#FBBF24] text-[#B45309] dark:text-[#FBBF24] ring-1 ring-[#FBBF24]'
                    : 'bg-white dark:bg-[#121418] border-[#D1D5DB] dark:border-[#292D35] text-[#111827] dark:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1B1E26]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FBBF24] text-[#0D0D0F] font-bold text-sm flex items-center justify-center">
                    H
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Half Day</div>
                    <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                      Wage: ₹{quickEditDay.emp.rates[0]?.half ?? 0}
                    </div>
                  </div>
                </div>
                {quickEditDay.currentStatus === 'H' && <Check className="w-5 h-5 text-[#B45309] dark:text-[#FBBF24]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  applyStatusChange(quickEditDay.emp.id, quickEditDay.day, 'A');
                  setQuickEditDay(null);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  quickEditDay.currentStatus === 'A'
                    ? 'bg-[#FEF2F2] dark:bg-[#291717] border-[#F87171] text-[#B91C1C] dark:text-[#F87171] ring-1 ring-[#F87171]'
                    : 'bg-white dark:bg-[#121418] border-[#D1D5DB] dark:border-[#292D35] text-[#111827] dark:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1B1E26]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F87171] text-[#0D0D0F] font-bold text-sm flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Absent</div>
                    <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94]">Wage: ₹0</div>
                  </div>
                </div>
                {quickEditDay.currentStatus === 'A' && <Check className="w-5 h-5 text-[#B91C1C] dark:text-[#F87171]" />}
              </button>

              {quickEditDay.currentStatus && (
                <button
                  type="button"
                  onClick={() => {
                    applyStatusChange(quickEditDay.emp.id, quickEditDay.day, null);
                    setQuickEditDay(null);
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#D1D5DB] dark:border-[#292D35] bg-white dark:bg-[#121418] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D24] text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] transition-colors cursor-pointer mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Attendance</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Dialog */}
      <ConfirmDialog
        isOpen={showHelpDialog}
        title={strings.sheet.shortcutsHelp}
        description="Keyboard shortcuts for rapid attendance management:"
        confirmLabel="Got it"
        onConfirm={() => setShowHelpDialog(false)}
        onCancel={() => setShowHelpDialog(false)}
      >
        <div className="space-y-2 text-xs font-mono text-[#4B5563] dark:text-[#92969D]">
          <div className="p-2 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
            {strings.sheet.shortcutArrows}
          </div>
          <div className="p-2 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
            {strings.sheet.shortcutKeys}
          </div>
          <div className="p-2 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
            {strings.sheet.shortcutSpace}
          </div>
          <div className="p-2 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
            {strings.sheet.shortcutDelete}
          </div>
          <div className="p-2 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
            {strings.sheet.shortcutHomeEnd}
          </div>
          <div className="p-2 bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg">
            {strings.sheet.shortcutHelpKey}
          </div>
        </div>
      </ConfirmDialog>

      {/* Warning when editing already paid month */}
      <ConfirmDialog
        isOpen={!!pendingEdit}
        title="Edit Paid Month?"
        description={strings.sheet.paidMonthWarning}
        confirmLabel="Edit Anyway"
        variant="warning"
        onConfirm={handleConfirmPaidEdit}
        onCancel={() => setPendingEdit(null)}
      />
    </div>
  );
}
