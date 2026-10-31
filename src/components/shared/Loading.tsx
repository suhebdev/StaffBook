import React from 'react';
import { Loader2 } from 'lucide-react';
import { strings } from '@/strings/en';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function Loading({ fullScreen, message, className = '' }: LoadingProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center p-6 text-[#4B5563] dark:text-[#92969D] ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-[#B93A2B] dark:text-[#FF8278] mb-3" />
      <span className="text-xs font-mono tracking-tight">{message || strings.common.loading}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F9FA]/80 dark:bg-[#0D0D0F]/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-pulse space-y-2 p-4 bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] rounded-xl">
      <div className="h-7 bg-[#F3F4F6] dark:bg-[#1F2226] rounded w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-9 bg-[#F3F4F6]/60 dark:bg-[#1F2226]/60 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#17191C] animate-pulse space-y-3">
      <div className="h-4 bg-[#F3F4F6] dark:bg-[#1F2226] rounded w-1/3" />
      <div className="h-3.5 bg-[#F3F4F6]/60 dark:bg-[#1F2226]/60 rounded w-2/3" />
      <div className="h-8 bg-[#F3F4F6]/40 dark:bg-[#1F2226]/40 rounded w-full" />
    </div>
  );
}
