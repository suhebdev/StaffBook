import React, { useState } from 'react';
import type { MonthKey } from '@/domain/types';
import { monthOf, todayKey } from '@/domain/dates';
import { strings } from '@/strings/en';

interface RateChangeDialogProps {
  isOpen: boolean;
  initialMonth?: MonthKey;
  onConfirm: (effectiveFrom: MonthKey) => void;
  onCancel: () => void;
}

export function RateChangeDialog({
  isOpen,
  initialMonth,
  onConfirm,
  onCancel,
}: RateChangeDialogProps) {
  const currentMonth = monthOf(todayKey());
  const [effectiveMonth, setEffectiveMonth] = useState<MonthKey>(
    initialMonth || currentMonth
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(effectiveMonth);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#17191C] rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl">
        <h3 className="text-base font-semibold text-[#111827] dark:text-[#F2F0EC]">
          {strings.rateChange.title}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed">
          {strings.rateChange.desc}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
              {strings.rateChange.effectiveMonthLabel}
            </label>
            <input
              type="month"
              value={effectiveMonth}
              onChange={(e) => setEffectiveMonth(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono focus:outline-none focus:border-[#FF8278]"
            />
            <p className="mt-1.5 text-[11px] text-[#4B5563] dark:text-[#92969D]">
              {strings.rateChange.pastMonthsSafeNote}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB] dark:border-[#292B2F]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-medium text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg transition-colors cursor-pointer min-h-[38px]"
            >
              {strings.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer min-h-[38px]"
            >
              {strings.common.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
