'use client';

import React from 'react';
import {
  IconChartPie,
  IconUsers,
  IconFileText,
  IconGear,
  IconGauge,
  IconClipboardText,
  IconSignOut,
} from '@/components/icons';

// Semantic icon aliases matching the existing export contract
export const IconChartLine = IconChartPie;
export const IconUsersLine = IconUsers;
export const IconBookLine = IconFileText;
export const IconGearLine = IconGear;
export const IconGaugeLine = IconGauge;
export const IconClipboardLine = IconClipboardText;
export const IconSignOutLine = IconSignOut;

export function IconSearchLine({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconDotsLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

// --- Stat Card Component for Production Dashboard KPIs ---
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
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 relative flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/80">
          {metric.icon ?? <IconUsers className="h-4 w-4" />}
        </div>
        {metric.trend && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              metric.trendPositive
                ? 'bg-positive/10 text-positive border-positive/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            {metric.trend}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {metric.label}
        </p>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground font-display tabular-nums">
            {metric.value}
          </span>
        </div>
        {metric.sublabel && (
          <p className="mt-1 text-xs text-muted-foreground font-normal">
            {metric.sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Main Scaffold Layout ---
export function StaffScaffold({
  breadcrumb = ['CSU CETC Portal', 'Dashboard'],
  title,
  subtitle,
  actionButton,
  metrics,
  children,
}: {
  breadcrumb?: string[];
  title: string;
  subtitle: string;
  actionButton?: React.ReactNode;
  metrics?: StatMetric[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-6">
      {/* Top Utility Bar (Breadcrumb & Audited Badge) */}
      <div className="flex items-center justify-between pb-1 text-xs">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-muted-foreground/40">/</span>}
              <span className={idx === breadcrumb.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-0.5 text-[10px] font-semibold text-positive border border-positive/25">
          <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
          Audited &amp; Sealed
        </span>
      </div>

      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {actionButton && <div className="shrink-0">{actionButton}</div>}
      </div>

      {/* Metric Bento Summary Grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, idx) => (
            <StaffStatCard key={idx} metric={m} />
          ))}
        </div>
      )}

      {/* Main Body Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
