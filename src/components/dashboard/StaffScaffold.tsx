'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/auth';

// --- Pure SVG Line Icons (1.5px stroke, zero emojis, Web Interface Guidelines compliant) ---

export function IconGaugeLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 14v-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function IconUsersLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconBookLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function IconChartLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function IconGearLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function IconSearchLine({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconDotsLine({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

export function IconHelpLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// --- Dynamic SVG Sparkline Curve ---
export function Sparkline({
  color = '#D86A12',
  points = [12, 18, 14, 22, 19, 28, 25, 30],
}: {
  color?: string;
  points?: number[];
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const height = 30;
  const width = 90;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  const pathD = coords.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cpx = (prev.x + curr.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const lastPoint = coords[coords.length - 1];

  return (
    <svg className="h-8 w-24 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <path d={pathD} stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
    </svg>
  );
}

// --- Stat Card Component ---
export type StatMetric = {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: string;
  trendPositive?: boolean;
  color?: string;
  sparkline?: number[];
  icon?: React.ReactNode;
};

export function StaffStatCard({
  metric,
}: {
  metric: StatMetric;
}) {
  const color = metric.color ?? '#D86A12';
  return (
    <div className="rounded-2xl border border-subtle bg-bg2/95 p-4 sm:p-5 shadow-md hover:border-brand/40 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-panel border border-subtle text-cream-dim">
          {metric.icon ?? <IconUsersLine className="h-4 w-4" />}
        </div>
        <Sparkline color={color} points={metric.sparkline} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-cream-muted">{metric.label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-cream font-mono tabular-nums">
            {metric.value}
          </span>
          {metric.trend && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                metric.trendPositive !== false
                  ? 'bg-positive/15 text-positive border border-positive/30'
                  : 'bg-negative/15 text-negative border border-negative/30'
              }`}
            >
              {metric.trend}
            </span>
          )}
        </div>
        {metric.sublabel && <p className="mt-1 text-xs text-cream-faint">{metric.sublabel}</p>}
      </div>
    </div>
  );
}

// --- Main Scaffold Layout ---
export function StaffScaffold({
  role,
  breadcrumb = ['CSU CETC Portal', 'Dashboard'],
  title,
  subtitle,
  actionButton,
  metrics,
  children,
}: {
  role: Role;
  breadcrumb?: string[];
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
  metrics?: StatMetric[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { href: role === 'admin' ? '/admin' : role === 'dean' ? '/dean' : '/faculty', label: 'Dashboard', icon: <IconGaugeLine /> },
    { href: '/admin?tab=users', label: 'Users Directory', icon: <IconUsersLine />, roleOnly: ['admin'] },
    { href: '/dean/history', label: 'History & Archive', icon: <IconBookLine />, roleOnly: ['dean', 'admin'] },
    { href: '/reports', label: 'Reports & PDF', icon: <IconChartLine />, roleOnly: ['dean', 'admin'] },
    { href: '/admin?tab=semesters', label: 'System Control', icon: <IconGearLine />, roleOnly: ['admin'] },
  ].filter((item) => !item.roleOnly || item.roleOnly.includes(role));

  return (
    <div className="flex gap-4 lg:gap-6 min-h-[calc(100vh-5rem)]">
      {/* Left Floating Pill Rail Navigation */}
      <aside className="hidden md:flex flex-col justify-between items-center w-14 rounded-2xl border border-subtle bg-bg2/90 py-4 shadow-xl shrink-0 self-start sticky top-20">
        <div className="flex flex-col items-center gap-4">
          <img src="/csu-cetc-logo.png" alt="CSU CETC" className="h-7 w-7 object-contain drop-shadow" />
          <div className="h-px w-8 bg-subtle/80 my-1" />
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href.includes('?') && pathname + window?.location?.search === link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                aria-label={link.label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-brand text-canvas shadow-sm font-bold'
                    : 'text-cream-muted hover:text-cream hover:bg-panel'
                }`}
              >
                {link.icon}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3 pt-4 border-t border-subtle/80 w-full">
          <Link
            href="/login"
            title="Portal Switch"
            aria-label="Switch Portal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-cream-muted hover:text-cream hover:bg-panel transition-colors"
          >
            <IconHelpLine className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Main Scaffold Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Top Utility Bar (Breadcrumbs, Search Hint, Active Period Pill) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-subtle bg-bg2/90 px-4 py-3 shadow-md">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-cream-muted">
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="text-cream-faint">/</span>}
                <span className={idx === breadcrumb.length - 1 ? 'font-semibold text-cream' : 'text-cream-muted'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>

          {/* Right Utility Badges */}
          <div className="flex items-center gap-3">
            {/* Keyboard Search Hint */}
            <div className="hidden lg:flex items-center gap-2 rounded-lg bg-panel px-2.5 py-1 text-xs text-cream-muted border border-subtle/80">
              <IconSearchLine className="h-3.5 w-3.5" />
              <span>Search portal</span>
              <kbd className="rounded bg-bg2 px-1.5 py-0.5 text-[10px] font-mono text-cream-dim border border-subtle">
                ⌘ K
              </kbd>
            </div>

            {/* Academic Term Indicator */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1 text-xs font-semibold text-brand-text border border-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              AY 2026–2027 Active
            </span>
          </div>
        </div>

        {/* Action Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-cream" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-cream-muted mt-0.5">{subtitle}</p>
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>

        {/* 4 Stat Metric Cards */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <StaffStatCard key={i} metric={m} />
            ))}
          </div>
        )}

        {/* Main Content / Table Slot */}
        <div className="rounded-2xl border border-subtle bg-bg2/95 shadow-xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
