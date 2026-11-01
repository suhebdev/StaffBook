import React from 'react';
import { Link } from 'react-router-dom';
import { strings } from '@/strings/en';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E5E7EB] dark:border-[#292B2F] bg-[#F8F9FA] dark:bg-[#0D0D0F] py-12 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4B5563] dark:text-[#92969D]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono text-[10px] font-bold">
            ₹
          </div>
          <span className="font-mono text-[11px]">
            © {currentYear} staffbook_ · {strings.brand.taglineHi}
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px]">
          <Link
            to="/privacy"
            className="hover:text-[#111827] dark:hover:text-[#F2F0EC] transition-colors"
          >
            {strings.landing.privacyLink}
          </Link>
          <span>{strings.brand.madeBy}</span>
        </div>
      </div>
    </footer>
  );
}
