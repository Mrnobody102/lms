'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSrsStats } from '@/hooks/use-srs';

export function SrsStatsChart({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations('Student.srs.stats');
  const { data: stats, isLoading } = useSrsStats(30, enabled);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
        {t('empty')}
      </div>
    );
  }

  const chartData = stats.map((stat) => {
    const date = new Date(stat.date);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: stat.count,
    };
  });

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold">{t('title')}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            />
            <Bar
              dataKey="count"
              fill="currentColor"
              className="fill-primary"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
