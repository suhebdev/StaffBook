import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[#F8F9FA] dark:bg-[#0D0D0F] text-[#111827] dark:text-[#F2F0EC] bg-tech-grid">
      {/* Top Floating Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white/90 dark:bg-[#17191C]/90 hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] hover:border-[#FF8278]/50 text-xs font-mono text-[#111827] dark:text-[#F2F0EC] transition-all cursor-pointer shadow-md group backdrop-blur"
          aria-label="Go back"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278] transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#17191C] rounded-2xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl p-8 sm:p-10">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>{strings.auth.backToLogin}</span>
            </button>
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-5 h-5 rounded bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono font-bold text-[10px] group-hover:border-[#FF8278]/50 transition-colors">
                ₹
              </div>
              <span className="font-semibold text-xs text-[#111827] dark:text-[#F2F0EC] font-mono">
                staffbook<span className="text-[#B93A2B] dark:text-[#FF8278]">_</span>
              </span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-[#F2F0EC]">
            {strings.auth.forgotTitle}
          </h1>
          <p className="mt-1 text-xs text-[#4B5563] dark:text-[#92969D]">
            {strings.auth.forgotSubtitle}
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-xl bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#047857] dark:text-[#34D399] mx-auto" />
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F2F0EC]">
              {strings.auth.resetSuccessTitle}
            </h3>
            <p className="text-xs text-[#4B5563] dark:text-[#92969D] leading-relaxed">
              {strings.auth.resetSuccessDesc}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#0D0D0F] bg-[#FF8278] hover:bg-[#FF958C] rounded-lg transition-colors"
              >
                {strings.auth.backToLogin}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1.5">
                {strings.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#4B5563] dark:text-[#92969D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={strings.auth.emailPlaceholder}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] placeholder-[#6B7280] dark:placeholder-[#60646C] text-sm focus:outline-none focus:border-[#FF8278]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] font-semibold text-xs tracking-wide transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : strings.auth.sendResetLink}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
