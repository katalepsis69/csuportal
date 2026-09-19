'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import type { Role } from '@/lib/auth';
import {
  IconChartLine,
  IconGaugeLine,
  IconSignOutLine,
  IconUsersLine,
  IconBookLine,
  IconClipboardLine,
  IconGearLine,
} from '@/components/dashboard/StaffScaffold';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  dotPulse?: boolean;
};

const NAV_CONFIG: Record<
  Role,
  { sectionTitle: string; roleTag: string; items: NavItem[] }
> = {
  dean: {
    sectionTitle: 'Executive Navigation',
    roleTag: 'DEAN',
    items: [
      {
        href: '/dean',
        label: 'Overview Dashboard',
        icon: (
          <svg className="w-4 h-4 text-primary" viewBox="0 0 256 256" fill="currentColor">
            <rect x="40" y="40" width="72" height="72" rx="10" opacity="0.2" fill="currentColor" />
            <rect x="144" y="40" width="72" height="72" rx="10" opacity="0.2" fill="currentColor" />
            <rect x="40" y="144" width="72" height="72" rx="10" opacity="0.2" fill="currentColor" />
            <rect x="144" y="144" width="72" height="72" rx="10" fill="currentColor" />
            <rect x="40" y="40" width="72" height="72" rx="10" stroke="currentColor" strokeWidth="16" fill="none" />
            <rect x="144" y="40" width="72" height="72" rx="10" stroke="currentColor" strokeWidth="16" fill="none" />
            <rect x="40" y="144" width="72" height="72" rx="10" stroke="currentColor" strokeWidth="16" fill="none" />
            <rect x="144" y="144" width="72" height="72" rx="10" stroke="currentColor" strokeWidth="16" fill="none" />
          </svg>
        ),
      },
      {
        href: '/dean#roster',
        label: 'Faculty Appraisal',
        badge: '42',
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
            <circle cx="128" cy="140" r="40" opacity="0.2" />
            <path d="M196,216a68,68,0,0,0-136,0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <circle cx="128" cy="140" r="40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <path d="M197.82,168A52,52,0,0,0,232,216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <circle cx="196" cy="108" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <path d="M58.18,168A52,52,0,0,0,24,216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <circle cx="60" cy="108" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
          </svg>
        ),
      },
      {
        href: '/reports',
        label: 'Accreditation Reports',
        dotPulse: true,
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
            <path d="M200,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Z" opacity="0.2" />
            <polyline points="152 32 152 88 208 88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <line x1="96" y1="136" x2="160" y2="136" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <line x1="96" y1="168" x2="160" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <path d="M48,192V40a8,8,0,0,1,8-8h96l56,56v104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
          </svg>
        ),
      },
      {
        href: '/dean/history',
        label: 'Audit Logs',
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
            <path d="M208,40H48A8,8,0,0,0,40,48v64c0,72,88,104,88,104s88-32,88-104V48A8,8,0,0,0,208,40Z" opacity="0.2" />
            <path d="M208,40H48A8,8,0,0,0,40,48v64c0,72,88,104,88,104s88-32,88-104V48A8,8,0,0,0,208,40Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
            <polyline points="88 120 116 148 168 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
          </svg>
        ),
      },
    ],
  },
  student: {
    sectionTitle: 'Academic Navigation',
    roleTag: 'STUDENT',
    items: [
      {
        href: '/student',
        label: 'Dashboard',
        icon: <IconGaugeLine className="w-4 h-4" />,
      },
      {
        href: '/student/eval/cs214',
        label: 'Evaluate Faculty',
        badge: 'Active',
        icon: <IconClipboardLine className="w-4 h-4 text-primary" />,
      },
      {
        href: '/student#completed',
        label: 'My Evaluations',
        icon: <IconBookLine className="w-4 h-4" />,
      },
    ],
  },
  faculty: {
    sectionTitle: 'Faculty Navigation',
    roleTag: 'FACULTY',
    items: [
      {
        href: '/faculty',
        label: 'Appraisal Results',
        icon: <IconChartLine className="w-4 h-4" />,
      },
      {
        href: '/faculty#classes',
        label: 'Teaching Classes',
        badge: 'Active',
        icon: <IconUsersLine className="w-4 h-4" />,
      },
      {
        href: '/reports',
        label: 'Accreditation Dossier',
        dotPulse: true,
        icon: <IconBookLine className="w-4 h-4" />,
      },
    ],
  },
  admin: {
    sectionTitle: 'Executive Administration',
    roleTag: 'ADMIN',
    items: [
      {
        href: '/admin',
        label: 'Overview Control',
        icon: <IconGaugeLine className="w-4 h-4" />,
      },
      {
        href: '/admin?tab=users',
        label: 'User Directory',
        icon: <IconUsersLine className="w-4 h-4" />,
      },
      {
        href: '/admin?tab=semesters',
        label: 'Semesters & Periods',
        icon: <IconGearLine className="w-4 h-4" />,
      },
      {
        href: '/admin?tab=questions',
        label: 'Evaluation Rubrics',
        icon: <IconClipboardLine className="w-4 h-4" />,
      },
      {
        href: '/reports',
        label: 'Reports Center',
        icon: <IconChartLine className="w-4 h-4" />,
      },
    ],
  },
};

