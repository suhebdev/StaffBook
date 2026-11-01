import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { DueNowItem, Payment } from '@/domain/types';
import { formatDisplayMonth } from '@/domain/dates';
import { computeMonthSalary } from '@/domain/salary';
import { PaidDialog } from '@/features/payments/PaidDialog';
import { repo } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';

interface DueNowPanelProps {
  items: DueNowItem[];
}

export function DueNowPanel({ items }: DueNowPanelProps) {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<DueNowItem | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const handleMarkPaid = async (payment: Payment) => {
    if (!user) return;
    try {
      await repo.markPaid(user.uid, payment);
      toast.success('Payment recorded');
      setSelectedItem(null);
    } catch {
      toast.error('Failed to record payment');
    }
  };

  return (
    <>
      <div className="mb-8 p-5 bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278]" />
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#111827] dark:text-[#F2F0EC]">
            {strings.today.dueNowTitle} ({items.length})
          </h2>
        </div>

        <div className="divide-y divide-[#E5E7EB] dark:divide-[#292B2F]">
          {items.map((item) => (
            <div
              key={`${item.employee.id}_${item.salaryMonth}`}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-medium text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
                    <Link
                      to={`/app/employees/${item.employee.id}?month=${item.salaryMonth}`}
                      className="hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors"
                    >
                      {item.employee.name}
                    </Link>
                    <span className="text-xs text-[#4B5563] dark:text-[#92969D]">
                      — {formatDisplayMonth(item.salaryMonth, 'long')}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#4B5563] dark:text-[#92969D] mt-0.5">
                    {item.overdueDays === 0
                      ? strings.dueNow.dueToday
                      : strings.dueNow.overdueDays.replace('{days}', String(item.overdueDays))}
                  </div>
                </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] transition-colors cursor-pointer min-h-[36px]"
                >
                  {strings.dueNow.markPaid}
                </button>
                <Link
                  to={`/app/employees/${item.employee.id}?month=${item.salaryMonth}`}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F3F4F6] dark:bg-[#1F2226] hover:bg-[#E5E7EB] dark:hover:bg-[#25282D] text-[#111827] dark:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#292B2F] transition-colors cursor-pointer min-h-[36px] inline-flex items-center"
                >
                  {strings.dueNow.view}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <PaidDialog
          isOpen={true}
          employee={selectedItem.employee}
          month={selectedItem.salaryMonth}
          suggestedAmount={
            computeMonthSalary(selectedItem.employee, selectedItem.salaryMonth).amount
          }
          onConfirm={handleMarkPaid}
          onCancel={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
