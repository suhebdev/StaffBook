import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, History, Archive, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Employee, MonthKey, RateEntry } from '@/domain/types';
import { todayKey, monthOf, formatDisplayMonth, formatDisplayDate } from '@/domain/dates';
import { applyRateChange, getRateForMonth } from '@/domain/rates';
import { downloadEmployeeIcs } from '@/lib/ics';
import { RateChangeDialog } from './RateChangeDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { strings } from '@/strings/en';

interface EmployeeFormProps {
  initialEmployee?: Employee;
  onSave: (emp: Omit<Employee, 'id'> & { id?: string }) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
}

export function EmployeeForm({ initialEmployee, onSave, onDelete }: EmployeeFormProps) {
  const navigate = useNavigate();
  const isEditing = !!initialEmployee;
  const today = todayKey();
  const currentMonth = monthOf(today);

  // Form State
  const [name, setName] = useState(initialEmployee?.name || '');
  const [phone, setPhone] = useState(initialEmployee?.phone || '');
  const [joinedOn, setJoinedOn] = useState(initialEmployee?.joinedOn || today);
  const [leftOn, setLeftOn] = useState(initialEmployee?.leftOn || '');
  const [active, setActive] = useState(initialEmployee?.active ?? true);

  // Current effective rate values in the input boxes
  const initialRate = initialEmployee
    ? getRateForMonth(initialEmployee.rates, currentMonth)
    : { full: 500, half: 250 };

  const [fullRate, setFullRate] = useState<number>(initialRate.full);
  const [halfRate, setHalfRate] = useState<number>(initialRate.half);
  const [ratesList, setRatesList] = useState<RateEntry[]>(
    initialEmployee?.rates || [
      { effectiveFrom: monthOf(initialEmployee?.joinedOn || today), full: 500, half: 250 },
    ]
  );

  // Reminder State
  const [reminderEnabled, setReminderEnabled] = useState(
    initialEmployee?.reminder.enabled ?? true
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    initialEmployee?.reminder.dayOfMonth ?? 5
  );
  const [hour, setHour] = useState<number>(initialEmployee?.reminder.hour ?? 10);
  const [minute, setMinute] = useState<number>(initialEmployee?.reminder.minute ?? 0);
  const [forMonth, setForMonth] = useState<'previous' | 'same'>(
    initialEmployee?.reminder.forMonth ?? 'previous'
  );

  // UI Dialog States
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRateChangeDialog, setShowRateChangeDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Mark dirty on changes
  useEffect(() => {
    setIsDirty(true);
  }, [name, phone, joinedOn, fullRate, halfRate, reminderEnabled, dayOfMonth, hour, minute, forMonth]);

  // Unsaved changes prompt on window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !saving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, saving]);

  const handleFullRateChange = (val: number) => {
    setFullRate(val);
    setHalfRate(Math.round(val / 2));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Employee name is required');
      return;
    }

    if (fullRate <= 0) {
      toast.error('Full day rate must be greater than 0');
      return;
    }

    if (isEditing) {
      const latestEffectiveRate = getRateForMonth(ratesList, currentMonth);
      if (
        latestEffectiveRate.full !== fullRate ||
        latestEffectiveRate.half !== halfRate
      ) {
        setShowRateChangeDialog(true);
        return;
      }
    }

    executeSave(ratesList);
  };

  const handleRateChangeConfirm = (effectiveFrom: MonthKey) => {
    setShowRateChangeDialog(false);
    const updatedRates = applyRateChange(ratesList, {
      effectiveFrom,
      full: fullRate,
      half: halfRate,
    });
    setRatesList(updatedRates);
    executeSave(updatedRates);
  };

  const executeSave = async (ratesToSave: RateEntry[]) => {
    setSaving(true);
    try {
      let finalRates = ratesToSave;
      if (!isEditing) {
        finalRates = [
          {
            effectiveFrom: monthOf(joinedOn),
            full: fullRate,
            half: halfRate,
          },
        ];
      }

      const payload: Omit<Employee, 'id'> & { id?: string } = {
        id: initialEmployee?.id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        joinedOn,
        leftOn: leftOn || undefined,
        active,
        rates: finalRates,
        reminder: {
          enabled: reminderEnabled,
          dayOfMonth,
          hour,
          minute,
          forMonth,
        },
      };

      const savedId = await onSave(payload);
      setIsDirty(false);
      toast.success(isEditing ? 'Employee updated' : 'Employee created');
      navigate(`/app/employees/${savedId || initialEmployee?.id || ''}`);
    } catch (err: any) {
      toast.error('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    setActive(false);
    setLeftOn(today);
    setShowArchiveDialog(false);
    toast.info('Status changed to Archived. Save to persist.');
  };

  const handleUnarchive = () => {
    setActive(true);
    setLeftOn('');
    setShowUnarchiveDialog(false);
    toast.info('Status changed to Active. Save to persist.');
  };

  const handleDelete = async () => {
    if (!initialEmployee?.id || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialEmployee.id);
      setIsDirty(false);
      setShowDeleteDialog(false);
      toast.success(strings.employeeForm.deleteSuccess);
      navigate('/app/employees', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || strings.employeeForm.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadIcs = () => {
    const dummyEmp: Employee = {
      id: initialEmployee?.id || 'new',
      name: name || 'Staff',
      joinedOn,
      active: true,
      rates: ratesList,
      reminder: {
        enabled: reminderEnabled,
        dayOfMonth,
        hour,
        minute,
        forMonth,
      },
    };
    downloadEmployeeIcs(dummyEmp);
    toast.success('Calendar .ics file downloaded');
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-6 max-w-3xl">
        {/* Section 1: Basics */}
        <div className="bg-white dark:bg-[#14161B] p-4 sm:p-7 rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
            {strings.employeeForm.basicsSection}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                {strings.employeeForm.nameLabel} <span className="text-[#B93A2B] dark:text-[#FF8278]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                placeholder={strings.employeeForm.namePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm focus:outline-none focus:border-[#FF8278]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                {strings.employeeForm.phoneLabel}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={strings.employeeForm.phonePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm focus:outline-none focus:border-[#FF8278]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                {strings.employeeForm.joinedOnLabel} <span className="text-[#B93A2B] dark:text-[#FF8278]">*</span>
              </label>
              <input
                type="date"
                value={joinedOn}
                onChange={(e) => setJoinedOn(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono focus:outline-none focus:border-[#FF8278]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pay rates */}
        <div className="bg-white dark:bg-[#14161B] p-4 sm:p-7 rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
              {strings.employeeForm.ratesSection}
            </h2>
            {isEditing && (
              <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278]">
                {strings.employees.ratesChangedNotice}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                {strings.employeeForm.fullRateLabel} <span className="text-[#B93A2B] dark:text-[#FF8278]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-[#92969D] font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={fullRate || ''}
                  onChange={(e) => handleFullRateChange(parseInt(e.target.value, 10) || 0)}
                  required
                  placeholder={strings.employeeForm.fullRatePlaceholder}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono tabular-nums focus:outline-none focus:border-[#FF8278]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                {strings.employeeForm.halfRateLabel} <span className="text-[#B93A2B] dark:text-[#FF8278]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-[#92969D] font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={halfRate || ''}
                  onChange={(e) => setHalfRate(parseInt(e.target.value, 10) || 0)}
                  required
                  placeholder={strings.employeeForm.halfRatePlaceholder}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono tabular-nums focus:outline-none focus:border-[#FF8278]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#4B5563] dark:text-[#92969D]">
                {strings.employeeForm.halfRateHelper}
              </p>
            </div>
          </div>

          {/* Read-only rate history table */}
          {isEditing && ratesList.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#292B2F]">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-3.5 h-3.5 text-[#4B5563] dark:text-[#92969D]" />
                <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#4B5563] dark:text-[#92969D]">
                  {strings.employees.rateHistory}
                </h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] dark:border-[#292B2F]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white dark:bg-[#121416] text-[#4B5563] dark:text-[#92969D] font-mono border-b border-[#E5E7EB] dark:border-[#292B2F]">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">{strings.employees.effectiveFrom}</th>
                      <th className="py-2.5 px-3 font-medium">{strings.common.full} (₹)</th>
                      <th className="py-2.5 px-3 font-medium">{strings.common.half} (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#292B2F]">
                    {ratesList.map((r, i) => (
                      <tr key={i} className="hover:bg-[#F3F4F6]/40 dark:hover:bg-[#1F2226]/40">
                        <td className="py-2 px-3 font-medium text-[#111827] dark:text-[#F2F0EC]">
                          {formatDisplayMonth(r.effectiveFrom, 'long')}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-[#4B5563] dark:text-[#92969D]">₹{r.full}</td>
                        <td className="py-2 px-3 font-mono tabular-nums text-[#4B5563] dark:text-[#92969D]">₹{r.half}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Reminder Section */}
        <div className="bg-white dark:bg-[#14161B] p-4 sm:p-7 rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
                {strings.employeeForm.reminderSection}
              </h2>
              <p className="mt-1 text-xs text-[#4B5563] dark:text-[#92969D]">
                {strings.employeeForm.reminderHelper}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#E5E7EB] dark:bg-[#292B2F] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-[#F2F0EC] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF8278] peer-checked:after:bg-[#F8F9FA] dark:peer-checked:after:bg-[#0D0D0F]" />
            </label>
          </div>

          {reminderEnabled && (
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#292B2F] grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                  {strings.employeeForm.reminderDayLabel}
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono tabular-nums focus:outline-none focus:border-[#FF8278]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                  {strings.employeeForm.reminderTimeLabel}
                </label>
                <input
                  type="time"
                  value={`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    setHour(h || 0);
                    setMinute(m || 0);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono focus:outline-none focus:border-[#FF8278]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                  {strings.employeeForm.reminderForMonthLabel}
                </label>
                <select
                  value={forMonth}
                  onChange={(e) => setForMonth(e.target.value as 'previous' | 'same')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm focus:outline-none focus:border-[#FF8278] cursor-pointer"
                >
                  <option value="previous" className="bg-white dark:bg-[#17191C]">{strings.employeeForm.reminderForPrevious}</option>
                  <option value="same" className="bg-white dark:bg-[#17191C]">{strings.employeeForm.reminderForSame}</option>
                </select>
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#17191C] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-xs font-mono text-[#111827] dark:text-[#F2F0EC] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278]" />
                  <span>{strings.employees.downloadIcs}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Danger Zone (Edit only) */}
        {isEditing && (
          <div className="bg-white dark:bg-[#14161B] p-4 sm:p-7 rounded-2xl border border-red-200 dark:border-red-950/70 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-red-100 dark:border-red-950/50">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] dark:text-[#F87171] shrink-0" />
              <h2 className="text-sm font-semibold text-[#DC2626] dark:text-[#F87171]">
                {strings.employeeForm.dangerSection}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Archive / Deactivate Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D]">
                <div>
                  <div className="text-xs font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
                    <span>{strings.employeeForm.archiveOptionTitle}</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        active
                          ? 'bg-[#ECFDF5]/60 dark:bg-[#064E3B]/60 text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/40'
                          : 'bg-[#F3F4F6] dark:bg-[#1B1E24] text-[#5B6472] dark:text-[#858A94] border border-[#E5E7EB] dark:border-[#292B2F]'
                      }`}
                    >
                      {active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6472] dark:text-[#858A94] mt-1 max-w-xl">
                    {active
                      ? strings.employeeForm.archiveOptionDesc
                      : `Archived on ${formatDisplayDate(leftOn || today)}.`}
                  </p>
                </div>

                {active ? (
                  <button
                    type="button"
                    onClick={() => setShowArchiveDialog(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB] dark:bg-[#2A200F] hover:bg-[#FEF3C7] dark:hover:bg-[#3D2E15] border border-[#FDE68A] dark:border-[#4D3815] rounded-xl transition-colors cursor-pointer min-h-[38px] shrink-0"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{strings.common.archive}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUnarchiveDialog(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#047857] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#102A1E] hover:bg-[#D1FAE5] dark:hover:bg-[#1A4230] border border-[#A7F3D0] dark:border-[#1C4B33] rounded-xl transition-colors cursor-pointer min-h-[38px] shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{strings.common.unarchive}</span>
                  </button>
                )}
              </div>

              {/* Permanently Delete Employee Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
                <div>
                  <div className="text-xs font-semibold text-[#991B1B] dark:text-[#FCA5A5] flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{strings.employeeForm.deleteOptionTitle}</span>
                  </div>
                  <p className="text-xs text-[#7F1D1D] dark:text-[#F87171]/80 mt-1 max-w-xl">
                    {strings.employeeForm.deleteOptionDesc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] dark:bg-[#DC2626] dark:hover:bg-[#EF4444] rounded-xl transition-colors cursor-pointer min-h-[38px] shrink-0 shadow-xs disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{strings.employeeForm.deleteButton}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-white dark:hover:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            {strings.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving || deleting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-[#0D0D0F] bg-gradient-to-r from-[#FF8278] to-[#FFA096] hover:from-[#FF958C] hover:to-[#FFB0A7] rounded-xl transition-all cursor-pointer disabled:opacity-50 min-h-[44px] flex items-center justify-center shadow-md shadow-[#FF8278]/20 active:scale-[0.98]"
          >
            {saving ? strings.common.saving : strings.common.save}
          </button>
        </div>
      </form>

      {/* Rate Change Dialog */}
      <RateChangeDialog
        isOpen={showRateChangeDialog}
        initialMonth={currentMonth}
        onConfirm={handleRateChangeConfirm}
        onCancel={() => setShowRateChangeDialog(false)}
      />

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        title={strings.employees.archiveConfirmTitle}
        description={strings.employees.archiveConfirmDesc}
        confirmLabel={strings.common.archive}
        variant="warning"
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      >
        <div>
          <label className="block text-xs font-mono text-[#4B5563] dark:text-[#92969D] mb-1">
            {strings.employees.leavingDateLabel}
          </label>
          <input
            type="date"
            value={leftOn || today}
            onChange={(e) => setLeftOn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono"
          />
        </div>
      </ConfirmDialog>

      {/* Unarchive Confirm Dialog */}
      <ConfirmDialog
        isOpen={showUnarchiveDialog}
        title={strings.employees.unarchiveConfirmTitle}
        description={strings.employees.unarchiveConfirmDesc}
        confirmLabel={strings.common.unarchive}
        variant="primary"
        onConfirm={handleUnarchive}
        onCancel={() => setShowUnarchiveDialog(false)}
      />

      {/* Delete Employee Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={strings.employeeForm.deleteConfirmTitle}
        description={`Are you sure you want to delete ${name || initialEmployee?.name || 'this employee'}? This will permanently delete their profile, all daily attendance history, and payment records from the database. This action cannot be undone.`}
        confirmLabel={deleting ? strings.employeeForm.deleting : strings.employeeForm.deleteConfirmButton}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
