import React, { useState } from 'react';
import { Database, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import { clearDemoData, seedDemoData, isMockMode } from '@/services/data';
import { strings } from '@/strings/en';

export function DemoBanner() {
  const isMock = isMockMode;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isMock || !user) return null;

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await seedDemoData(user.uid);
      toast.success(strings.demo.demoLoaded);
    } catch {
      toast.error('Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      await clearDemoData(user.uid);
      toast.success(strings.demo.demoReset);
    } catch {
      toast.error('Failed to reset demo data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121416] text-[#4B5563] dark:text-[#92969D] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#292B2F] no-print">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278] shrink-0" />
        <span className="font-mono text-[11px] text-[#111827] dark:text-[#F2F0EC]">{strings.demo.bannerText}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#17191C] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-[#111827] dark:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#292B2F] font-mono text-[11px] transition-colors cursor-pointer"
        >
          <Database className="w-3 h-3 text-[#B93A2B] dark:text-[#FF8278]" />
          <span>{strings.demo.loadDemo}</span>
        </button>
        <button
          type="button"
          onClick={handleResetDemo}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#17191C] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#292B2F] font-mono text-[11px] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{strings.demo.resetDemo}</span>
        </button>
      </div>
    </div>
  );
}
