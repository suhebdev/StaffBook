import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  ArrowRight,
  ChevronDown,
  Smartphone,
  Laptop,
  Check,
  Clock,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';
import { downloadApk, getApkUrl } from '@/lib/download';
import { useReleaseInfo } from '@/features/release/useReleaseInfo';
import { ReleaseBadge } from '@/features/release/ReleaseBadge';

export function Landing() {
  const { user, loading } = useAuth();
  const releaseInfo = useReleaseInfo();
  const apkUrl = getApkUrl();

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

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: strings.brand.name,
    operatingSystem: 'Web, Android',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description: strings.landing.heroSubtitle,
  };

  const steps = [
    {
      num: '01',
      title: strings.landing.step1Title,
      desc: strings.landing.step1Desc,
    },
    {
      num: '02',
      title: strings.landing.step2Title,
      desc: strings.landing.step2Desc,
    },
    {
      num: '03',
      title: strings.landing.step3Title,
      desc: strings.landing.step3Desc,
    },
  ];

  const faqs = [
    { q: strings.landing.faq1Q, a: strings.landing.faq1A },
    { q: strings.landing.faq2Q, a: strings.landing.faq2A },
    { q: strings.landing.faq3Q, a: strings.landing.faq3A },
    { q: strings.landing.faq4Q, a: strings.landing.faq4A },
    { q: strings.landing.faq5Q, a: strings.landing.faq5A },
    { q: strings.landing.faq6Q, a: strings.landing.faq6A },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0D0D0F] text-[#111827] dark:text-[#F2F0EC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PublicHeader />

      <main className="flex-1">
        {/* 1. Hero Section (Inspired by reference .tech design) */}
        <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden bg-tech-grid border-b border-[#E5E7EB] dark:border-[#292B2F]">
          {/* Subtle background geometric accent on the right like .tech screenshot */}
          <div className="absolute right-0 top-1/4 w-96 h-96 bg-white/40 dark:bg-[#17191C]/40 rounded-3xl -z-10 blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Bold Typography & Search-style Hero CTA */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#4B5563] dark:text-[#92969D]">
                  <span className="text-[#B93A2B] dark:text-[#FF8278]">&gt;</span>
                  <span>{strings.brand.taglineHi}</span>
                  <span className="text-[#5B6472] dark:text-[#60646C]">/</span>
                  <span>{strings.brand.taglineEn}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111827] dark:text-[#F2F0EC] leading-[1.12]">
                  nothing tracks staff like <br />
                  <span className="text-[#111827] dark:text-[#F2F0EC]">being on </span>
                  <span className="text-[#B93A2B] dark:text-[#FF8278]">staffbook_</span>
                </h1>

                <p className="text-sm sm:text-base text-[#4B5563] dark:text-[#92969D] max-w-xl leading-relaxed">
                  No notebook chaos. No manual math errors. Just sharp daily attendance and auto-calculated monthly payroll that keeps your business in sync.
                </p>

                {/* Command-Bar Styled Action Container inspired by reference .tech screenshot */}
                <div className="pt-2 max-w-md">
                  <div className="flex items-center rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] p-1.5 shadow-2xl focus-within:border-[#FF8278] transition-colors">
                    <div className="flex items-center gap-2 px-3 text-[#4B5563] dark:text-[#92969D] flex-1 font-mono text-xs sm:text-sm">
                      <span className="text-[#B93A2B] dark:text-[#FF8278]">&gt;</span>
                      <span className="text-[#111827] dark:text-[#F2F0EC]">staff:</span>
                      <span className="text-[#4B5563] dark:text-[#92969D]">&quot;auto payroll&quot;</span>
                    </div>
                    {showOpenApp ? (
                      <Link
                        to="/app"
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer shrink-0 min-h-[38px]"
                      >
                        <span>&gt; {strings.nav.openApp}</span>
                      </Link>
                    ) : (
                      <Link
                        to="/signup"
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors cursor-pointer shrink-0 min-h-[38px]"
                      >
                        <span>&gt; {strings.nav.startFree}</span>
                      </Link>
                    )}
                  </div>

                  {/* Android APK Download Action in Hero */}
                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => downloadApk()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#17191C] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] hover:border-[#FF8278]/50 text-xs font-mono font-medium text-[#111827] dark:text-[#F2F0EC] transition-all cursor-pointer shadow-sm group active:scale-[0.98]"
                    >
                      <Smartphone className="w-4 h-4 text-[#B93A2B] dark:text-[#FF8278]" />
                      <span>Download StaffBook APK</span>
                      {releaseInfo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#252930] text-[#5B6472] dark:text-[#858A94] group-hover:text-[#B93A2B] dark:group-hover:text-[#FF8278]">
                          {releaseInfo.version}
                        </span>
                      )}
                    </button>
                    {releaseInfo && (
                      <ReleaseBadge release={releaseInfo} showWhatsNew={true} />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-[#4B5563] dark:text-[#92969D]">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#047857] dark:text-[#34D399]">✓</span> Free for owners
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#047857] dark:text-[#34D399]">✓</span> Phone + Web sync
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadApk()}
                    className="text-[#B93A2B] dark:text-[#FF8278] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>[Download StaffBook APK]</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Architectural Dark Product Mock */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md bg-white dark:bg-[#17191C] rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl p-5 overflow-hidden">
                  {/* Mock Window Top Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#292B2F]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB] dark:bg-[#292B2F]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB] dark:bg-[#292B2F]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB] dark:bg-[#292B2F]" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#4B5563] dark:text-[#92969D] uppercase tracking-wider">
                      daily_attendance · today
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#047857] dark:text-[#34D399]">
                      ₹12,450
                    </span>
                  </div>

                  {/* Mock Employee Rows */}
                  <div className="divide-y divide-[#E5E7EB] dark:divide-[#292B2F] mt-1 text-xs">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#111827] dark:text-[#F2F0EC]">
                          Ramesh Patel
                        </div>
                        <div className="text-[11px] text-[#4B5563] dark:text-[#92969D] font-mono">₹650/day · 22 days</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#ECFDF5] dark:bg-[#102A1E] text-[#047857] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#1C4B33] flex items-center justify-center font-mono font-bold text-[10px]">
                          F
                        </span>
                        <span className="font-mono text-[#111827] dark:text-[#F2F0EC] min-w-[60px] text-right">
                          ₹14,300
                        </span>
                      </div>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#111827] dark:text-[#F2F0EC]">
                          Sunita Sharma
                        </div>
                        <div className="text-[11px] text-[#4B5563] dark:text-[#92969D] font-mono">₹600/day · 20 days</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#FFFBEB] dark:bg-[#2A200F] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#4D3815] flex items-center justify-center font-mono font-bold text-[10px]">
                          H
                        </span>
                        <span className="font-mono text-[#111827] dark:text-[#F2F0EC] min-w-[60px] text-right">
                          ₹12,300
                        </span>
                      </div>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#111827] dark:text-[#F2F0EC]">
                          Vikram Singh
                        </div>
                        <div className="text-[11px] text-[#4B5563] dark:text-[#92969D] font-mono">₹700/day · 18 days</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#ECFDF5] dark:bg-[#102A1E] text-[#047857] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#1C4B33] flex items-center justify-center font-mono font-bold text-[10px]">
                          F
                        </span>
                        <span className="font-mono text-[#111827] dark:text-[#F2F0EC] min-w-[60px] text-right">
                          ₹12,600
                        </span>
                      </div>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#111827] dark:text-[#F2F0EC]">
                          Abdul Rehman
                        </div>
                        <div className="text-[11px] text-[#4B5563] dark:text-[#92969D] font-mono">₹580/day · 19 days</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#FEF2F2] dark:bg-[#2B1414] text-[#B91C1C] dark:text-[#F87171] border border-[#FECACA] dark:border-[#4C2020] flex items-center justify-center font-mono font-bold text-[10px]">
                          A
                        </span>
                        <span className="font-mono text-[#111827] dark:text-[#F2F0EC] min-w-[60px] text-right">
                          ₹11,020
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mock Summary Footer */}
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-between font-mono text-xs">
                    <span className="text-[#4B5563] dark:text-[#92969D]">monthly_payable</span>
                    <span className="font-bold text-sm text-[#B93A2B] dark:text-[#FF8278]">
                      ₹50,220
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Trust Strip */}
        <section className="border-b border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] py-5">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-xs font-mono font-medium text-[#4B5563] dark:text-[#92969D] tracking-widest uppercase">
              {strings.landing.trustStrip}
            </p>
          </div>
        </section>

        {/* 3. Capabilities Section — Editorial Asymmetric Composition */}
        <section id="features" className="py-20 sm:py-28 border-b border-[#E5E7EB] dark:border-[#23262D]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mb-14 sm:mb-20 space-y-3">
              <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] uppercase tracking-widest block font-medium">
                CAPABILITIES
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight leading-[1.15]">
                {strings.landing.featuresHeading}
              </h2>
              <p className="text-sm sm:text-base text-[#5B6472] dark:text-[#858A94] leading-relaxed max-w-2xl">
                {strings.landing.featuresSubheading}
              </p>
            </div>

            {/* Asymmetric Two-Column Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* PRIMARY COLUMN (Wider, 7 cols): Core Daily Register & Calculation Engine */}
              <div className="lg:col-span-7 space-y-10">
                {/* 01: Fast Daily Attendance */}
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                      <span className="text-[#B93A2B] dark:text-[#FF8278] font-bold">01</span>
                      <span className="text-[#D1D5DB] dark:text-[#2B2F38]">/</span>
                      <span className="tracking-wider uppercase">CORE REGISTER</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                      {strings.landing.f1Title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#5B6472] dark:text-[#858A94] leading-relaxed max-w-xl">
                      {strings.landing.f1Desc}
                    </p>
                  </div>

                  {/* Real Product UI Fragment: Daily Register with actual data controls */}
                  <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] bg-white dark:bg-[#14161B] overflow-hidden shadow-sm">
                    {/* Top Bar of the UI fragment */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#F3F4F6] dark:bg-[#101215] border-b border-[#E5E7EB] dark:border-[#23262D] text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span className="text-[#111827] dark:text-[#F2F0EC] font-medium">20 Oct 2026</span>
                        <span className="text-[#D1D5DB] dark:text-[#2B2F38]">·</span>
                        <span>Daily Register</span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="text-[#047857] dark:text-[#34D399] font-medium">24 Full</span>
                        <span className="text-[#D1D5DB] dark:text-[#2B2F38]">·</span>
                        <span className="text-[#B45309] dark:text-[#FBBF24] font-medium">2 Half</span>
                        <span className="text-[#D1D5DB] dark:text-[#2B2F38]">·</span>
                        <span className="text-[#B91C1C] dark:text-[#F87171] font-medium">1 Absent</span>
                      </div>
                    </div>

                    {/* Realistic staff attendance rows */}
                    <div className="divide-y divide-[#E5E7EB] dark:divide-[#23262D]">
                      {/* Row 1: Ramesh Kumar */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            RK
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#111827] dark:text-[#F2F0EC]">Ramesh Kumar</div>
                            <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94] tabular-nums">
                              Wage: <span className="text-[#111827] dark:text-[#F2F0EC]">₹600</span> /day · Half ₹300
                            </div>
                          </div>
                        </div>

                        {/* Status buttons */}
                        <div className="inline-flex items-center p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] gap-1 self-start sm:self-auto">
                          <span className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#6EE7B7] border border-[#10B981] text-xs font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Full (F)</span>
                          </span>
                          <span className="px-2.5 py-1.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                            H
                          </span>
                          <span className="px-2.5 py-1.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                            A
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Suresh Yadav */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/40 dark:bg-[#121417]/40">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            SY
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#111827] dark:text-[#F2F0EC]">Suresh Yadav</div>
                            <div className="text-xs font-mono text-[#5B6472] dark:text-[#858A94] tabular-nums">
                              Wage: <span className="text-[#111827] dark:text-[#F2F0EC]">₹400</span> /day · Half ₹200
                            </div>
                          </div>
                        </div>

                        {/* Status buttons */}
                        <div className="inline-flex items-center p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] gap-1 self-start sm:self-auto">
                          <span className="px-2.5 py-1.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                            F
                          </span>
                          <span className="px-3 py-1.5 rounded-lg bg-[#FFFBEB] dark:bg-[#78350F] text-[#B45309] dark:text-[#FDE68A] border border-[#F59E0B] text-xs font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Clock className="w-3 h-3 stroke-[3]" />
                            <span>Half (H)</span>
                          </span>
                          <span className="px-2.5 py-1.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                            A
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom quick action bar */}
                    <div className="px-4 py-3 bg-[#F3F4F6] dark:bg-[#101215] border-t border-[#E5E7EB] dark:border-[#23262D] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#5B6472] dark:text-[#858A94]">One-tap batch operation:</span>
                      <span className="inline-flex items-center gap-1.5 text-[#0D0D0F] bg-gradient-to-r from-[#FF8278] to-[#FFA096] px-3 py-1 rounded-lg font-bold text-[11px] shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Mark all Full (24)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 03: Auto Salary Calculation */}
                <div className="pt-8 border-t border-[#E5E7EB] dark:border-[#23262D] space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                      <span className="text-[#B93A2B] dark:text-[#FF8278] font-bold">03</span>
                      <span className="text-[#D1D5DB] dark:text-[#2B2F38]">/</span>
                      <span className="tracking-wider uppercase">PAYROLL ENGINE</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                      {strings.landing.f3Title}
                    </h3>
                    <p className="text-sm text-[#5B6472] dark:text-[#858A94] leading-relaxed max-w-xl">
                      {strings.landing.f3Desc}
                    </p>
                  </div>

                  {/* Deterministic daily wage formula */}
                  <div className="p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#101215] border border-[#E5E7EB] dark:border-[#23262D] font-mono text-xs text-[#5B6472] dark:text-[#858A94] space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#374151] dark:text-[#A6ABB4] font-bold">
                      Deterministic Daily Formula
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="text-[#111827] dark:text-[#F2F0EC]">(Full Days × ₹Full)</span>
                      <span>+</span>
                      <span className="text-[#111827] dark:text-[#F2F0EC]">(Half Days × ₹Half)</span>
                      <span>=</span>
                      <span className="text-[#047857] dark:text-[#34D399] font-bold">Total Disbursable Wage</span>
                    </div>
                    <div className="text-[11px] text-[#5B6472] dark:text-[#60646C]">
                      Absent &amp; unmarked days strictly evaluate to ₹0. No hidden rounding errors.
                    </div>
                  </div>
                </div>
              </div>

              {/* SECONDARY COLUMN (Narrower, 5 cols): Editorial Structured List with Hairline Dividers */}
              <div className="lg:col-span-5 space-y-0">
                {/* 02: Monthly Attendance Sheet */}
                <div className="border-t border-[#E5E7EB] dark:border-[#23262D] pt-6 pb-8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] font-bold">02</span>
                    <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C] uppercase tracking-wider">
                      SPREADSHEET
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                    {strings.landing.f2Title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5B6472] dark:text-[#858A94] leading-relaxed">
                    {strings.landing.f2Desc}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
                    <span className="text-[#5B6472] dark:text-[#60646C]">Keyboard shortcuts:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#2B2F38] text-[10px] text-[#111827] dark:text-[#F2F0EC]">F</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#2B2F38] text-[10px] text-[#111827] dark:text-[#F2F0EC]">H</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#2B2F38] text-[10px] text-[#111827] dark:text-[#F2F0EC]">A</kbd>
                    <span className="text-[#5B6472] dark:text-[#60646C]">/ Arrows</span>
                  </div>
                </div>

                {/* 04: Safe Rate Changes */}
                <div className="border-t border-[#E5E7EB] dark:border-[#23262D] pt-6 pb-8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] font-bold">04</span>
                    <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C] uppercase tracking-wider">
                      RATE HISTORY
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                    {strings.landing.f4Title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5B6472] dark:text-[#858A94] leading-relaxed">
                    {strings.landing.f4Desc}
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-[#047857] dark:text-[#34D399]">
                    ✓ Past months locked &amp; immune to recalculation
                  </div>
                </div>

                {/* 05: Pay Reminders & Due List */}
                <div className="border-t border-[#E5E7EB] dark:border-[#23262D] pt-6 pb-8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] font-bold">05</span>
                    <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C] uppercase tracking-wider">
                      DISBURSEMENT
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                    {strings.landing.f5Title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5B6472] dark:text-[#858A94] leading-relaxed">
                    {strings.landing.f5Desc}
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
                    Due Now panel + local calendar (.ics) sync
                  </div>
                </div>

                {/* 06: Export CSV & Print Summary */}
                <div className="border-t border-b border-[#E5E7EB] dark:border-[#23262D] pt-6 pb-8 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] font-bold">06</span>
                    <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C] uppercase tracking-wider">
                      RECONCILIATION
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                    {strings.landing.f6Title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5B6472] dark:text-[#858A94] leading-relaxed">
                    {strings.landing.f6Desc}
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-[#5B6472] dark:text-[#858A94]">
                    UTF-8 BOM Excel export · Physical salary slips
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. How It Works (3 Steps) */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-white dark:bg-[#121416] border-b border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mb-16 space-y-2">
              <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] uppercase tracking-wider">
                Workflow
              </span>
              <h2 className="text-3xl font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight">
                {strings.landing.howItWorksHeading}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((st, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] relative"
                >
                  <div className="text-xs font-mono font-bold text-[#B93A2B] dark:text-[#FF8278] mb-3">
                    [{st.num}]
                  </div>
                  <h3 className="text-base font-semibold text-[#111827] dark:text-[#F2F0EC] mb-2">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Phone + Web Section */}
        <section className="py-20 sm:py-24 border-b border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#292B2F] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center gap-2 text-xs font-mono text-[#B93A2B] dark:text-[#FF8278]">
                  <Smartphone className="w-4 h-4" />
                  <span>+</span>
                  <Laptop className="w-4 h-4" />
                  <span>SYNC ARCHITECTURE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#111827] dark:text-[#F2F0EC]">
                  {strings.landing.phoneWebHeading}
                </h2>
                <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed">
                  {strings.landing.phoneWebDesc}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadApk()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] font-semibold text-xs transition-colors cursor-pointer min-h-[40px] shadow-sm shadow-[#FF8278]/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>{strings.nav.downloadApk}</span>
                  </button>
                  {releaseInfo && (
                    <ReleaseBadge release={releaseInfo} showWhatsNew={true} />
                  )}
                </div>
                {showOpenApp ? (
                  <Link
                    to="/app"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-[#111827] dark:text-[#F2F0EC] font-semibold text-xs transition-colors cursor-pointer min-h-[40px]"
                  >
                    <span>{strings.nav.openApp}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-[#111827] dark:text-[#F2F0EC] font-semibold text-xs transition-colors cursor-pointer min-h-[40px]"
                  >
                    <span>{strings.nav.startFree}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ Accordion */}
        <section id="faq" className="py-20 sm:py-24 border-b border-[#E5E7EB] dark:border-[#292B2F]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] uppercase tracking-wider">
                Support
              </span>
              <h2 className="text-3xl font-semibold text-[#111827] dark:text-[#F2F0EC] tracking-tight mt-1">
                {strings.landing.faqHeading}
              </h2>
            </div>

            <div className="divide-y divide-[#E5E7EB] dark:divide-[#292B2F]">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between text-left font-medium text-sm text-[#111827] dark:text-[#F2F0EC] py-2 focus:outline-none cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#4B5563] dark:text-[#92969D] transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#B93A2B] dark:text-[#FF8278]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed pr-8">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Final CTA */}
        <section className="py-20 bg-white dark:bg-[#121416] text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#111827] dark:text-[#F2F0EC]">
              {strings.landing.finalCtaHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] max-w-md mx-auto">
              {strings.landing.finalCtaSubheading}
            </p>
            <div className="pt-2">
              {showOpenApp ? (
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors min-h-[40px]"
                >
                  <span>&gt; {strings.nav.openApp}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors min-h-[40px]"
                >
                  <span>&gt; {strings.nav.startFree}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