function useActiveCheck() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  return (href: string) => {
    if (href.includes('?tab=')) {
      const [base, query] = href.split('?tab=');
      return pathname === base && currentTab === query;
    }
    if (href.includes('#')) {
      return false;
    }
    return pathname === href && !currentTab;
  };
}

export function RailNav({ role, fullName }: { role: Role; fullName: string }) {
  const isActive = useActiveCheck();
  const [mobileOpen, setMobileOpen] = useState(false);

  const config = NAV_CONFIG[role] || NAV_CONFIG.student;
  const initials =
    fullName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CU';

  const roleSubtitle =
    role === 'dean'
      ? 'DEAN / EXEC'
      : role === 'student'
      ? 'BSCS-3A • CETC'
      : role === 'faculty'
      ? 'FACULTY / DEPT'
      : 'SYSADMIN';

  const displayName =
    role === 'dean' && (!fullName || fullName === 'User')
      ? 'Dr. Roberto Al-Rashid'
      : role === 'student' && (!fullName || fullName === 'User')
      ? 'Juan Dela Cruz'
      : fullName;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP APP BAR (< md)                                               */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-2.5 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-card border border-primary/40 flex items-center justify-center p-1.5 shadow-xs">
            <svg viewBox="0 0 48 48" className="w-full h-full text-primary" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" className="stroke-primary fill-primary/10" />
              <circle cx="24" cy="24" r="4.5" className="fill-primary stroke-none" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs text-foreground">CSU CETC</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/15 text-primary border border-primary/25">
                {config.roleTag}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">Cotabato State University</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE SLIDE-OVER DRAWER OVERLAY (< md)                                 */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border p-5 flex flex-col justify-between shadow-xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-card border border-primary/40 flex items-center justify-center p-1.5 shadow-xs">
                    <svg viewBox="0 0 48 48" className="w-full h-full text-primary" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" className="stroke-primary fill-primary/10" />
                      <circle cx="24" cy="24" r="4.5" className="fill-primary stroke-none" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-xs text-foreground">CSU CETC</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/15 text-primary border border-primary/25">
                        {config.roleTag}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Cotabato State Univ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-1.5">
                <div className="px-3 pb-2 text-[10px] tracking-wider text-muted-foreground/80 uppercase font-semibold">
                  {config.sectionTitle}
                </div>
                {config.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? 'text-primary' : 'text-muted-foreground'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground truncate">{displayName}</h4>
                  <span className="text-[9px] tracking-wider font-semibold text-primary bg-primary/15 px-1 py-0.5 rounded">
                    {roleSubtitle}
                  </span>
                </div>
              </div>
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconSignOutLine className="w-4 h-4" />
                  <span>Exit Session</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP PERMANENT W-64 SIDEBAR                                          */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-card border-r border-border flex-col justify-between fixed top-0 left-0 bottom-0 z-30 transition-all">
        {/* Top Brand Area */}
        <div className="p-5">
          {/* Logo & College Heading */}
          <Link href="/" className="flex items-center gap-3.5 pb-6 border-b border-border group">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center p-2 relative shadow-xs group-hover:border-primary/40 transition-colors">
              <svg viewBox="0 0 48 48" className="w-full h-full text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" className="stroke-primary fill-primary/10" />
                <line x1="24" y1="4" x2="24" y2="44" stroke="#D4D4D8" strokeWidth="1.8" />
                <line x1="6" y1="14" x2="42" y2="34" stroke="#D4D4D8" strokeWidth="1.8" />
                <line x1="6" y1="34" x2="42" y2="14" stroke="#D4D4D8" strokeWidth="1.8" />
                <circle cx="24" cy="24" r="4.5" className="fill-primary stroke-none" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm tracking-tight text-foreground">CSU CETC</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/15 text-primary border border-primary/25">
                  {config.roleTag}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 font-medium">Cotabato State University</p>
            </div>
          </Link>

          {/* Navigation Links Group */}
          <div className="mt-6 space-y-1">
            <div className="px-3 pb-2 text-[10px] tracking-wider text-muted-foreground/80 uppercase font-semibold">
              {config.sectionTitle}
            </div>

            {config.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs sm:text-[13px] transition-all duration-150 ${
                    active
                      ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground'}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.dotPulse && !active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Academic Session & Security Status */}
          <div className="mt-8 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>Academic Period</span>
              <span className="text-foreground font-semibold tabular-nums">AY 2026–2027</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              <span>{role === 'student' ? 'Evaluation Window Active' : 'Quorum & RLS Active'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Profile Card */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xs shadow-xs tracking-wider shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-foreground truncate">{displayName}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] tracking-wider font-semibold text-primary bg-primary/15 px-1 py-0.2 rounded">
                    {roleSubtitle}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <div className="flex items-center justify-end pt-2 border-t border-border">
            <form action={signOut} className="w-full">
              <button
                type="submit"
                className="w-full text-[11px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors font-medium py-1.5 rounded-lg hover:bg-muted"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Exit Session</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
