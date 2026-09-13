'use client';

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

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#16a34a',
  neutral: '#94a3b8',
  negative: '#dc2626',
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
    return <p className="py-8 text-center text-sm text-slate-400">No data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
          {data.map((d) => (
            <Cell key={d.name} fill={SENTIMENT_COLORS[d.name.toLowerCase()]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AvgBar({
  data,
  domainMax = 5,
  height = 260,
}: {
  data: { name: string; value: number | null }[];
  domainMax?: number;
  height?: number;
}) {
  const rows = data.map((d) => ({ name: d.name, value: d.value ?? 0 }));
  if (rows.length === 0)
    return <p className="py-8 text-center text-sm text-slate-400">No data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[0, domainMax]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
