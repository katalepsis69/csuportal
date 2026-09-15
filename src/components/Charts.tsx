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

/* CSU CETC verified chart tokens */
const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#6FA86F',
  neutral: '#B58A3C',
  negative: '#C9615A',
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

  if (data.length === 0)
    return <p className="py-6 text-center text-sm text-cream-faint">No evaluation sentiment recorded yet</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((d) => (
            <Cell
              key={d.name}
              fill={SENTIMENT_COLORS[d.name.toLowerCase()]}
              stroke="var(--canvas)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--panel)',
            borderColor: 'var(--subtle)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            color: 'var(--cream)',
            fontSize: '13px',
            fontWeight: 600,
          }}
          itemStyle={{ color: 'var(--cream)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AvgBar({
  data,
  domainMax = 5,
  height = 200,
}: {
  data: { name: string; value: number | null }[];
  domainMax?: number;
  height?: number;
}) {
  const rows = data.map((d) => ({ name: d.name, value: d.value ?? 0 }));
  if (rows.length === 0)
    return <p className="py-6 text-center text-sm text-cream-faint">No criteria data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--subtle)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--cream-muted)' }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis domain={[0, domainMax]} tick={{ fontSize: 11, fill: 'var(--cream-muted)' }} />
        <Tooltip
          cursor={{ fill: 'rgba(216,106,18,0.06)' }}
          contentStyle={{
            background: 'var(--panel)',
            borderColor: 'var(--subtle)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            color: 'var(--cream)',
            fontSize: '13px',
            fontWeight: 600,
          }}
          itemStyle={{ color: 'var(--cream)' }}
        />
        <Bar dataKey="value" fill="var(--brand)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
