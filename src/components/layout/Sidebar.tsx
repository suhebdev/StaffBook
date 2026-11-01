import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  TableProperties,
  Users,
  FileSpreadsheet,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/app', label: strings.nav.today, icon: CalendarDays, end: true },
  { to: '/app/sheet', label: strings.nav.sheet, icon: TableProperties },
  { to: '/app/employees', label: strings.nav.employees, icon: Users },
  { to: '/app/summary', label: strings.nav.summary, icon: FileSpreadsheet },
  { to: '/app/settings', label: strings.nav.settings, icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'O';

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30 bg-white dark:bg-[#121417] border-r border-[#E5E7EB] dark:border-[#23262D] no-print">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-[#E5E7EB] dark:border-[#23262D]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F9FAFB] dark:from-[#1C1F26] to-[#F3F4F6] dark:to-[#15171C] border border-[#E5E7EB] dark:border-[#2B2F38] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono font-bold text-sm shadow-sm">
          ₹
        </div>
        <div>
          <span className="font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight text-sm block leading-tight">
            {strings.brand.appName}
          </span>
          <span className="text-[10px] font-mono text-[#5B6472] dark:text-[#858A94] block leading-none mt-0.5">
            staff &amp; salary
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#F9FAFB] dark:bg-[#181B20] text-[#111827] dark:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#2B2F38] shadow-sm font-semibold'
                    : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F9FAFB]/60 dark:hover:bg-[#181B20]/60 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#B93A2B] dark:text-[#FF8278]' : 'text-[#5B6472] dark:text-[#858A94]'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF8278] shadow-[0_0_6px_#FF8278]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Account / Sign out */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#23262D] space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#F9FAFB] dark:bg-[#181B20] border border-[#E5E7EB] dark:border-[#2B2F38] text-xs">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF8278] to-[#FFA096] text-[#0D0D0F] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          <span
            className="truncate font-mono text-[11px] text-[#374151] dark:text-[#A6ABB4]"
            title={user?.email || ''}
          >
            {user?.email || 'Owner'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#5B6472] dark:text-[#858A94] hover:text-[#B91C1C] dark:hover:text-[#F87171] hover:bg-[#FEF2F2]/40 dark:hover:bg-[#2B1414]/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>{strings.nav.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
