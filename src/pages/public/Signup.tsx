import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { getErrorMessage } from '@/lib/errors';
import { strings } from '@/strings/en';

export function Signup() {
  const { user, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError(strings.errors.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err?.code || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err?.code || 'unknown'));
    } finally {
      setGoogleLoading(false);
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

      <div className="w-full max-w-4xl bg-white dark:bg-[#17191C] rounded-2xl border border-[#E5E7EB] dark:border-[#292B2F] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side: Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Home</span>
              </button>
              <Link to="/" className="inline-flex items-center gap-2 group">
                <div className="w-6 h-6 rounded bg-white dark:bg-[#121416] border border-[#E5E7EB] dark:border-[#292B2F] flex items-center justify-center text-[#B93A2B] dark:text-[#FF8278] font-mono font-bold text-xs group-hover:border-[#FF8278]/50 transition-colors">
                  ₹
                </div>
                <span className="font-semibold text-sm text-[#111827] dark:text-[#F2F0EC] font-mono">
                  staffbook<span className="text-[#B93A2B] dark:text-[#FF8278]">_</span>
                </span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-[#F2F0EC]">
              {strings.auth.signupTitle}
            </h1>
            <p className="mt-1 text-xs text-[#4B5563] dark:text-[#92969D]">
              {strings.auth.signupSubtitle}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-[#FEF2F2] dark:bg-[#2B1414] border border-[#FECACA] dark:border-[#4C2020] text-[#B91C1C] dark:text-[#F87171] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1">
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

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1">
                {strings.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4B5563] dark:text-[#92969D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={strings.auth.passwordPlaceholder}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] placeholder-[#6B7280] dark:placeholder-[#60646C] text-sm focus:outline-none focus:border-[#FF8278]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-[#92969D] hover:text-[#111827] dark:hover:text-[#F2F0EC]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#92969D] mb-1">
                {strings.auth.confirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4B5563] dark:text-[#92969D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={strings.auth.confirmPasswordPlaceholder}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] text-[#111827] dark:text-[#F2F0EC] placeholder-[#6B7280] dark:placeholder-[#60646C] text-sm focus:outline-none focus:border-[#FF8278]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-[#FF8278] hover:bg-[#FF958C] text-[#0D0D0F] font-semibold text-xs tracking-wide transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : strings.auth.signUpButton}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB] dark:border-[#292B2F]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-white dark:bg-[#17191C] px-3 text-[#4B5563] dark:text-[#92969D]">
                {strings.auth.orContinueWith}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-[#E5E7EB] dark:border-[#292B2F] bg-white dark:bg-[#121416] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2226] text-[#111827] dark:text-[#F2F0EC] text-xs font-medium transition-colors cursor-pointer min-h-[40px]"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{strings.auth.googleSignIn}</span>
          </button>

          <p className="mt-5 text-center text-xs text-[#4B5563] dark:text-[#92969D]">
            {strings.auth.haveAccount}{' '}
            <Link
              to="/login"
              className="font-medium text-[#B93A2B] dark:text-[#FF8278] hover:underline"
            >
              {strings.auth.signInButton}
            </Link>
          </p>
        </div>

        {/* Right Side: Info Panel */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-white dark:bg-[#121416] border-l border-[#E5E7EB] dark:border-[#292B2F] text-[#111827] dark:text-[#F2F0EC]">
          <div>
            <span className="inline-block text-xs font-mono text-[#B93A2B] dark:text-[#FF8278] mb-6">
              [ {strings.brand.taglineHi} ]
            </span>
            <h2 className="text-2xl font-semibold tracking-tight leading-snug">
              Start organized payroll in minutes.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] leading-relaxed">
              StaffBook helps business owners, offices, workshops, and retail shops keep accurate staff records without confusing notebook calculations.
            </p>
          </div>

          <div className="space-y-3 my-6 font-mono text-xs text-[#4B5563] dark:text-[#92969D]">
            <div className="flex items-center gap-2.5">
              <span className="text-[#047857] dark:text-[#34D399]">&gt;</span>
              <span className="text-[#111827] dark:text-[#F2F0EC]">100% Free for business owners</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#047857] dark:text-[#34D399]">&gt;</span>
              <span className="text-[#111827] dark:text-[#F2F0EC]">Works smoothly on mobile and desktop</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[#047857] dark:text-[#34D399]">&gt;</span>
              <span className="text-[#111827] dark:text-[#F2F0EC]">CSV exports and clean printouts ready</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C]">
            {strings.brand.taglineEn}
          </div>
        </div>
      </div>
    </div>
  );
}
