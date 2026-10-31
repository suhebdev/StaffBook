import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { strings } from '@/strings/en';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FA] dark:bg-[#0D0D0F] text-[#111827] dark:text-[#F2F0EC] bg-tech-grid">
      <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono font-bold text-xl mb-6">
        404
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-[#F2F0EC] mb-2">
        Page not found
      </h1>
      <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] font-semibold text-xs transition-colors min-h-[38px]"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#17191C] text-[#111827] dark:text-[#F2F0EC] font-medium text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] transition-colors min-h-[38px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{strings.nav.openApp}</span>
        </Link>
      </div>
    </div>
  );
}
