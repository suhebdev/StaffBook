import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { strings } from '@/strings/en';

export function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0D0D0F] text-[#111827] dark:text-[#F2F0EC]">
      <PublicHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white dark:bg-[#17191C] rounded-xl border border-[#E5E7EB] dark:border-[#292B2F] p-8 sm:p-12 space-y-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#E5E7EB] dark:border-[#292B2F]">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111827] dark:text-[#F2F0EC]">
                {strings.privacy.title}
              </h1>
              <p className="text-xs font-mono text-[#4B5563] dark:text-[#92969D] mt-0.5">
                {strings.privacy.lastUpdated}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FFFBEB] dark:bg-[#2A200F] border border-[#FDE68A] dark:border-[#4D3815] text-xs font-mono text-[#B45309] dark:text-[#FBBF24]">
            {strings.privacy.templateNotice}
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed">
            <p className="text-[#111827] dark:text-[#F2F0EC]">{strings.privacy.intro}</p>

            <section className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
                {strings.privacy.dataCollectionTitle}
              </h2>
              <p>{strings.privacy.dataCollectionText}</p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
                {strings.privacy.dataStorageTitle}
              </h2>
              <p>{strings.privacy.dataStorageText}</p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
                {strings.privacy.dataSharingTitle}
              </h2>
              <p>{strings.privacy.dataSharingText}</p>
            </section>

            <section className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
                {strings.privacy.dataDeletionTitle}
              </h2>
              <p>{strings.privacy.dataDeletionText}</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
