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

// --- Dynamic SVG Sparkline with Resilient Math and Area Gradient ---
export function Sparkline({
  color = 'var(--primary)',
  points = [],
}: {
  color?: string;
  points?: number[];
}) {
  const rawId = React.useId();
  const gradId = `spark-${rawId.replace(/:/g, '')}`;
  const width = 96;
  const height = 32;

  // Ponytail: clean resilient math, handles 0, 1, or empty series without NaN
  const data = points.length === 0 ? [0, 0] : points.length === 1 ? [points[0], points[0]] : points;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || (max > 0 ? max : 1);

  const coords = data.map((p, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = min === max
      ? height / 2
      : height - ((p - min) / range) * (height - 12) - 6;
    return { x, y };
  });

  const pathD = coords.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cpx = (prev.x + curr.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = coords[coords.length - 1];

  return (
    <svg className="h-8 w-24 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={color} />
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
  const color = metric.color ?? 'var(--primary)';

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/30 relative flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/80">
          {metric.icon ?? <IconUsers className="h-4 w-4" />}
        </div>
        {metric.sparkline && (
          <Sparkline color={color} points={metric.sparkline} />
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {metric.label}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground font-display tabular-nums">
            {metric.value}
          </span>
          {metric.trend && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                metric.trendPositive !== false
                  ? 'bg-positive/10 text-positive border-positive/25'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  metric.trendPositive !== false ? 'bg-positive' : 'bg-muted-foreground'
                }`}
              />
              {metric.trend}
            </span>
          )}
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
