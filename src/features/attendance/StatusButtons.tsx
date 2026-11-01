import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import type { Status } from '@/domain/types';
import { strings } from '@/strings/en';

interface StatusButtonsProps {
  currentStatus: Status | null | undefined;
  onChange: (newStatus: Status | null) => void;
  disabled?: boolean;
  disabledReason?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusButtons({
  currentStatus,
  onChange,
  disabled = false,
  disabledReason,
  size = 'md',
}: StatusButtonsProps) {
  const handleClick = (status: Status) => {
    if (disabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch (_) {}

    if (currentStatus === status) {
      onChange(null);
    } else {
      onChange(status);
    }
  };

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  // Mobile / Large full-width card layout
  if (isLg) {
    return (
      <div
        className={`grid grid-cols-3 gap-2 w-full ${
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
        }`}
        title={disabled ? disabledReason : undefined}
      >
        {/* Full (F) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleClick('F')}
          className={`relative flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer select-none min-h-[48px] active:scale-[0.98] ${
            currentStatus === 'F'
              ? 'bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#6EE7B7] border-2 border-[#A7F3D0] dark:border-[#10B981] shadow-lg shadow-[#10B981]/15 font-semibold'
              : 'bg-white dark:bg-[#15171C] text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F]'
          }`}
          aria-pressed={currentStatus === 'F'}
          aria-label={strings.common.full}
        >
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              currentStatus === 'F' ? 'bg-[#10B981] text-[#064E3B]' : 'bg-[#E5E7EB] dark:bg-[#292B2F] text-[#4B5563] dark:text-[#92969D]'
            }`}
          >
            {currentStatus === 'F' ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : 'F'}
          </div>
          <span>Full Day</span>
        </button>

        {/* Half (H) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleClick('H')}
          className={`relative flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer select-none min-h-[48px] active:scale-[0.98] ${
            currentStatus === 'H'
              ? 'bg-[#FFFBEB] dark:bg-[#78350F] text-[#B45309] dark:text-[#FDE68A] border-2 border-[#FDE68A] dark:border-[#F59E0B] shadow-lg shadow-[#F59E0B]/15 font-semibold'
              : 'bg-white dark:bg-[#15171C] text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F]'
          }`}
          aria-pressed={currentStatus === 'H'}
          aria-label={strings.common.half}
        >
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              currentStatus === 'H' ? 'bg-[#F59E0B] text-[#78350F]' : 'bg-[#E5E7EB] dark:bg-[#292B2F] text-[#4B5563] dark:text-[#92969D]'
            }`}
          >
            {currentStatus === 'H' ? <Clock className="w-2.5 h-2.5 stroke-[3]" /> : 'H'}
          </div>
          <span>Half Day</span>
        </button>

        {/* Absent (A) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleClick('A')}
          className={`relative flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer select-none min-h-[48px] active:scale-[0.98] ${
            currentStatus === 'A'
              ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D] text-[#B91C1C] dark:text-[#FECACA] border-2 border-[#FECACA] dark:border-[#EF4444] shadow-lg shadow-[#EF4444]/15 font-semibold'
              : 'bg-white dark:bg-[#15171C] text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F]'
          }`}
          aria-pressed={currentStatus === 'A'}
          aria-label={strings.common.absent}
        >
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              currentStatus === 'A' ? 'bg-[#EF4444] text-[#7F1D1D]' : 'bg-[#E5E7EB] dark:bg-[#292B2F] text-[#4B5563] dark:text-[#92969D]'
            }`}
          >
            {currentStatus === 'A' ? <X className="w-2.5 h-2.5 stroke-[3]" /> : 'A'}
          </div>
          <span>Absent</span>
        </button>
      </div>
    );
  }

  // Desktop table / compact size
  const btnBase = isSm
    ? 'w-7 h-7 text-[11px] font-mono font-bold'
    : 'min-w-[36px] h-9 px-2 text-xs font-mono font-bold';

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] gap-1 shadow-sm ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      }`}
      title={disabled ? disabledReason : undefined}
    >
      {/* Full (F) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('F')}
        className={`rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${btnBase} ${
          currentStatus === 'F'
            ? 'bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#6EE7B7] border border-[#A7F3D0] dark:border-[#10B981] shadow-sm font-bold ring-1 ring-[#10B981]/50'
            : 'text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D23] border border-transparent'
        }`}
        aria-pressed={currentStatus === 'F'}
        aria-label={strings.common.full}
      >
        {currentStatus === 'F' && <Check className="w-3 h-3 stroke-[2.5]" />}
        <span>F</span>
      </button>

      {/* Half (H) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('H')}
        className={`rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${btnBase} ${
          currentStatus === 'H'
            ? 'bg-[#FFFBEB] dark:bg-[#78350F] text-[#B45309] dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#F59E0B] shadow-sm font-bold ring-1 ring-[#F59E0B]/50'
            : 'text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D23] border border-transparent'
        }`}
        aria-pressed={currentStatus === 'H'}
        aria-label={strings.common.half}
      >
        {currentStatus === 'H' && <Clock className="w-3 h-3 stroke-[2.5]" />}
        <span>H</span>
      </button>

      {/* Absent (A) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleClick('A')}
        className={`rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${btnBase} ${
          currentStatus === 'A'
            ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D] text-[#B91C1C] dark:text-[#FECACA] border border-[#FECACA] dark:border-[#EF4444] shadow-sm font-bold ring-1 ring-[#EF4444]/50'
            : 'text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D23] border border-transparent'
        }`}
        aria-pressed={currentStatus === 'A'}
        aria-label={strings.common.absent}
      >
        {currentStatus === 'A' && <X className="w-3 h-3 stroke-[2.5]" />}
        <span>A</span>
      </button>
    </div>
  );
}
