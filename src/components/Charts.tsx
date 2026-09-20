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
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const data = [
    { name: 'Positive', value: counts.positive ?? 0 },
    { name: 'Neutral', value: counts.neutral ?? 0 },
    { name: 'Negative', value: counts.negative ?? 0 },
  ].filter((d) => d.value > 0);

  const total = (counts.positive ?? 0) + (counts.neutral ?? 0) + (counts.negative ?? 0);
  const posPct = total > 0 ? Math.round(((counts.positive ?? 0) / total) * 100) : 0;

  if (data.length === 0)
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No evaluation sentiment recorded yet
      </div>
    );

  const activeItem = activeIndex !== null ? data[activeIndex] : null;
  const displayPct =
    activeItem && total > 0 ? Math.round((activeItem.value / total) * 100) : posPct;
  const displayLabel = activeItem ? activeItem.name : 'Positive';

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
            paddingAngle={data.length > 1 ? 3 : 0}
            strokeWidth={0}
            isAnimationActive={false}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((d, index) => {
              const isHovered = activeIndex === index;
              const isAnyHovered = activeIndex !== null;
              return (
                <Cell
                  key={d.name}
                  fill={SENTIMENT_COLORS[d.name.toLowerCase()]}
                  fillOpacity={!isAnyHovered ? 1 : isHovered ? 1 : 0.4}
                  stroke={isHovered ? 'var(--card)' : 'transparent'}
                  strokeWidth={isHovered ? 2 : 0}
                  className="transition-opacity duration-150 cursor-pointer outline-none"
                />
              );
            })}
          </Pie>
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const pct = total > 0 ? Math.round(((Number(item.value) || 0) / total) * 100) : 0;
                return (
                  <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-lg text-xs pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: SENTIMENT_COLORS[String(item.name).toLowerCase()] }}
                      />
                      <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground font-medium">
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

      {/* Donut Center Display (Interactive HUD) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
        <span className="text-xl font-extrabold text-foreground tabular-nums leading-none font-display transition-all duration-150">
          {displayPct}%
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 transition-all duration-150">
          {displayLabel}
        </span>
      </div>
    </div>
  );
}
