import React from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { downloadApk } from '@/lib/download';
import { useReleaseInfo } from '@/features/release/useReleaseInfo';
import { strings } from '@/strings/en';

export function PublicHeader() {
  const { user, loading } = useAuth();
  const releaseInfo = useReleaseInfo();

  const isHintLoggedIn = () => {
    try {
      return (
        localStorage.getItem('staffbook_logged_in') === '1' ||
        localStorage.getItem('dihadi_logged_in') === '1'
      );
    } catch {
      return false;
    }
  };

  const showOpenApp = loading ? isHintLoggedIn() : !!user;

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9FA]/90 dark:bg-[#0D0D0F]/90 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#292B2F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand wordmark with subtle dot/tech aesthetic */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono font-bold text-sm">
            ₹
          </div>
          <span className="font-semibold text-base text-[#111827] dark:text-[#F2F0EC] tracking-tight font-mono">
            staffbook<span className="text-[#B93A2B] dark:text-[#FF8278]">_</span>
          </span>
        </Link>

        {/* Anchor navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-tight text-[#4B5563] dark:text-[#92969D]">
          <a href="#features" className="hover:text-[#111827] dark:hover:text-[#F2F0EC] transition-colors">
            features
          </a>
          <a href="#how-it-works" className="hover:text-[#111827] dark:hover:text-[#F2F0EC] transition-colors">
            how-it-works
          </a>
          <a href="#faq" className="hover:text-[#111827] dark:hover:text-[#F2F0EC] transition-colors">
            faq
          </a>
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 min-w-[155px] justify-end">
          {/* APK download button */}
          <button
            type="button"
            onClick={() => downloadApk()}
            title={
              releaseInfo
                ? `Download StaffBook Android APK ${releaseInfo.version}`
                : 'Download StaffBook Android APK'
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white/80 dark:bg-[#17191C]/80 hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-xs font-mono text-[#111827] dark:text-[#F2F0EC] transition-all cursor-pointer shadow-xs hover:border-[#FF8278]/50 min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278]" />
            <span className="hidden sm:inline">Download StaffBook APK</span>
            <span className="sm:hidden">APK</span>
            {releaseInfo && (
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/30">
                {releaseInfo.version}
              </span>
            )}
          </button>
          {showOpenApp ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer min-h-[36px]"
            >
              {strings.nav.openApp}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-white dark:hover:bg-[#17191C] rounded transition-colors cursor-pointer min-h-[36px] inline-flex items-center"
              >
                {strings.nav.login}
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer min-h-[36px]"
              >
                {strings.nav.startFree}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
