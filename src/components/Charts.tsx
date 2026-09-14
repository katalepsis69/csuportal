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

/* CSU CETC chart tokens */
const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#6FA86F',
  neutral: '#B58A3C',
  negative: '#B0453D',
};
const GRID = 'rgba(245,240,232,0.08)';
const TICK = { fontSize: 11, fill: '#A99D8D' };

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
    return <p className="py-6 text-center text-sm text-cream-faint">No data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
          {data.map((d) => (
            <Cell key={d.name} fill={SENTIMENT_COLORS[d.name.toLowerCase()]} stroke="#171310" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#1F1A15',
            border: '1px solid rgba(245,240,232,0.1)',
            borderRadius: 8,
            color: '#F5F0E8',
          }}
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
    return <p className="py-6 text-center text-sm text-cream-faint">No data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis dataKey="name" tick={TICK} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis domain={[0, domainMax]} tick={TICK} />
        <Tooltip
          cursor={{ fill: 'rgba(245,240,232,0.04)' }}
          contentStyle={{
            background: '#1F1A15',
            border: '1px solid rgba(245,240,232,0.1)',
            borderRadius: 8,
            color: '#F5F0E8',
          }}
        />
        <Bar dataKey="value" fill="#D86A12" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
