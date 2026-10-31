import React from 'react';
import type { Status } from '@/domain/types';
import { strings } from '@/strings/en';

interface StatusBadgeProps {
  status?: Status | 'paid' | 'pending' | 'unmarked' | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const isSm = size === 'sm';

  switch (status) {
    case 'F':
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold tracking-tight rounded bg-[#ECFDF5] dark:bg-[#102A1E] text-[#047857] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#1C4B33] ${
            isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
          } ${className}`}
          title={strings.common.full}
        >
          {strings.common.f}
        </span>
      );
    case 'H':
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold tracking-tight rounded bg-[#FFFBEB] dark:bg-[#2A200F] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#4D3815] ${
            isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
          } ${className}`}
          title={strings.common.half}
        >
          {strings.common.h}
        </span>
      );
    case 'A':
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold tracking-tight rounded bg-[#FEF2F2] dark:bg-[#2B1414] text-[#B91C1C] dark:text-[#F87171] border border-[#FECACA] dark:border-[#4C2020] ${
            isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
          } ${className}`}
          title={strings.common.absent}
        >
          {strings.common.a}
        </span>
      );
    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium tracking-tight rounded border border-[#A7F3D0] dark:border-[#1C4B33] bg-[#ECFDF5] dark:bg-[#102A1E] text-[#047857] dark:text-[#34D399] ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
          {strings.common.paid}
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium tracking-tight rounded border border-[#FDE68A] dark:border-[#4D3815] bg-[#FFFBEB] dark:bg-[#2A200F] text-[#B45309] dark:text-[#FBBF24] ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
          {strings.common.pending}
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center justify-center text-[#5B6472] dark:text-[#60646C] ${
            isSm ? 'text-[11px]' : 'text-xs'
          } ${className}`}
        >
          —
        </span>
      );
  }
}
