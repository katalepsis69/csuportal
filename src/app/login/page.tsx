'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { resolveLoginEmail, registerStudent, requestPasswordReset } from '@/lib/actions/auth';

type PortalType = 'student' | 'staff';
type FormMode = 'login' | 'signup' | 'forgot';

const DEMO_STAFF_ACCOUNTS = [
  { role: 'Admin', email: 'admin@cetc.test', label: 'Admin', desc: 'Curriculum & User Management' },
  { role: 'Dean', email: 'dean@cetc.test', label: 'Dean', desc: 'College Analytics & Reports' },
  { role: 'Faculty', email: 'maria@cetc.test', label: 'Faculty', desc: 'Class Evaluations & Scores' },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Portal switcher state: 'student' or 'staff'
  const initialPortal: PortalType = searchParams.get('portal') === 'staff' ? 'staff' : 'student';
  const [portal, setPortal] = useState<PortalType>(initialPortal);

  // Form mode state: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<FormMode>('login');

  // Student form states
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [programCode, setProgramCode] = useState('BSIT');
  const [yearLevel, setYearLevel] = useState('1');

  // Staff form states
  const [staffEmail, setStaffEmail] = useState('');

  // Common form states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep URL search parameter in sync without re-renders
  function handlePortalChange(newPortal: PortalType) {
    setPortal(newPortal);
    setMode('login');
    setError(null);
    setSuccess(null);
    setTouched({});
    setPassword('');
    const url = new URL(window.location.href);
    url.searchParams.set('portal', newPortal);
    window.history.replaceState(null, '', url.toString());
  }

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

  // Quick fill staff demo credentials
  function fillStaffDemo(email: string) {
    setStaffEmail(email);
    setPassword('eval1234');
    setError(null);
    setSuccess(null);
    setTouched({ staffEmail: true, password: true });
  }

  // Real-time field validations
  const isStudentIdValid =
    mode === 'login' || mode === 'forgot'
      ? studentId.trim().includes('@') || /^\d{4}-\d{4}$/.test(studentId.trim())
      : /^\d{4}-\d{4}$/.test(studentId.trim());

  const isStudentEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim());
  const isStaffEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail.trim());
  const isPasswordValid = password.length >= 8;
  const isNameValid = name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      studentId: true,
      studentEmail: true,
      staffEmail: true,
      password: true,
    });
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (portal === 'student') {
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
          if (!isStudentEmailValid) {
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
            email: studentEmail.trim(),
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
            setError('Please enter your Student ID.');
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
                ? 'Invalid student ID or password.'
                : signInErr.message
            );
            setBusy(false);
            return;
          }
        } else if (mode === 'forgot') {
          if (!studentId.trim()) {
            setError('Please enter your Student ID.');
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
      } else {
        // Staff portal login (Admin, Dean, Faculty)
        if (mode === 'login') {
          if (!staffEmail.trim()) {
            setError('Please enter your institutional email.');
            setBusy(false);
            return;
          }
          if (!password) {
            setError('Please enter your password.');
            setBusy(false);
            return;
          }

          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: staffEmail.trim(),
            password,
          });

          if (signInErr) {
            setError(
              signInErr.message === 'Invalid login credentials'
                ? 'Invalid institutional email or password.'
                : signInErr.message
            );
            setBusy(false);
            return;
          }
        } else if (mode === 'forgot') {
          if (!staffEmail.trim()) {
            setError('Please enter your institutional email address.');
            setBusy(false);
            return;
          }

          const resetRes = await requestPasswordReset(staffEmail.trim());
          if (!resetRes.ok) {
            setError(resetRes.error ?? 'Could not send recovery instructions.');
            setBusy(false);
            return;
          }

          setSuccess('Administrative reset link dispatched to your institutional email.');
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
    <main className="min-h-[100dvh] w-full flex flex-col md:grid md:grid-cols-12 bg-canvas text-cream selection:bg-brand/30">
      {/* Mobile Masthead (< 768px) */}
      <div className="md:hidden flex flex-col items-center pt-5 pb-3 px-4 text-center border-b border-subtle bg-panel/40">
        <div className="flex items-center gap-2.5">
          <Image
            src="/csu-cetc-logo.png"
            alt="Cotabato State University - CETC"
            width={36}
            height={36}
            className="h-9 w-9 object-contain shrink-0"
            priority
          />
          <div className="text-left">
            <div
              className="text-lg font-extrabold tracking-wide leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              CSU <span className="text-brand">CETC</span>
            </div>
            <p className="text-[10px] text-cream-muted">Cotabato State University</p>
          </div>
        </div>

        {/* Mobile Portal Switcher */}
        <div className="w-full max-w-[340px] mt-4 grid grid-cols-2 rounded-xl bg-bg2/90 p-1 border border-subtle shadow-inner">
          <button
            type="button"
            onClick={() => handlePortalChange('student')}
            className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
              portal === 'student'
                ? 'bg-panel text-cream shadow-sm border border-subtle'
                : 'text-cream-muted hover:text-cream'
            }`}
          >
            Student Portal
          </button>
          <button
            type="button"
            onClick={() => handlePortalChange('staff')}
            className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
              portal === 'staff'
                ? 'bg-panel text-cream shadow-sm border border-subtle'
                : 'text-cream-muted hover:text-cream'
            }`}
          >
            Faculty & Staff
          </button>
        </div>
      </div>

      {/* Left Column: Authentication Form Panel (LEFT SIDE) */}
      <section className="md:col-span-6 flex flex-col items-center justify-center p-4 sm:p-8 xl:p-12 border-b md:border-b-0 md:border-r border-subtle relative bg-canvas">
        {/* Desktop Portal Switcher Pill */}
        <div className="w-full max-w-[440px] mb-5 hidden md:block">
          <div className="rounded-2xl bg-bg2/90 p-1.5 border border-subtle shadow-md">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handlePortalChange('student')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all duration-200 ${
                  portal === 'student'
                    ? 'bg-panel text-cream shadow-sm border border-subtle font-bold'
                    : 'text-cream-muted hover:text-cream hover:bg-panel/40'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${portal === 'student' ? 'bg-brand' : 'bg-cream-muted/40'}`} />
                Student Portal
              </button>
              <button
                type="button"
                onClick={() => handlePortalChange('staff')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all duration-200 ${
                  portal === 'staff'
                    ? 'bg-panel text-cream shadow-sm border border-subtle font-bold'
                    : 'text-cream-muted hover:text-cream hover:bg-panel/40'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${portal === 'staff' ? 'bg-brand' : 'bg-cream-muted/40'}`} />
                Faculty & Staff
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="w-full max-w-[440px]">
          <div className="card space-y-5 transition-all duration-200 shadow-xl border border-subtle">
            {/* Header Brand */}
            <div className="flex items-center justify-between pb-1 border-b border-subtle/60">
              <div className="flex items-center gap-3">
                <Image
                  src="/csu-cetc-logo.png"
                  alt="CSU CETC"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain shrink-0 drop-shadow"
                />
                <div>
                  <div
                    className="text-lg font-extrabold tracking-wide leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    CSU <span className="text-brand">CETC</span>
                  </div>
                  <p className="text-[11px] text-cream-muted">
                    {portal === 'student' ? 'Student Evaluation Portal' : 'Faculty, Dean & Admin Portal'}
                  </p>
                </div>
              </div>

              {/* Portal Badge */}
              <span className="badge badge-brand text-[10px] tracking-wider uppercase">
                {portal === 'student' ? 'Student' : 'Staff'}
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2
                className="text-2xl font-bold tracking-tight text-cream"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {portal === 'student'
                  ? mode === 'signup'
                    ? 'Create Student Account'
                    : mode === 'forgot'
                    ? 'Reset Student Password'
                    : 'Student Log in'
                  : mode === 'forgot'
                  ? 'Reset Staff Password'
                  : 'Staff Sign in'}
              </h2>
              <p className="text-xs text-cream-muted">
                {portal === 'student'
                  ? mode === 'signup'
                    ? 'Enter your undergraduate credentials to register.'
                    : mode === 'forgot'
                    ? 'Enter your Student ID to receive reset instructions.'
                    : 'Enter your Student ID and password to access evaluations.'
                  : mode === 'forgot'
                  ? 'Enter your institutional email for recovery instructions.'
                  : 'Faculty, Dean, and Administrator access with institutional email.'}
              </p>
            </div>

            {/* Segmented Control for Student Portal (Login / Signup) */}
            {portal === 'student' && mode !== 'forgot' && (
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
              {/* ================= STUDENT FORM FIELDS ================= */}
              {portal === 'student' && (
                <>
                  {/* Full Name (Sign up only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="label" htmlFor="studentName">
                        Full Name <span className="text-negative">*</span>
                      </label>
                      <input
                        id="studentName"
                        type="text"
                        className={`input ${
                          touched.name && !isNameValid
                            ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                            : ''
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

                  {/* Student ID (Auto-formatted YYYY-XXXX) */}
                  <div>
                    <label className="label" htmlFor="studentIdInput">
                      Student ID <span className="text-negative">*</span>
                    </label>
                    <input
                      id="studentIdInput"
                      type="text"
                      className={`input ${
                        touched.studentId && !isStudentIdValid
                          ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                          : ''
                      }`}
                      placeholder={mode === 'signup' ? '2026-0001' : '2026-0001'}
                      value={studentId}
                      onChange={handleStudentIdChange}
                      onBlur={() => markTouched('studentId')}
                      required
                      autoComplete={mode === 'signup' ? 'username' : 'username'}
                    />
                    {touched.studentId && !isStudentIdValid && (
                      <p className="text-[11px] text-negative mt-1">
                        Please enter a valid Student ID (e.g. 2026-0001).
                      </p>
                    )}
                  </div>

                  {/* Email Address (Sign up only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="label" htmlFor="studentEmailInput">
                        Email Address <span className="text-negative">*</span>
                      </label>
                      <input
                        id="studentEmailInput"
                        type="email"
                        className={`input ${
                          touched.studentEmail && !isStudentEmailValid
                            ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                            : ''
                        }`}
                        placeholder="student@cetc.edu or personal email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        onBlur={() => markTouched('studentEmail')}
                        required
                        autoComplete="email"
                      />
                      {touched.studentEmail && !isStudentEmailValid && (
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
                </>
              )}

              {/* ================= STAFF FORM FIELDS ================= */}
              {portal === 'staff' && (
                <>
                  {/* Institutional Email */}
                  <div>
                    <label className="label" htmlFor="staffEmailInput">
                      Institutional Email <span className="text-negative">*</span>
                    </label>
                    <input
                      id="staffEmailInput"
                      type="email"
                      className={`input ${
                        touched.staffEmail && !isStaffEmailValid
                          ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                          : ''
                      }`}
                      placeholder="admin@cetc.test or name@csu.edu.ph"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      onBlur={() => markTouched('staffEmail')}
                      required
                      autoComplete="username email"
                    />
                    {touched.staffEmail && !isStaffEmailValid && (
                      <p className="text-[11px] text-negative mt-1">
                        Please enter a valid institutional email.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Password Field (Common to both portals when not in forgot password mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label !mb-0" htmlFor="passwordInput">
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
                      id="passwordInput"
                      type={showPassword ? 'text' : 'password'}
                      className={`input pr-10 ${
                        touched.password && !isPasswordValid
                          ? 'border-negative focus:border-negative ring-1 ring-negative/30'
                          : ''
                      }`}
                      placeholder={
                        portal === 'student' && mode === 'signup'
                          ? 'Create password (min 8 chars)'
                          : 'Enter password'
                      }
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

                  {portal === 'student' && mode === 'signup' && (
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
                  ? 'Create student account'
                  : mode === 'forgot'
                  ? 'Send reset link'
                  : portal === 'student'
                  ? 'Sign in to Student Portal'
                  : 'Sign in to Staff Portal'}
              </button>

              {/* Footer Links & Switchers */}
              {portal === 'student' && mode === 'login' && (
                <p className="text-center text-xs text-cream-muted pt-1">
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

              {portal === 'student' && mode === 'signup' && (
                <p className="text-center text-xs text-cream-muted pt-1">
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

            {/* ================= STAFF DEMO CREDENTIALS QUICK-FILL ================= */}
            {portal === 'staff' && mode === 'login' && (
              <div className="pt-3 border-t border-subtle/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-cream-muted">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Demo Test Accounts:</span>
                  <span className="text-[10px] text-brand-text">Password: eval1234</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEMO_STAFF_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillStaffDemo(acc.email)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-left transition-all ${
                        staffEmail === acc.email
                          ? 'border-brand bg-brand/15 text-cream shadow-xs'
                          : 'border-subtle bg-panel/50 text-cream-dim hover:text-cream hover:border-cream-muted/40 hover:bg-panel'
                      }`}
                      title={acc.desc}
                    >
                      <span className="text-xs font-bold text-cream">{acc.label}</span>
                      <span className="text-[9px] text-cream-muted truncate max-w-full">{acc.email.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-cream-faint text-center pt-1">
                  Accounts provisioned by Dean&apos;s Office & IT Services.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right Column: Refined Editorial Showcase (Quote + Live Preview) */}
      <section className="md:col-span-6 hidden md:flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative overflow-hidden bg-gradient-to-b from-panel/40 via-canvas to-canvas">
        {/* Ambient warm glow */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-brand/10 blur-3xl" />

        {/* Top Branding (Official Logo + CSU CETC) */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Image
              src="/csu-cetc-logo.png"
              alt="Cotabato State University - CETC Logo"
              width={56}
              height={56}
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

          <span className="badge badge-subtle hidden lg:inline-flex text-[11px]">
            {portal === 'student' ? 'Student Portal' : 'Academic Leadership'}
          </span>
        </div>

        {/* ================= STUDENT ACTIVE SHOWCASE ================= */}
        {portal === 'student' && (
          <div className="relative z-10 my-auto py-6 space-y-6 max-w-xl transition-all duration-300">
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

            {/* High-Fidelity Student Portal Dashboard Mockup */}
            <div className="rounded-2xl border border-subtle bg-bg2/90 shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Window bar */}
              <div className="flex items-center justify-between border-b border-subtle bg-panel/70 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-negative/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-positive/80 inline-block" />
                  <span className="ml-2 text-[11px] text-cream-muted">portal.csu.edu.ph/student</span>
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
        )}

        {/* ================= STAFF ACTIVE SHOWCASE ================= */}
        {portal === 'staff' && (
          <div className="relative z-10 my-auto py-6 space-y-6 max-w-xl transition-all duration-300">
            {/* Executive Quote */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-semibold text-brand-text border border-brand/30">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                Office of the Dean · Academic Governance
              </div>
              <p className="text-lg xl:text-xl font-medium text-cream leading-snug">
                “Academic leadership and faculty excellence drive curriculum integrity and student success across every engineering and computing program.”
              </p>
              <p className="text-xs text-cream-muted">
                — <span className="text-cream font-semibold">Dr. Elena Reyes</span>, Dean, College of Engineering, Technology & Computing
              </p>
            </div>

            {/* High-Fidelity Executive Analytics Dashboard Mockup */}
            <div className="rounded-2xl border border-subtle bg-bg2/90 shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Window bar */}
              <div className="flex items-center justify-between border-b border-subtle bg-panel/70 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-negative/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-positive/80 inline-block" />
                  <span className="ml-2 text-[11px] text-cream-muted">portal.csu.edu.ph/dean/analytics</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-bg2 px-2 py-0.5 text-[10px] font-medium text-positive border border-subtle">
                  <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
                  1st Sem AY 2026–2027 Active
                </span>
              </div>

              {/* Mockup Executive Analytics Content */}
              <div className="p-4 space-y-3.5">
                {/* Executive Metric Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-panel/60 p-2.5 border border-subtle">
                    <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">Compliance</span>
                    <div className="text-base font-bold text-positive">94.2%</div>
                    <span className="text-[9px] text-cream-muted">1,240 Evaluated</span>
                  </div>
                  <div className="rounded-lg bg-panel/60 p-2.5 border border-subtle">
                    <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">Faculty</span>
                    <div className="text-base font-bold text-cream">48 Active</div>
                    <span className="text-[9px] text-cream-muted">100% Assigned</span>
                  </div>
                  <div className="rounded-lg bg-panel/60 p-2.5 border border-subtle">
                    <span className="text-[10px] text-cream-muted uppercase tracking-wider font-semibold">Quality Index</span>
                    <div className="text-base font-bold text-gold-text">4.82 / 5.0</div>
                    <span className="text-[9px] text-cream-muted">College Mean</span>
                  </div>
                </div>

                {/* Departmental Response Rates */}
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-cream-dim">BS Information Technology (BSIT)</span>
                      <span className="text-brand-text font-bold">96.4%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: '96.4%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-cream-dim">BS Computer Science (BSCS)</span>
                      <span className="text-brand-text font-bold">91.8%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: '91.8%' }} />
                    </div>
                  </div>
                </div>

                {/* Institutional Compliance Badges */}
                <div className="flex items-center justify-between pt-2 border-t border-subtle/50 text-[10px]">
                  <span className="inline-flex items-center gap-1 text-positive font-medium">
                    <span>✓</span> CHED Memorandum Compliant
                  </span>
                  <span className="text-cream-muted">
                    AACCUP Level III Accredited
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 text-xs text-cream-faint border-t border-subtle pt-4 flex items-center justify-between">
          <span>{portal === 'student' ? 'Faculty Evaluation System' : 'Academic Leadership & Quality Assurance'}</span>
          <span>© Cotabato State University</span>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] w-full bg-canvas" />}>
      <LoginContent />
    </Suspense>
  );
}
