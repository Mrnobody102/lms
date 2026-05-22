'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { useMasteryTrend } from '@/hooks/use-reports';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendReportPanelProps {
  filters?: { cohortId?: string };
}

export function TrendReportPanel({ filters = {} }: TrendReportPanelProps) {
  const t = useTranslations('Admin');
  const { data, isLoading } = useMasteryTrend(filters);

  // Extract all unique skill codes to generate lines dynamically
  const skillCodes = new Set<string>();
  if (data?.trend) {
    data.trend.forEach((day) => {
      Object.keys(day).forEach((key) => {
        if (key !== 'date') skillCodes.add(key);
      });
    });
  }

  // Define a color palette for the lines
  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--destructive))',
    'hsl(var(--success, 142.1 76.2% 36.3%))',
    '#eab308', // yellow-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
  ];

  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {t('reports.masteryTrend', { fallback: 'Skill Mastery Trend' })}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('reports.masteryTrendDesc', {
                fallback: 'Average mastery per skill over the last 7 days.',
              })}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data || data.trend.length === 0 || skillCodes.size === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t('reports.noData', { fallback: 'No data available' })}
        </p>
      ) : (
        <div className="w-full h-[300px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
                itemStyle={{ fontSize: 13 }}
                cursor={{ stroke: 'hsl(var(--muted))' }}
                formatter={(value) => [`${value}%`]}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: 14 }} />
              {Array.from(skillCodes).map((code, index) => (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  name={code}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
