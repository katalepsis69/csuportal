'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  History,
  Menu,
  X,
  ClipboardList,
  PieChart,
  Gauge,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from '@/lib/actions/auth';
import type { Role } from '@/lib/auth';

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
        icon: <LayoutDashboard className="w-4 h-4 text-primary" />,
      },
      {
        href: '/reports',
        label: 'Accreditation Reports',
        dotPulse: true,
        icon: <FileSpreadsheet className="w-4 h-4" />,
      },
      {
        href: '/dean/history',
        label: 'Audit Logs',
        icon: <History className="w-4 h-4" />,
      },
    ],
  },
  student: {
    sectionTitle: 'Academic Navigation',
    roleTag: 'STUDENT',
    items: [
      {
        href: '/student',
        label: 'Evaluation Dashboard',
        badge: 'Active',
        icon: <ClipboardList className="w-4 h-4 text-primary" />,
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
        icon: <PieChart className="w-4 h-4" />,
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
        icon: <Gauge className="w-4 h-4" />,
      },
      {
        href: '/admin?tab=users',
        label: 'User Directory',
        icon: <Users className="w-4 h-4" />,
      },
      {
        href: '/admin?tab=semesters',
        label: 'Semesters & Periods',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        href: '/admin?tab=questions',
        label: 'Evaluation Rubrics',
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        href: '/reports',
        label: 'Reports Center',
        icon: <PieChart className="w-4 h-4" />,
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
      ? 'STUDENT • CETC'
      : role === 'faculty'
      ? 'FACULTY / DEPT'
      : 'SYSADMIN';

  const displayName =
    fullName && fullName !== 'User'
      ? fullName
      : role === 'dean'
      ? "Dean's Office"
      : role === 'faculty'
      ? 'Faculty Member'
      : role === 'student'
      ? 'Student'
      : 'Administrator';

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
            aria-label="Open navigation menu"
            className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center rounded-lg border border-border bg-card text-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
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
                  aria-label="Close navigation menu"
                  className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
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
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
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
                className="w-full text-[11px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors font-medium py-1.5 rounded-lg hover:bg-muted cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exit Session</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
