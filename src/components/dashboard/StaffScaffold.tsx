'use client';

import React, { useId } from 'react';

// --- Semantic Feather/Phosphor Duotone Icons for Role Dashboards ---
export function IconChartLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

export function IconUsersLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconBookLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  );
}

export function IconGearLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

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

export function IconGaugeLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function IconClipboardLine({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
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

// --- Dynamic SVG Sparkline Curve with Area Gradient ---
export function Sparkline({
  color = '#D86A12',
  points = [12, 18, 14, 22, 19, 28, 25, 30],
}: {
  color?: string;
  points?: number[];
}) {
  const rawId = useId();
  const gradId = `spark-${rawId.replace(/:/g, '')}`;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const height = 32;
  const width = 96;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 10) - 5;
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
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
    </svg>
  );
}

// --- Stat Card Component with Specular Rim & Ambient Glow ---
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
    <div className="@container rounded-2xl border border-subtle/80 bg-panel/75 backdrop-blur-xl p-5 shadow-beautiful-sm hover:border-brand/40 transition-all duration-300 relative overflow-hidden group amber-glow-box">
      {/* Specular 1px Top Rim Reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Ambient background glow */}
      <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-brand/8 blur-2xl pointer-events-none group-hover:bg-brand/15 transition-colors" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel2/80 border border-brand/20 text-brand shadow-sm group-hover:scale-105 transition-transform">
          {metric.icon ?? <IconUsersLine className="h-4 w-4" />}
        </div>
        <Sparkline color={color} points={metric.sparkline} />
      </div>

      <div className="mt-4 relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cream-muted font-mono">
          {metric.label}
        </p>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-cream font-display tabular-nums">
            {metric.value}
          </span>
          {metric.trend && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono border ${
                metric.trendPositive !== false
                  ? 'bg-positive/15 text-positive border-positive/30'
                  : 'bg-negative/15 text-negative border-negative/30'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${metric.trendPositive !== false ? 'bg-positive' : 'bg-negative'}`} />
              {metric.trend}
            </span>
          )}
        </div>
        {metric.sublabel && (
          <p className="mt-1 text-xs text-cream-faint font-medium">{metric.sublabel}</p>
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
      {/* Top Utility Bar (Breadcrumb in frosted glass) */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 shadow-beautiful-sm border border-subtle/80 flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-cream-muted font-mono">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-cream-faint">/</span>}
              <span className={idx === breadcrumb.length - 1 ? 'font-semibold text-cream' : 'text-cream-muted'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>

        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-positive border border-positive/25">
          <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
          Audited & Sealed
        </span>
      </div>

      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-subtle/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cream font-display">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-cream-muted mt-0.5">{subtitle}</p>
        </div>
        {actionButton && <div className="shrink-0">{actionButton}</div>}
      </div>

      {/* Metric Bento Summary Grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, idx) => (
            <StaffStatCard key={idx} metric={m} />
          ))}
        </div>
      )}

      {/* Main Body Content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
