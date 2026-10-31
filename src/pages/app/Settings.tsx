import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Palette,
  Download,
  Database,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import { useTheme, type Theme } from '@/components/layout/ThemeContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { repo, seedDemoData, clearDemoData } from '@/services/data';
import { todayKey } from '@/domain/dates';
import { downloadApk } from '@/lib/download';
import { strings } from '@/strings/en';

export function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, systemPreference } = useTheme();
  const navigate = useNavigate();

  const isMock = import.meta.env.VITE_DATA_MODE === 'mock';

  const [exporting, setExporting] = useState(false);
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<Theme | null>(null);

  const handleSelectTheme = (t: Theme) => {
    if (t === theme) return;
    setSwitchingTo(t);
    setTheme(t);
    setTimeout(() => {
      setSwitchingTo(null);
      toast.success(
        t === 'system'
          ? `System theme active (${systemPreference === 'dark' ? 'Dark' : 'Light'})`
          : `${t.charAt(0).toUpperCase() + t.slice(1)} Mode enabled`
      );
    }, 280);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDownloadBackup = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = await repo.exportAll(user.uid);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `staffbook-backup-${todayKey()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch {
      toast.error('Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  const handleLoadDemo = async () => {
    if (!user) return;
    setDataActionLoading(true);
    try {
      await seedDemoData(user.uid);
      toast.success(strings.demo.demoLoaded);
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!user) return;
    setDataActionLoading(true);
    try {
      await clearDemoData(user.uid);
      toast.success(strings.demo.demoReset);
    } finally {
      setDataActionLoading(false);
    }
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'O';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-2">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/app');
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>
      </div>

      <PageHeader
        title={strings.settings.title}
        subtitle="Manage account, color theme, data backups, and mobile sync"
      />

      {/* Account Section */}
      <div className="bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] p-4 sm:p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
          <User className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
          <span>{strings.settings.accountSection}</span>
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF8278] to-[#FFA096] text-[#0D0D0F] font-bold font-mono text-sm flex items-center justify-center shrink-0 shadow-sm">
              {userInitial}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5B6472] dark:text-[#858A94]">
                {strings.settings.emailLabel}
              </span>
              <div className="text-sm font-mono text-[#111827] dark:text-[#F2F0EC] mt-0.5 font-medium">
                {user?.email || 'Demo User'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#B91C1C] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[#2B1414] hover:bg-[#FEF2F2] dark:hover:bg-[#3D1A1A] border border-[#FECACA] dark:border-[#4C2020] rounded-xl transition-colors cursor-pointer self-stretch sm:self-auto min-h-[40px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{strings.settings.signOutButton}</span>
          </button>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
            <span>{strings.settings.appearanceSection}</span>
          </h2>
          <span className="text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
            {theme === 'light' ? '☀️ Light' : theme === 'dark' ? '🌙 Dark' : '💻 System'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3" role="group" aria-label={strings.settings.themeLabel}>
          {(['light', 'dark', 'system'] as Theme[]).map((t) => {
            const isActive = theme === t;
            const isLoading = switchingTo === t;

            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTheme(t)}
                disabled={isLoading}
                aria-pressed={isActive}
                className={`relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border text-xs font-mono transition-all cursor-pointer min-h-[74px] active:scale-[0.98] ${
                  isActive
                    ? 'border-[#FF8278] bg-white dark:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] shadow-sm font-semibold ring-1 ring-[#FF8278]/40'
                    : 'border-[#E5E7EB] dark:border-[#23262D] bg-[#F3F4F6] dark:bg-[#101215] hover:bg-[#F9FAFB] dark:hover:bg-[#181B20] text-[#5B6472] dark:text-[#858A94]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#B93A2B] dark:text-[#FF8278]" />
                ) : t === 'light' ? (
                  <Sun className={`w-5 h-5 ${isActive ? 'text-[#B45309] dark:text-[#FBBF24]' : 'text-[#5B6472] dark:text-[#858A94]'}`} />
                ) : t === 'dark' ? (
                  <Moon className={`w-5 h-5 ${isActive ? 'text-[#B93A2B] dark:text-[#FF8278]' : 'text-[#5B6472] dark:text-[#858A94]'}`} />
                ) : (
                  <Laptop className={`w-5 h-5 ${isActive ? 'text-[#B93A2B] dark:text-[#FF8278]' : 'text-[#5B6472] dark:text-[#858A94]'}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <span className="capitalize text-xs font-medium">{t}</span>
                  {isActive && !isLoading && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8278]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informative Status Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
          <span className="w-2 h-2 rounded-full bg-[#34D399] shrink-0 animate-pulse" />
          <span className="leading-relaxed">
            {theme === 'light' && '☀️ Light Mode active — Crisp white surfaces, dark charcoal text, and soft status badges.'}
            {theme === 'dark' && '🌙 Dark Mode active — Slate cards, pitch black backgrounds, and eye-friendly dark accents.'}
            {theme === 'system' && '💻 System active — Light theme active by default (select Dark to switch to Dark Mode).'}
          </span>
        </div>
      </div>

      {/* Data & Backup Section */}
      <div className="bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] p-4 sm:p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
          <span>{strings.settings.dataSection}</span>
        </h2>
        <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
              Download JSON Backup
            </div>
            <p className="text-xs text-[#5B6472] dark:text-[#858A94] mt-0.5">
              {strings.settings.jsonBackupHelper}
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadBackup}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#FF8278] to-[#FFA096] hover:from-[#FF958C] hover:to-[#FFB0A7] text-[#0D0D0F] transition-all cursor-pointer shrink-0 min-h-[40px] disabled:opacity-50 shadow-md shadow-[#FF8278]/20 active:scale-[0.98]"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{strings.settings.downloadJsonBackup}</span>
          </button>
        </div>

        {/* Demo environment actions (only when mock mode) */}
        {isMock && (
          <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-[#111827] dark:text-[#F2F0EC]">
              {strings.settings.demoSection}
            </div>
            <p className="text-xs text-[#5B6472] dark:text-[#858A94]">
              {strings.settings.demoHelper}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={dataActionLoading}
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium rounded-xl bg-[#F3F4F6] dark:bg-[#1C1F26] hover:bg-[#E5E7EB] dark:hover:bg-[#252932] text-[#111827] dark:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#2B2F38] transition-colors cursor-pointer min-h-[38px]"
              >
                <Database className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278]" />
                <span>{strings.demo.loadDemo}</span>
              </button>
              <button
                type="button"
                disabled={dataActionLoading}
                onClick={handleResetDemo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium rounded-xl bg-[#F3F4F6] dark:bg-[#101215] hover:bg-[#FEF2F2] dark:hover:bg-[#2B1414] text-[#5B6472] dark:text-[#858A94] hover:text-[#B91C1C] dark:hover:text-[#F87171] border border-[#E5E7EB] dark:border-[#23262D] transition-colors cursor-pointer min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{strings.demo.resetDemo}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Android Companion App Section */}
      <div className="bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
            <span>{strings.settings.androidSection}</span>
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/30">
            v1.0.0
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-[#5B6472] dark:text-[#858A94] leading-relaxed max-w-lg">
              {strings.settings.androidDesc}
            </p>
            <span className="inline-block mt-1.5 text-[11px] font-mono text-[#047857] dark:text-[#34D399]">
              ✓ Direct background download — stays on this page
            </span>
          </div>
          <button
            type="button"
            onClick={() => downloadApk()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#FF8278] to-[#FFA096] hover:from-[#FF958C] hover:to-[#FFB0A7] text-[#0D0D0F] transition-all cursor-pointer shrink-0 min-h-[40px] shadow-md shadow-[#FF8278]/20 active:scale-[0.98]"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{strings.settings.downloadApkButton}</span>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] p-4 sm:p-6 space-y-3 text-xs text-[#5B6472] dark:text-[#858A94] shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
          <span>{strings.settings.aboutSection}</span>
        </h2>
        <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB] dark:border-[#23262D] font-mono">
          <span>{strings.settings.versionLabel}</span>
          <span className="text-[#111827] dark:text-[#F2F0EC]">1.0.0 (Web)</span>
        </div>
        <div className="flex items-center justify-between pt-1 font-mono">
          <Link
            to="/privacy"
            className="text-[#B93A2B] dark:text-[#FF8278] hover:underline"
          >
            {strings.settings.privacyLink}
          </Link>
          <span>{strings.brand.madeBy}</span>
        </div>
      </div>
    </div>
  );
}
