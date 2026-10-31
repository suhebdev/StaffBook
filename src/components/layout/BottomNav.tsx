import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  TableProperties,
  Users,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import { strings } from '@/strings/en';

interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const navItems: BottomNavItem[] = [
  { to: '/app', label: strings.nav.today, icon: CalendarDays, end: true },
  { to: '/app/sheet', label: strings.nav.sheet, icon: TableProperties },
  { to: '/app/employees', label: strings.nav.employees, icon: Users },
  { to: '/app/summary', label: strings.nav.summary, icon: FileSpreadsheet },
  { to: '/app/settings', label: strings.nav.settings, icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#121417]/95 backdrop-blur-lg border-t border-[#E5E7EB] dark:border-[#23262D] no-print pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 transition-all select-none ${
                  isActive
                    ? 'text-[#B93A2B] dark:text-[#FF8278] font-semibold'
                    : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#FF8278] shadow-[0_0_8px_#FF8278]" />
                  )}
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                    }`}
                  />
                  <span className="text-[10px] tracking-tight leading-none">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
