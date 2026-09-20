'use client';

import React from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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
                  <div className="rounded-xl border border-border bg-card/95 backdrop-blur-xl p-2.5 shadow-md text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: SENTIMENT_COLORS[String(item.name).toLowerCase()] }}
                      />
                      <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground tabular-nums">{item.value}</span> responses ({pct}%)
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
        <span className="text-xl font-extrabold text-foreground tabular-nums leading-none">
          {posPct}%
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
          Positive
        </span>
      </div>
    </div>
  );
}
