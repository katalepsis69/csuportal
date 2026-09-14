'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveLoginEmail, registerStudent } from '@/lib/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setBusy(false);
          return;
        }
        if (!studentId.trim()) {
          setError('Please enter your student ID.');
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
      } else {
        if (!studentId.trim()) {
          setError('Please enter your student ID or email.');
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
              ? 'Invalid student ID or password.'
              : signInErr.message
          );
          setBusy(false);
          return;
        }
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <div
            className="text-[28px] font-extrabold tracking-[0.03em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            CETC<span className="text-brand">-LSC</span>
          </div>
          <p className="mt-1 text-sm text-cream-muted">Faculty Evaluation Portal</p>
        </div>

        {/* Stepper matching brand colors */}
        <div className="w-full max-w-[280px] mb-6 flex items-center justify-between" aria-label="Progress">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-canvas">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
          </div>

          <div className="h-[2px] flex-1 bg-brand" />

          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-canvas">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
          </div>

          <div className="h-[2px] flex-1 bg-brand" />

          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand bg-panel">
            <div className="h-2 w-2 rounded-full bg-brand" />
          </div>

          <div className="h-[2px] flex-1 bg-subtle" />

          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-subtle bg-panel">
            <div className="h-1.5 w-1.5 rounded-full bg-cream-faint" />
          </div>
        </div>

        {/* Card */}
        <div className="card w-full space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-cream">
              {mode === 'signup' ? 'Create an account' : 'Sign in'}
            </h1>
            <p className="mt-1 text-xs text-cream-muted">
              {mode === 'signup'
                ? 'Register with your student ID to begin.'
                : 'Enter your student ID to access the portal.'}
            </p>
          </div>

          {/* Segmented Control / Pill Toggle */}
          <div className="grid grid-cols-2 rounded-lg bg-bg2 p-1 border border-subtle">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-panel text-cream shadow-xs border border-subtle'
                  : 'text-cream-muted hover:text-cream'
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-panel text-cream shadow-xs border border-subtle'
                  : 'text-cream-muted hover:text-cream'
              }`}
            >
              Log in
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="studentId">
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                className="input"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
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

            {error && <p className="text-xs text-negative">{error}</p>}

            <button type="submit" className="btn w-full" disabled={busy}>
              {busy
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'signup'
                ? 'Get started'
                : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-cream-faint">
          Students: use Student ID (e.g. 2026-0001). Faculty/Admin may use email.
        </p>
      </div>
    </main>
  );
}
