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
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4 sm:p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Stepper from Image 2 */}
        <div className="w-full max-w-[320px] mb-8 flex items-center justify-between" aria-label="Progress">
          {/* Step 1: Completed */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-xs">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
          </div>

          <div className="h-[2px] flex-1 bg-[#7C3AED]" />

          {/* Step 2: Completed */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-xs">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
          </div>

          <div className="h-[2px] flex-1 bg-[#7C3AED]" />

          {/* Step 3: Current */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#7C3AED] bg-white">
            <div className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />
          </div>

          <div className="h-[2px] flex-1 bg-gray-200" />

          {/* Step 4: Upcoming */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* Card from Image 1 */}
        <div className="w-full rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50">
          {/* Card Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {mode === 'signup' ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'signup'
                ? 'Register with your student ID to get started.'
                : 'Enter your student ID to access the portal.'}
            </p>
          </div>

          {/* Segmented Control / Pill Toggle */}
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 mb-6 border border-gray-200/60">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
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
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Log in
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/20 outline-none transition"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="studentId">
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/20 outline-none transition"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-gray-300 bg-white pl-4 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#7C3AED] focus:ring-3 focus:ring-[#7C3AED]/20 outline-none transition"
                  placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {mode === 'signup' && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <svg
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      password.length >= 8 ? 'text-[#7C3AED]' : 'text-gray-400'
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
                  <span className={password.length >= 8 ? 'text-gray-700 font-medium' : 'text-gray-500'}>
                    Must be at least 8 characters.
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] py-3 px-4 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/25 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
            >
              {busy
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'signup'
                ? 'Get started'
                : 'Log in'}
            </button>
          </form>
        </div>

        {/* Institutional subtext */}
        <p className="mt-6 text-center text-xs text-gray-500">
          CETC-LSC Faculty Evaluation Portal · Students use Student ID (e.g. 2026-0001)
        </p>
      </div>
    </main>
  );
}
