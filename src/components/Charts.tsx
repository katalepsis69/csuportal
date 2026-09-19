'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* CSU CETC chart palette (MASTER.md v2): muted, no gradients */
const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#15803D',
  neutral: '#A1A1AA',
  negative: '#DC2626',
};

export function SentimentPie({
  counts,
}: {
  counts: { positive: number; neutral: number; negative: number };
}) {
  const data = [
    { name: 'Positive', value: counts.positive ?? 0 },
    { name: 'Neutral', value: counts.neutral ?? 0 },
    { name: 'Negative', value: counts.negative ?? 0 },
  ].filter((d) => d.value > 0);

  const total = (counts.positive ?? 0) + (counts.neutral ?? 0) + (counts.negative ?? 0);
  const posPct = total > 0 ? Math.round(((counts.positive ?? 0) / total) * 100) : 0;

  if (data.length === 0)
    return (
      <div className="py-8 text-center text-xs text-zinc-400">
        No evaluation sentiment recorded yet
      </div>
    );

  return (
    <div className="relative w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={78}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={SENTIMENT_COLORS[d.name.toLowerCase()]}
                className="transition-transform duration-200 hover:scale-105"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const pct = total > 0 ? Math.round(((Number(item.value) || 0) / total) * 100) : 0;
                return (
                  <div className="rounded-xl border border-subtle bg-panel/95 backdrop-blur-xl p-2.5 shadow-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: SENTIMENT_COLORS[String(item.name).toLowerCase()] }}
                      />
                      <span className="font-semibold text-cream">{item.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-cream-muted">
                      <span className="font-bold text-cream tabular-nums">{item.value}</span> responses ({pct}%)
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Donut Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-extrabold text-cream tabular-nums leading-none">
          {posPct}%
        </span>
        <span className="text-[10px] text-cream-muted uppercase tracking-wider mt-0.5">
          Positive
        </span>
      </div>
    </div>
  );
}

export function AvgBar({
  data,
  domainMax = 5,
  height = 220,
}: {
  data: { name: string; value: number | null }[];
  domainMax?: number;
  height?: number;
}) {
  const rows = data.map((d) => ({ name: d.name, value: d.value ?? 0 }));

  if (rows.length === 0)
    return (
      <div className="py-8 text-center text-xs text-cream-faint">
        No criteria metrics available
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ left: -24, right: 12, top: 12, bottom: 8 }}>
        {/* Hairline horizontal gridlines only (no vertical clutter) */}
        <CartesianGrid strokeDasharray="3 3" stroke="var(--subtle)" vertical={false} />

        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--cream-muted)' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={32}
        />
        <YAxis
          domain={[0, domainMax]}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          ticks={[1, 2, 3, 4, 5]}
        />
        <Tooltip
          cursor={{ fill: 'rgba(127, 29, 29, 0.06)' }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const val = payload[0].value;
              return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs text-xs">
                  <div className="font-semibold text-foreground">{label}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-primary font-bold text-sm">
                    <span className="tabular-nums">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">/ {domainMax}.00</span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 2, 2]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
