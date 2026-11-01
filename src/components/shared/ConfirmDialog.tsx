import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { strings } from '@/strings/en';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = strings.common.confirm,
  cancelLabel = strings.common.cancel,
  variant = 'primary',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmColor =
    variant === 'danger'
      ? 'bg-[#F87171] hover:bg-[#EF4444] text-[#0D0D0F] font-semibold'
      : variant === 'warning'
      ? 'bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0D0D0F] font-semibold'
      : 'bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] font-semibold';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#17191C] rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] rounded transition-colors cursor-pointer"
          aria-label={strings.common.close}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          {variant !== 'primary' && (
            <div
              className={`p-2 rounded-lg shrink-0 ${
                variant === 'danger'
                  ? 'bg-[#FEF2F2] dark:bg-[#2B1414] text-[#B91C1C] dark:text-[#F87171] border border-[#FECACA] dark:border-[#4C2020]'
                  : 'bg-[#FFFBEB] dark:bg-[#2A200F] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#4D3815]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-[#111827] dark:text-[#F2F0EC]"
            >
              {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed">
              {description}
            </p>
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#292B2F]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] border border-[#E5E7EB] dark:border-[#292B2F] rounded-lg transition-colors cursor-pointer min-h-[38px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs rounded-lg transition-colors cursor-pointer min-h-[38px] ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
