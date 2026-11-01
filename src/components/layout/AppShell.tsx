import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';

export function AppShell() {
  const { user } = useAuth();
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'O';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D0E11] text-[#111827] dark:text-[#F2F0EC] flex flex-col selection:bg-[#FF8278]/25 selection:text-[#111827] dark:selection:text-[#F2F0EC]">
      {/* Demo Mode banner */}
      <DemoBanner />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Compact Top Bar (<1024px) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/90 dark:bg-[#121417]/90 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#23262D] no-print">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F9FAFB] dark:from-[#1C1F26] to-[#F3F4F6] dark:to-[#15171C] border border-[#E5E7EB] dark:border-[#2B2F38] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono font-bold text-xs shadow-sm group-hover:border-[#FF8278]/50 transition-colors">
              ₹
            </div>
            <div>
              <span className="font-semibold text-[#111827] dark:text-[#F2F0EC] text-sm tracking-tight block leading-tight">
                {strings.brand.appName}
              </span>
              <span className="text-[10px] font-mono text-[#4B5563] dark:text-[#92969D] block leading-none">
                {strings.brand.taglineHi}
              </span>
            </div>
          </Link>

          <Link
            to="/app/settings"
            className="flex items-center gap-2 pl-2 py-1 pr-1 rounded-full bg-[#F9FAFB] dark:bg-[#181B20] border border-[#E5E7EB] dark:border-[#2B2F38] hover:border-[#FF8278]/40 transition-colors cursor-pointer"
            title="Settings & Account"
          >
            <span className="text-[11px] font-mono text-[#4B5563] dark:text-[#92969D] max-w-[100px] truncate hidden xs:inline">
              {user?.email ? user.email.split('@')[0] : 'Account'}
            </span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF8278] to-[#FFA096] text-[#0D0D0F] font-bold font-mono text-xs flex items-center justify-center shadow-sm">
              {userInitial}
            </div>
          </Link>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-60 pb-28 lg:pb-14 bg-tech-grid min-h-screen">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (<1024px) */}
      <BottomNav />
    </div>
  );
}
