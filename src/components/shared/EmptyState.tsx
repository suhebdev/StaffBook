import React from 'react';
import { LucideIcon } from 'lucide-react';
import { strings } from '@/strings/en';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#292B2F] bg-white/50 dark:bg-[#121416]/50 ${className}`}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#4B5563] dark:text-[#92969D] mb-4">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="text-sm sm:text-base font-semibold text-[#111827] dark:text-[#F2F0EC] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer min-h-[38px]"
          >
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] bg-white dark:bg-[#17191C] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg transition-colors cursor-pointer min-h-[38px]"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
