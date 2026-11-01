import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { MonthKey } from '@/domain/types';
import { addMonths, formatDisplayMonth, monthOf, todayKey } from '@/domain/dates';
import { strings } from '@/strings/en';

interface MonthPickerProps {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const currentMonth = monthOf(todayKey());
  const isCurrent = value === currentMonth;

  const handlePrev = () => {
    onChange(addMonths(value, -1));
  };

  const handleNext = () => {
    onChange(addMonths(value, 1));
  };

  const handleCurrentJump = () => {
    onChange(currentMonth);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] rounded-xl shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={handlePrev}
        className="w-8 h-8 flex items-center justify-center text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer"
        aria-label="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-3 py-1 font-medium text-xs sm:text-sm text-[#111827] dark:text-[#F2F0EC] min-w-[130px] justify-center tabular-nums">
        <Calendar className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278] shrink-0" />
        <span className="font-mono">{formatDisplayMonth(value, 'long')}</span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-8 h-8 flex items-center justify-center text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer"
        aria-label="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrent && (
        <button
          type="button"
          onClick={handleCurrentJump}
          className="ml-1 px-2.5 py-1 text-xs font-mono font-medium text-[#B93A2B] dark:text-[#FF8278] bg-[#FF8278]/10 hover:bg-[#FF8278]/20 rounded-lg transition-colors cursor-pointer"
        >
          {strings.common.today}
        </button>
      )}
    </div>
  );
}
