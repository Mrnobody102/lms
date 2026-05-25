'use client';

import React, { useMemo } from 'react';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { useMasteryTrend } from '@/hooks/use-reports';
import type { ReportFilters } from '@/lib/reports-api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MeasuredChart } from './measured-chart';

interface TrendReportPanelProps {
  filters?: ReportFilters & { days?: number };
}

export function TrendReportPanel({ filters = {} }: TrendReportPanelProps) {
  const t = useTranslations('Admin');
  const { data, isLoading } = useMasteryTrend(filters);

  const { chartData, lines } = useMemo(() => {
    if (!data?.series?.length) return { chartData: [], lines: [] };

    const map = new Map<string, Record<string, string | number>>();
    const lines: { key: string; name: string }[] = [];

    const isMulti = data.series.length > 1;

    data.series.forEach((s) => {
      const skillCodes = new Set<string>();
      s.trend.forEach((day) => {
        Object.keys(day).forEach((key) => {
          if (key !== 'date') skillCodes.add(key);
        });
      });

      skillCodes.forEach((code) => {
        lines.push({
          key: `${code}_${s.cohortId}`,
          name: isMulti ? `${code} (${s.cohortName})` : code,
        });
      });

      s.trend.forEach((t) => {
        const dateStr = t.date as string;
        let bucket = map.get(dateStr);
        if (!bucket) {
          bucket = { date: dateStr };
          map.set(dateStr, bucket);
        }
        Object.keys(t).forEach((k) => {
          if (k !== 'date') bucket[`${k}_${s.cohortId}`] = t[k];
        });
      });
    });
    return {
      chartData: Array.from(map.values()).sort((a, b) =>
        (a.date as string).localeCompare(b.date as string),
      ),
      lines,
    };
  }, [data]);

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
            <h3 className="text-sm font-semibold">{t('reports.masteryTrend')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.masteryTrendDesc')}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : chartData.length === 0 || lines.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('reports.noData')}</p>
      ) : (
        <MeasuredChart className="w-full h-[300px] mt-6">
          {({ height, width }) => (
            <LineChart
              data={chartData}
              height={height}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              width={width}
            >
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
              {lines.map((l, index) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={l.name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </MeasuredChart>
      )}
    </div>
  );
}
