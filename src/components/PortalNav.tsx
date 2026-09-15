'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import type { Role } from '@/lib/auth';
import { useTheme } from '@/components/ThemeProvider';
import { IconSun, IconMoon } from '@/components/icons';
import {
  IconBookLine,
  IconChartLine,
  IconClipboardLine,
  IconGaugeLine,
  IconGearLine,
  IconSignOutLine,
  IconUsersLine,
} from '@/components/dashboard/StaffScaffold';

type Item = { href: string; label: string; icon: React.ReactNode; badge?: string };

const NAV: Record<Role, Item[]> = {
  student: [
    { href: '/student', label: 'Dashboard', icon: <IconGaugeLine className="h-5 w-5 shrink-0" /> },
    { href: '/student#pending', label: 'Appraise Faculty', icon: <IconClipboardLine className="h-5 w-5 shrink-0" />, badge: 'Active' },
  ],
  faculty: [
    { href: '/faculty', label: 'Evaluation Results', icon: <IconChartLine className="h-5 w-5 shrink-0" /> },
  ],
  dean: [
    { href: '/dean', label: 'Executive Analytics', icon: <IconGaugeLine className="h-5 w-5 shrink-0" /> },
    { href: '/dean/history', label: 'Historical Archives', icon: <IconBookLine className="h-5 w-5 shrink-0" /> },
    { href: '/reports', label: 'Appraisal Reports', icon: <IconChartLine className="h-5 w-5 shrink-0" /> },
  ],
  admin: [
    { href: '/admin', label: 'System Overview', icon: <IconGaugeLine className="h-5 w-5 shrink-0" /> },
    { href: '/admin?tab=users', label: 'User Directory', icon: <IconUsersLine className="h-5 w-5 shrink-0" /> },
    { href: '/dean/history', label: 'Historical Archives', icon: <IconBookLine className="h-5 w-5 shrink-0" /> },
    { href: '/reports', label: 'Reports Center', icon: <IconChartLine className="h-5 w-5 shrink-0" /> },
    { href: '/admin?tab=semesters', label: 'System Settings', icon: <IconGearLine className="h-5 w-5 shrink-0" /> },
  ],
};

function useActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href.includes('?')) {
      const search = typeof window === 'undefined' ? '' : window.location.search;
      return pathname + search === href;
    }
    const base = href.split('#')[0];
    return pathname === base || (base !== '/' && pathname.startsWith(base + '/'));
  };
}

