'use client';

import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useCourseMetrics } from '@/hooks/use-progress';
import { BarChart3 } from 'lucide-react';

export function CourseComparisonChart() {
  const t = useTranslations('Student.dashboard');
  const { data, isLoading, error } = useCourseMetrics();

  if (isLoading) {
    return <div className="h-80 rounded-2xl bg-card animate-pulse border border-border/50" />;
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  // Use the available colors
  const completionColor = '#3b82f6'; // blue-500
  const masteryColor = '#10b981'; // emerald-500
  const timeColor = '#f59e0b'; // amber-500

  return (
    <section className="rounded-2xl bg-card border border-border/50 p-5 sm:p-6">
      <header className="mb-6 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{t('courseComparison')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('courseComparisonDesc')}</p>
        </div>
      </header>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="courseName"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} iconType="circle" />
            <Bar
              dataKey="completionPercentage"
              name={t('comparisonCompletion')}
              fill={completionColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="mastery"
              name={t('comparisonMastery')}
              fill={masteryColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="timeSpentMinutes"
              name={t('comparisonTime')}
              fill={timeColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
