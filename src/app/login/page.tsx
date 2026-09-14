'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveLoginEmail, registerStudent, requestPasswordReset } from '@/lib/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Form states
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [programCode, setProgramCode] = useState('BSIT');
  const [yearLevel, setYearLevel] = useState('1');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field validation / touched states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-format student ID (YYYY-XXXX)
  function handleStudentIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.includes('@')) {
      setStudentId(val);
      return;
    }
    const digits = val.replace(/[^0-9]/g, '').slice(0, 8);
    if (digits.length <= 4) {
      setStudentId(digits);
    } else {
      setStudentId(`${digits.slice(0, 4)}-${digits.slice(4)}`);
    }
  }

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  // Real-time field validation
  const isStudentIdValid =
    mode === 'login' || mode === 'forgot'
      ? studentId.trim().includes('@') || /^\d{4}-\d{4}$/.test(studentId.trim())
      : /^\d{4}-\d{4}$/.test(studentId.trim());

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const isNameValid = name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      studentId: true,
      email: true,
      password: true,
    });
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (mode === 'signup') {
        if (!isNameValid) {
          setError('Please enter your full name.');
          setBusy(false);
          return;
        }
        if (!isStudentIdValid) {
          setError('Please enter a valid Student ID (e.g. 2026-0001).');
          setBusy(false);
          return;
        }
        if (!isEmailValid) {
          setError('Please enter a valid email address.');
          setBusy(false);
          return;
        }
        if (!isPasswordValid) {
          setError('Password must be at least 8 characters.');
          setBusy(false);
          return;
        }

        const regRes = await registerStudent({
          fullName: name,
          studentNo: studentId,
          email: email.trim(),
          programCode,
          yearLevel: parseInt(yearLevel, 10),
          password,
        });

        if (!regRes.ok || !regRes.email) {
          setError(regRes.error ?? 'Failed to create account.');
          setBusy(false);
          return;
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: regRes.email,
          password,
        });

        if (signInErr) {
          setError(signInErr.message);
          setBusy(false);
          return;
        }
      } else if (mode === 'login') {
        if (!studentId.trim()) {
          setError('Please enter your Student ID or email.');
          setBusy(false);
          return;
        }
        if (!password) {
          setError('Please enter your password.');
          setBusy(false);
          return;
        }

        const resolvedEmail = await resolveLoginEmail(studentId);
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });

        if (signInErr) {
          setError(
            signInErr.message === 'Invalid login credentials'
              ? 'Invalid student ID, email, or password.'
              : signInErr.message
          );
          setBusy(false);
          return;
        }
      } else if (mode === 'forgot') {
        if (!studentId.trim()) {
          setError('Please enter your Student ID or email.');
          setBusy(false);
          return;
        }

        const resetRes = await requestPasswordReset(studentId);
        if (!resetRes.ok) {
          setError(resetRes.error ?? 'Could not send recovery instructions.');
          setBusy(false);
          return;
        }

        setSuccess('Password recovery link dispatched. Please check your email inbox.');
        setBusy(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] w-full flex flex-col md:grid md:grid-cols-12 bg-canvas text-cream selection:bg-brand/30">
      {/* Mobile Masthead (< 768px) */}
      <div className="md:hidden flex flex-col items-center pt-6 pb-4 px-6 text-center border-b border-subtle bg-panel/30">
        <div className="flex items-center gap-3">
          <img
            src="/csu-cetc-logo.png"
            alt="Cotabato State University - CETC"
            className="h-10 w-10 object-contain shrink-0"
          />
          <div className="text-left">
            <div
              className="text-xl font-extrabold tracking-[0.03em] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CSU <span className="text-brand">CETC</span>
            </div>
            <p className="text-[11px] text-cream-muted">Cotabato State University</p>
          </div>
        </div>
      </div>

      {/* Left Column: Refined Editorial Showcase (Quote + Dashboard Preview) */}
      <section className="md:col-span-6 hidden md:flex flex-col justify-between p-8 lg:p-12 xl:p-16 border-r border-subtle relative overflow-hidden bg-gradient-to-b from-panel/40 via-canvas to-canvas">
        {/* Ambient warm glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-brand/10 blur-3xl" />

        {/* Top Branding (Official Logo + CSU CETC) */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src="/csu-cetc-logo.png"
            alt="Cotabato State University - CETC Logo"
            className="h-14 w-14 object-contain shrink-0 drop-shadow-md"
          />
          <div>
            <div
              className="text-2xl font-extrabold tracking-[0.03em] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CSU <span className="text-brand">CETC</span>
            </div>
            <p className="text-xs text-cream-muted tracking-wide mt-0.5">
              Cotabato State University · College of Engineering, Technology and Computing
            </p>
          </div>
        </div>

        {/* Middle Showcase: Editorial Quote + 5-Star + Realistic Dashboard Preview */}
        <div className="relative z-10 my-auto py-6 space-y-6 max-w-xl">
          {/* Quote & Stars */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1 text-gold-text text-sm" aria-label="5 out of 5 stars">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span className="text-xs text-cream-muted ml-2 font-medium">Student Verified</span>
            </div>
            <p className="text-lg xl:text-xl font-medium text-cream leading-snug">
              “Objective student feedback is the cornerstone of academic excellence and continuous curriculum innovation at Cotabato State University.”
            </p>
            <p className="text-xs text-cream-muted">
              — <span className="text-cream font-semibold">Faculty Evaluation Committee</span>, CSU CETC
            </p>
          </div>

          {/* High-Fidelity Portal Dashboard Preview Mockup */}
          <div className="rounded-2xl border border-subtle bg-bg2/90 shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-subtle bg-panel/70 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-negative/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-positive/80 inline-block" />
                <span className="ml-2 text-[11px] font-mono text-cream-muted">portal.csu.edu.ph/student</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-bg2 px-2 py-0.5 text-[10px] font-medium text-brand-text border border-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                AY 2026–2027 Active
              </span>
            </div>

            {/* Mockup Dashboard Content */}
            <div className="p-4 space-y-3.5">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-panel/60 p-2.5 border border-subtle">
                  <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">Enrolled</span>
                  <div className="text-base font-bold text-cream">6 Subjects</div>
                </div>
                <div className="rounded-lg bg-panel/60 p-2.5 border border-subtle">
                  <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">Completed</span>
                  <div className="text-base font-bold text-positive">4 Evaluated</div>
                </div>
                <div className="rounded-lg bg-panel/60 p-2.5 border border-subtle">
                  <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">Pending</span>
                  <div className="text-base font-bold text-gold-text">2 Left</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-cream-dim">Semester Evaluation Progress</span>
                  <span className="text-brand-text font-bold">66%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-panel overflow-hidden">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: '66%' }} />
                </div>
              </div>

              {/* Subject Rows Preview */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between rounded-lg bg-panel/40 px-3 py-2 text-xs border border-subtle/60">
                  <div className="truncate">
                    <span className="font-bold text-cream">IT211</span>
                    <span className="text-cream-muted ml-1.5">Web Systems & Tech · Engr. Jose Rizal Jr.</span>
                  </div>
                  <span className="badge badge-positive shrink-0 text-[10px]">Completed ✓</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-panel/40 px-3 py-2 text-xs border border-subtle/60">
                  <div className="truncate">
                    <span className="font-bold text-cream">IT201</span>
                    <span className="text-cream-muted ml-1.5">Data Structures · Prof. Maria Santos</span>
                  </div>
                  <span className="badge badge-gold shrink-0 text-[10px]">Pending ⏳</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-cream-faint border-t border-subtle pt-4 flex items-center justify-between">
          <span>Faculty Evaluation System</span>
          <span>© Cotabato State University</span>
        </div>
      </section>

      {/* Right Column: Authentication Form Panel (Always on the RIGHT SIDE) */}
      <section className="md:col-span-6 flex items-center justify-center p-4 sm:p-8 xl:p-12">
        <div className="w-full max-w-[440px]">
          <div className="card space-y-5 transition-all duration-200 shadow-xl">
            {/* Brand in card */}
            <div className="flex items-center gap-3 pb-1 border-b border-subtle/60">
              <img
                src="/csu-cetc-logo.png"
                alt="CSU CETC"
                className="h-10 w-10 object-contain shrink-0 drop-shadow"
              />
              <div>
                <div
                  className="text-lg font-extrabold tracking-wide leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  CSU <span className="text-brand">CETC</span>
                </div>
                <p className="text-[11px] text-cream-muted">Faculty Evaluation Portal</p>
              </div>
            </div>

            {/* Header & Subtitle */}
            <div className="space-y-1">
              <h2
                className="text-2xl font-bold tracking-tight text-cream"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {mode === 'signup'
                  ? 'Create account'
                  : mode === 'forgot'
                  ? 'Reset password'
                  : 'Log in'}
              </h2>
              <p className="text-xs text-cream-muted">
                {mode === 'signup'
                  ? 'Enter your student credentials to register.'
                  : mode === 'forgot'
                  ? 'Enter your Student ID or email to receive reset instructions.'
                  : 'Welcome back! Please enter your details.'}
              </p>
            </div>

            {/* Segmented Control */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 rounded-lg bg-bg2 p-1 border border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`rounded-md py-2 text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-panel text-cream shadow-xs border border-subtle'
                      : 'text-cream-muted hover:text-cream'
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`rounded-md py-2 text-xs font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-panel text-cream shadow-xs border border-subtle'
                      : 'text-cream-muted hover:text-cream'
                  }`}
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Notifications */}
            {error && (
              <div className="rounded-lg border border-negative/40 bg-negative-fill/20 px-3.5 py-2.5 text-xs text-negative flex items-center gap-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-positive/40 bg-positive-fill/20 px-3.5 py-2.5 text-xs text-positive flex items-center gap-2">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Sign up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="label flex items-center justify-between" htmlFor="name">
                    <span>
                      Full Name <span className="text-negative">*</span>
                    </span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${
                      touched.name && !isNameValid ? 'border-negative focus:border-negative ring-1 ring-negative/30' : ''
                    }`}
                    placeholder="e.g. Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => markTouched('name')}
                    required
                    autoComplete="name"
                  />
                  {touched.name && !isNameValid && (
                    <p className="text-[11px] text-negative mt-1">Full name is required.</p>
                  )}
                </div>
              )}

              {/* Student ID (Auto-formatted YYYY-XXXX, red asterisk, no format badge) */}
              <div>
                <label className="label" htmlFor="studentId">
                  {mode === 'signup' ? 'Student ID' : 'Student ID or Email'}{' '}
                  <span className="text-negative">*</span>
                </label>
                <input
                  id="studentId"
                  type="text"
                  className={`input font-mono ${
                    touched.studentId && !isStudentIdValid
                      ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                      : ''
                  }`}
                  placeholder={
                    mode === 'signup' ? '2026-0001' : '2026-0001 or faculty@cetc.test'
                  }
                  value={studentId}
                  onChange={handleStudentIdChange}
                  onBlur={() => markTouched('studentId')}
                  required
                  autoComplete={mode === 'signup' ? 'username' : 'username email'}
                />
                {touched.studentId && !isStudentIdValid && (
                  <p className="text-[11px] text-negative mt-1">
                    {mode === 'signup'
                      ? 'Enter a valid Student ID (e.g. 2026-0001).'
                      : 'Please enter a valid Student ID (2026-0001) or institutional email.'}
                  </p>
                )}
              </div>

              {/* Email Address (Sign up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="email">
                    Email Address <span className="text-negative">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`input ${
                      touched.email && !isEmailValid ? 'border-negative focus:border-negative ring-1 ring-negative/30' : ''
                    }`}
                    placeholder="student@cetc.edu or personal email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => markTouched('email')}
                    required
                    autoComplete="email"
                  />
                  {touched.email && !isEmailValid && (
                    <p className="text-[11px] text-negative mt-1">Please enter a valid email address.</p>
                  )}
                </div>
              )}

              {/* Degree Program & Year Level (Sign up only) */}
              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="programCode">
                      Degree Program <span className="text-negative">*</span>
                    </label>
                    <select
                      id="programCode"
                      className="input py-2 cursor-pointer text-xs"
                      value={programCode}
                      onChange={(e) => setProgramCode(e.target.value)}
                    >
                      <option value="BSIT">BS Information Tech (BSIT)</option>
                      <option value="BSCS">BS Computer Science (BSCS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" htmlFor="yearLevel">
                      Year Level <span className="text-negative">*</span>
                    </label>
                    <select
                      id="yearLevel"
                      className="input py-2 cursor-pointer text-xs"
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label !mb-0" htmlFor="password">
                      Password <span className="text-negative">*</span>
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-xs text-brand-text hover:underline focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`input pr-10 ${
                        touched.password && !isPasswordValid
                          ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                          : ''
                      }`}
                      placeholder={mode === 'signup' ? 'Create password (min 8 chars)' : 'Enter password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => markTouched('password')}
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {mode === 'signup' && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          password.length >= 8 ? 'text-positive' : 'text-cream-faint'
                        }`}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="8" cy="8" r="7" />
                        <polyline points="5 8 7 10 11 6" />
                      </svg>
                      <span className={password.length >= 8 ? 'text-cream-dim' : 'text-cream-faint'}>
                        Must be at least 8 characters.
                      </span>
                    </div>
                  )}

                  {touched.password && !isPasswordValid && mode !== 'signup' && (
                    <p className="text-[11px] text-negative mt-1">Password is required.</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className="btn w-full mt-2" disabled={busy}>
                {busy
                  ? mode === 'signup'
                    ? 'Creating account…'
                    : mode === 'forgot'
                    ? 'Sending link…'
                    : 'Signing in…'
                  : mode === 'signup'
                  ? 'Create account'
                  : mode === 'forgot'
                  ? 'Send reset link'
                  : 'Sign in'}
              </button>

              {/* Footer Switcher Links */}
              {mode === 'login' && (
                <p className="text-center text-xs text-cream-muted pt-2">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="text-brand-text font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p className="text-center text-xs text-cream-muted pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-brand-text font-semibold hover:underline"
                  >
                    Log in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full text-center text-xs text-cream-muted hover:text-cream mt-2"
                >
                  ← Back to login
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