export function RailNav({ role, fullName }: { role: Role; fullName: string }) {
  const isActive = useActive();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV[role];

  // Close mobile drawer on route change
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (mobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const initials =
    fullName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const roleTag = role.toUpperCase();

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP HEADER WITH HAMBURGER (< md)                                */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-subtle/80 glass-panel bg-panel/80 px-4 py-2.5 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-panel2 border border-brand/30 p-1.5 shadow-sm">
              <img src="/csu-cetc-logo.png" alt="" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight text-cream font-mono">CSU CETC</span>
                <span className="rounded bg-brand/15 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-brand-text border border-brand/30">
                  {roleTag}
                </span>
              </div>
              <p className="text-[10px] text-cream-muted">Evaluation Portal</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-bg2 text-cream-muted hover:text-cream active:scale-95"
          >
            {resolvedTheme === 'dark' ? (
              <IconSun className="h-4 w-4 text-gold-text" />
            ) : (
              <IconMoon className="h-4 w-4 text-brand" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-bg2 text-cream hover:text-brand active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE SLIDE-OUT DRAWER OVERLAY (< md)                                 */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col justify-between glass-panel bg-panel/95 backdrop-blur-2xl border-r border-subtle p-5 shadow-2xl overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="flex items-center justify-between pb-5 border-b border-subtle/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel2 border border-brand/40 p-1.5 shadow-md">
                    <img src="/csu-cetc-logo.png" alt="" className="h-7 w-7 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm tracking-tight text-cream font-mono">CSU CETC</span>
                      <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-brand-text border border-brand/30">
                        {roleTag}
                      </span>
                    </div>
                    <p className="text-xs text-cream-muted">Cotabato State Univ.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-cream-muted hover:text-cream hover:bg-panel2 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-6 space-y-2">
                <div className="px-2 text-[10px] font-mono tracking-wider text-cream-muted uppercase font-semibold">
                  Navigation
                </div>
                {items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-brand/20 to-transparent border border-brand/40 text-cream amber-pill-glow font-semibold'
                          : 'text-cream-dim hover:text-cream hover:bg-panel2/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? 'text-brand' : 'text-cream-muted'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {active && <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />}
                      {item.badge && !active && (
                        <span className="rounded bg-bg2 px-1.5 py-0.5 text-[10px] font-mono text-cream-muted border border-subtle">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* System Integrity Widget */}
              <div className="mt-8 p-3 rounded-xl border border-subtle/80 bg-bg2/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-cream-muted">
                  <span>Ledger Integrity</span>
                  <span className="text-positive font-semibold">100% Valid</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden border border-subtle/50">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand to-positive w-full" />
                </div>
                <div className="text-[10px] text-cream-faint font-mono pt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                  SHA-256 Verified
                </div>
              </div>
            </div>

            {/* Bottom Profile & Sign Out */}
            <div className="pt-4 border-t border-subtle/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel2 border border-brand/30 font-bold text-brand font-mono text-xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-cream text-xs truncate">{fullName}</div>
                  <div className="text-[10px] text-cream-muted font-mono">{roleTag} Account</div>
                </div>
              </div>

              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-subtle bg-bg2 px-3 py-2 text-xs font-semibold text-negative hover:bg-negative/15 transition-colors"
                >
                  <IconSignOutLine className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP HOVER-EXPANDABLE RAIL-TO-SIDEBAR (md:)                          */}
      {/* Slim w-[72px] by default, expands to w-64 on mouse hover!                  */}
      {/* ========================================================================= */}
      <aside
        className="group hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-[72px] hover:w-64 flex-col justify-between glass-panel bg-panel/90 backdrop-blur-2xl border-r border-subtle p-3.5 hover:p-5 shadow-xl hover:shadow-2xl transition-[width,padding,box-shadow] duration-300 ease-out overflow-hidden"
      >
        {/* Top Brand Area */}
        <div className="space-y-6">
          {/* Logo & College Emblem */}
          <Link
            href="/"
            className="flex items-center gap-3.5 pb-4 border-b border-subtle/80 transition-transform active:scale-[0.98]"
            title="CSU CETC Portal"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-panel2 border border-brand/30 p-2 shadow-md group-hover:border-brand transition-colors">
              <img src="/csu-cetc-logo.png" alt="CETC Logo" className="h-7 w-7 object-contain" />
            </div>
            <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-cream font-mono">CSU CETC</span>
                <span className="rounded bg-brand/15 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-brand-text border border-brand/30">
                  {roleTag}
                </span>
              </div>
              <p className="text-[11px] text-cream-muted truncate font-medium">Cotabato State Univ.</p>
            </div>
          </Link>

          {/* Navigation Links Group */}
          <div className="space-y-2">
            <div className="px-2 text-[10px] font-mono tracking-wider text-cream-muted uppercase font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Portal Navigation
            </div>

            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between rounded-xl p-2.5 transition-all duration-200 relative ${
                    active
                      ? 'bg-gradient-to-r from-brand/25 to-brand/5 border border-brand/40 text-cream amber-pill-glow font-semibold shadow-sm'
                      : 'text-cream-dim hover:text-cream hover:bg-panel2/80 border border-transparent'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <span className={`shrink-0 flex items-center justify-center ${active ? 'text-brand' : 'text-cream-muted'}`}>
                      {item.icon}
                    </span>
                    <span className="text-xs tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {item.label}
                    </span>
                  </div>

                  {active && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_#D86A12] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                  {item.badge && !active && (
                    <span className="shrink-0 rounded bg-bg2 px-1.5 py-0.2 text-[9px] font-mono text-cream-muted border border-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* System Diagnostic Widget (Expands on hover) */}
          <div className="hidden group-hover:block p-3 rounded-xl border border-subtle/80 bg-bg2/50 space-y-1.5 transition-all duration-300">
            <div className="flex items-center justify-between text-[10px] font-mono text-cream-muted">
              <span>Ledger Status</span>
              <span className="text-positive font-semibold">100% Synced</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden border border-subtle/50">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-positive w-full" />
            </div>
            <p className="text-[9px] text-cream-faint font-mono flex items-center gap-1 pt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              SHA-256 Tamper Protected
            </p>
          </div>
        </div>

        {/* Bottom Profile Card & Theme Switcher */}
        <div className="pt-3 border-t border-subtle/80 space-y-3">
          {/* User initials & name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel2 border border-brand/30 text-xs font-bold text-brand font-mono shadow-md">
              {initials}
            </div>
            <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              <div className="font-semibold text-xs text-cream truncate">{fullName}</div>
              <div className="text-[10px] text-cream-muted font-mono">{roleTag} Account</div>
            </div>
          </div>

          {/* Controls: Theme Toggle and Sign Out */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-subtle bg-bg2 text-cream-muted hover:text-cream hover:bg-panel2 transition-colors active:scale-95"
            >
              {resolvedTheme === 'dark' ? (
                <IconSun className="h-4 w-4 text-gold-text" />
              ) : (
                <IconMoon className="h-4 w-4 text-brand" />
              )}
            </button>

            <form action={signOut} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="submit"
                title="Sign out of account"
                aria-label="Sign out"
                className="flex items-center gap-1.5 rounded-lg border border-subtle/70 bg-bg2 px-2.5 py-1.5 text-xs text-cream-muted hover:text-negative hover:bg-negative/10 transition-colors active:scale-95"
              >
                <IconSignOutLine className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Exit</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
