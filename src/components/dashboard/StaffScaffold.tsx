'use client';

import React from 'react';

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

export function IconClipboardLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

export function IconSignOutLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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
    <svg className="h-7 w-20 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
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
    <div className="rounded-xl border border-subtle bg-bg2/95 p-3 shadow-md hover:border-brand/40 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel border border-subtle text-cream-dim">
          {metric.icon ?? <IconUsersLine className="h-4 w-4" />}
        </div>
        <Sparkline color={color} points={metric.sparkline} />
      </div>

      <div className="mt-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-cream-muted">{metric.label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-cream font-mono tabular-nums">
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
    <div className="min-w-0 space-y-3">
      {/* Top Utility Bar (Breadcrumb) */}
      <div className="rounded-xl border border-subtle bg-bg2/90 px-3 py-2 shadow-md">
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
      </div>

        {/* Action Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-cream" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-cream-muted mt-0.5">{subtitle}</p>
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>

        {/* 4 Stat Metric Cards */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
  );
}
