'use client';

import React, { useMemo } from 'react';

import { useTranslations } from 'next-intl';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useActivityTrend } from '@/hooks/use-reports';
import type { TrendReportFilters } from '@/lib/reports-api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ActivityTrendPanelProps {
  filters?: TrendReportFilters;
}

export function ActivityTrendPanel({ filters = {} }: ActivityTrendPanelProps) {
  const t = useTranslations('Admin');
  const { data, isLoading } = useActivityTrend(filters);

  const { chartData, lines } = useMemo(() => {
    if (!data?.series?.length) return { chartData: [], lines: [] };

    const map = new Map<string, Record<string, string | number>>();
    const lines: { cohortId: string; cohortName: string }[] = [];

    data.series.forEach((s) => {
      lines.push({ cohortId: s.cohortId, cohortName: s.cohortName });
      s.trend.forEach((t) => {
        let bucket = map.get(t.date);
        if (!bucket) {
          bucket = { date: t.date };
          map.set(t.date, bucket);
        }
        bucket[`opened_${s.cohortId}`] = t.opened;
        bucket[`completed_${s.cohortId}`] = t.completed;
      });
    });
    return {
      chartData: Array.from(map.values()).sort((a, b) =>
        (a.date as string).localeCompare(b.date as string),
      ),
      lines,
    };
  }, [data]);

  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LineChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t('reports.activityTrend')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.activityTrendDesc')}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('reports.noData')}</p>
      ) : (
        <div className="w-full h-[300px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
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
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: 14 }} />
              {lines.map((l, i) => {
                const isMulti = lines.length > 1;
                const openedColor = isMulti
                  ? `hsl(${(i * 137) % 360}, 70%, 60%)`
                  : 'hsl(var(--primary))';
                const completedColor = isMulti
                  ? `hsl(${(i * 137) % 360}, 70%, 40%)`
                  : 'hsl(var(--success, 142.1 76.2% 36.3%))';
                const nameSuffix = isMulti ? ` (${l.cohortName})` : '';
                return (
                  <React.Fragment key={l.cohortId}>
                    <Bar
                      name={`${t('reports.activityOpened')}${nameSuffix}`}
                      dataKey={`opened_${l.cohortId}`}
                      fill={openedColor}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name={`${t('reports.activityCompleted')}${nameSuffix}`}
                      dataKey={`completed_${l.cohortId}`}
                      fill={completedColor}
                      radius={[4, 4, 0, 0]}
                    />
                  </React.Fragment>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
