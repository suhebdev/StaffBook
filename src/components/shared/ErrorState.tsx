import React from 'react';
import { AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { strings } from '@/strings/en';

interface ErrorStateProps {
  message?: string;
  errorCode?: string;
  errorPath?: string;
  operation?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message,
  errorCode,
  errorPath,
  operation,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-2xl border border-[#FECACA] dark:border-[#3A1E1E] bg-[#FEF2F2] dark:bg-[#181112] shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] dark:bg-[#2B1414] border border-[#FECACA] dark:border-[#4C2020] flex items-center justify-center text-[#B91C1C] dark:text-[#F87171] mb-3 shadow-sm">
        <AlertCircle className="w-6 h-6 stroke-[2]" />
      </div>
      <h3 className="text-base font-semibold text-[#111827] dark:text-[#F2F0EC] mb-1">
        Something went wrong
      </h3>
      <p className="text-xs sm:text-sm text-[#374151] dark:text-[#A6ABB4] max-w-sm mb-4 leading-relaxed">
        {message || strings.errors.unknown}
      </p>

      {/* Discreet Technical Diagnostics Drawer */}
      {(errorCode || errorPath || operation) && (
        <details className="mb-5 text-left max-w-md w-full group rounded-xl bg-white dark:bg-[#121417] border border-[#E5E7EB] dark:border-[#2B2F38] overflow-hidden">
          <summary className="flex items-center justify-between px-3.5 py-2 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] cursor-pointer select-none">
            <span>Diagnostic Details</span>
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-3 pt-1 text-xs font-mono space-y-1 border-t border-[#E5E7EB] dark:border-[#23262D] text-[#111827] dark:text-[#F2F0EC]">
            {errorCode && (
              <div>
                <span className="text-[#5B6472] dark:text-[#858A94]">Code: </span>
                <span className="text-[#B91C1C] dark:text-[#F87171] font-semibold">{errorCode}</span>
              </div>
            )}
            {operation && (
              <div>
                <span className="text-[#5B6472] dark:text-[#858A94]">Operation: </span>
                <span className="text-[#111827] dark:text-[#F2F0EC]">{operation}</span>
              </div>
            )}
            {errorPath && (
              <div>
                <span className="text-[#5B6472] dark:text-[#858A94]">Path: </span>
                <span className="text-[#B93A2B] dark:text-[#FF8278] break-all">{errorPath}</span>
              </div>
            )}
          </div>
        </details>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0D0D0F] bg-gradient-to-r from-[#FF8278] to-[#FFA096] hover:from-[#FF958C] hover:to-[#FFB0A7] rounded-xl transition-all cursor-pointer shadow-md shadow-[#FF8278]/20 min-h-[38px] active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{strings.common.retry}</span>
        </button>
      )}
    </div>
  );
}
