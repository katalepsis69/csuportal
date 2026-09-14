'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveLoginEmail, registerStudent, requestPasswordReset } from '@/lib/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [programCode, setProgramCode] = useState('BSIT');
  const [yearLevel, setYearLevel] = useState('1');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setBusy(false);
          return;
        }
        if (!studentId.trim()) {
          setError('Please enter your student ID.');
          setBusy(false);
          return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError('Please enter a valid email address.');
          setBusy(false);
          return;
        }
        if (password.length < 8) {
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
          setError('Please enter your Student ID or Email.');
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
          setError('Please enter your Student ID or Email.');
          setBusy(false);
          return;
        }

        const resetRes = await requestPasswordReset(studentId);
        if (!resetRes.ok) {
          setError(resetRes.error ?? 'Could not send recovery instructions.');
          setBusy(false);
          return;
        }

        setSuccess('Password recovery link dispatched. Please inspect your email inbox.');
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
    <main className="min-h-[100dvh] w-full flex flex-col lg:grid lg:grid-cols-12 bg-canvas text-cream selection:bg-brand/30">
      {/* Mobile Masthead (< 1024px) */}
      <div className="lg:hidden flex flex-col items-center pt-8 pb-4 px-6 text-center border-b border-subtle bg-panel/30">
        <div
          className="text-2xl font-extrabold tracking-[0.03em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          CETC<span className="text-brand">-LSC</span>
        </div>
        <p className="mt-1 text-xs text-cream-muted">Faculty Evaluation Portal</p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-bg2 px-3 py-1 text-[11px] font-medium text-brand-text border border-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          AY 2026–2027 · 1st Semester
        </span>
      </div>

      {/* Left Column: Editorial Architectural Typography (>= 1024px) */}
      <section className="lg:col-span-5 xl:col-span-6 hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-subtle relative overflow-hidden bg-gradient-to-b from-panel/50 via-canvas to-canvas">
        {/* Ambient background glow & watermark emblem */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-brand/10 blur-3xl" />
        <svg
          className="pointer-events-none absolute -right-16 -bottom-16 w-96 h-96 text-cream opacity-[0.03] select-none"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="90" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="72" />
          <polygon points="100,35 156,135 44,135" />
          <polygon points="100,165 44,65 156,65" />
          <circle cx="100" cy="100" r="28" />
        </svg>

        {/* Header Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-canvas font-black tracking-wider text-sm shadow-md">
              LSC
            </div>
            <div>
              <div
                className="text-2xl font-extrabold tracking-[0.03em] leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                CETC<span className="text-brand">-LSC</span>
              </div>
              <p className="text-xs text-cream-muted tracking-wide mt-0.5">
                College of Engineering & Technology
              </p>
            </div>
          </div>
        </div>

        {/* Center: Architectural Typography & Mission Statement */}
        <div className="relative z-10 my-auto py-12 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-panel/70 px-3 py-1 text-xs font-semibold tracking-wide text-brand-text">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Active Academic Term · AY 2026–2027
          </div>

          <h1
            className="text-4xl xl:text-5xl font-extrabold tracking-tight text-cream leading-[1.12]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Academic Integrity, Objective Evaluation.
          </h1>

          <blockquote className="border-l-2 border-brand/60 pl-4 text-sm xl:text-base text-cream-dim leading-relaxed italic">
            “Nurturing technical excellence, constructive student feedback, and transparent academic leadership across engineering disciplines.”
          </blockquote>

          {/* Institutional Trust Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="rounded-lg border border-subtle bg-bg2/80 p-3">
              <div className="text-xs font-bold text-cream flex items-center gap-1.5">
                <span className="text-brand">●</span> 100% Anonymized
              </div>
              <p className="mt-1 text-[11px] text-cream-muted leading-snug">
                Faculty only inspect aggregated summaries; your identity is shielded.
              </p>
            </div>

            <div className="rounded-lg border border-subtle bg-bg2/80 p-3">
              <div className="text-xs font-bold text-cream flex items-center gap-1.5">
                <span className="text-positive">●</span> Cryptographic Hash
              </div>
              <p className="mt-1 text-[11px] text-cream-muted leading-snug">
                Submissions generate an immutable SHA-256 digital verification record.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-cream-faint border-t border-subtle pt-4 flex items-center justify-between">
          <span>Faculty Evaluation Portal</span>
          <span>CHED Memorandum Compliant</span>
        </div>
      </section>

      {/* Right Column: Authentication Card Panel */}
      <section className="lg:col-span-7 xl:col-span-6 flex items-center justify-center p-4 sm:p-8 xl:p-12">
        <div className="w-full max-w-md">
          <div className="card space-y-6">
            {/* Header / Subtitle */}
            <div className="text-center space-y-1">
              <h2
                className="text-2xl font-bold tracking-tight text-cream"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {mode === 'signup'
                  ? 'Create student account'
                  : mode === 'forgot'
                  ? 'Reset your password'
                  : 'Sign in to portal'}
              </h2>
              <p className="text-xs text-cream-muted">
                {mode === 'signup'
                  ? 'Register your student credentials to begin evaluation.'
                  : mode === 'forgot'
                  ? 'Provide your Student ID or Email for recovery.'
                  : 'Enter your student ID or departmental email.'}
              </p>
            </div>

            {/* Segmented Control (hidden when in forgot mode) */}
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
              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    placeholder="e.g. Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="studentId">
                  {mode === 'signup' ? 'Student ID' : 'Student ID or Email'}
                </label>
                <input
                  id="studentId"
                  type="text"
                  className="input"
                  placeholder={
                    mode === 'signup' ? 'e.g. 2026-0001' : 'e.g. 2026-0001 or faculty@cetc.test'
                  }
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  autoComplete={mode === 'signup' ? 'username' : 'username email'}
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="e.g. student@cetc.edu or personal email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="programCode">
                      Degree Program
                    </label>
                    <select
                      id="programCode"
                      className="input py-2 cursor-pointer"
                      value={programCode}
                      onChange={(e) => setProgramCode(e.target.value)}
                    >
                      <option value="BSIT">BS Information Technology (BSIT)</option>
                      <option value="BSCS">BS Computer Science (BSCS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" htmlFor="yearLevel">
                      Year Level
                    </label>
                    <select
                      id="yearLevel"
                      className="input py-2 cursor-pointer"
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

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label !mb-0" htmlFor="password">
                      Password
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
                      className="input pr-10"
                      placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
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
                </div>
              )}

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

          <p className="mt-6 text-center text-xs text-cream-faint leading-relaxed">
            Students use Student ID (e.g. 2026-0001). Faculty and staff use institutional email.
          </p>
        </div>
      </section>
    </main>
  );
}
