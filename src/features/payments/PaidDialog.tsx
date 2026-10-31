import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Employee, MonthKey, Payment } from '@/domain/types';
import { formatDisplayMonth, todayKey } from '@/domain/dates';
import { strings } from '@/strings/en';

interface PaidDialogProps {
  isOpen: boolean;
  employee: Employee | null;
  month: MonthKey;
  suggestedAmount: number;
  initialPayment?: Payment | null;
  onConfirm: (payment: Payment) => Promise<void>;
  onCancel: () => void;
}

export function PaidDialog({
  isOpen,
  employee,
  month,
  suggestedAmount,
  initialPayment,
  onConfirm,
  onCancel,
}: PaidDialogProps) {
  const [amount, setAmount] = useState<number>(suggestedAmount);
  const [paidOn, setPaidOn] = useState<string>(todayKey());
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (initialPayment) {
      setAmount(initialPayment.amount);
      setPaidOn(initialPayment.paidOn);
      setNote(initialPayment.note || '');
    } else {
      setAmount(suggestedAmount);
      setPaidOn(todayKey());
      setNote('');
    }
  }, [initialPayment, suggestedAmount, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirm({
        employeeId: employee.id,
        month,
        amount: Math.max(0, amount),
        paidOn,
        note: note.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#17191C] rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-semibold text-[#111827] dark:text-[#F2F0EC]">
          {strings.paidDialog.title}
        </h3>

        <div className="mt-1 text-xs text-[#4B5563] dark:text-[#92969D] flex items-center gap-2">
          <span className="font-medium text-[#111827] dark:text-[#F2F0EC]">
            {employee.name}
          </span>
          <span>·</span>
          <span>{formatDisplayMonth(month, 'long')}</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
              {strings.paidDialog.amountLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-[#92969D] font-mono">
                ₹
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono tabular-nums focus:outline-none focus:border-[#FF8278]"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#4B5563] dark:text-[#92969D]">
              {strings.paidDialog.amountHelper}
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
              {strings.paidDialog.dateLabel}
            </label>
            <input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm font-mono focus:outline-none focus:border-[#FF8278]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
              {strings.paidDialog.noteLabel}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={strings.paidDialog.notePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] text-sm placeholder-[#6B7280] dark:placeholder-[#60646C] focus:outline-none focus:border-[#FF8278]"
            />
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
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[38px]"
            >
              {saving ? strings.common.saving : strings.paidDialog.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
