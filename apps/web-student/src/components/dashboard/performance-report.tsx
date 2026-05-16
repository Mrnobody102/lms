'use client';

import { usePerformance } from '@/hooks/use-performance';
import { useTranslations } from 'next-intl';
import { BarChart3, BrainCircuit, TrendingUp } from 'lucide-react';
import { cn } from '@repo/ui';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export function PerformanceReport() {
  const t = useTranslations('Student');
  const { data, isLoading, error } = usePerformance();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
      </div>
    );
  }

  if (error || !data) return null;

  // If no data yet
  if (data.accuracyByUnit.length === 0 && data.accuracyBySkill.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-lg mb-1">{t('dashboard.noPerformanceData')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('dashboard.noPerformanceDataDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Accuracy By Unit */}
      <section className="p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">{t('dashboard.accuracyByUnit')}</h3>
              <p className="text-xs text-muted-foreground">{t('dashboard.accuracyByUnitDesc')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.accuracyByUnit.map((unit) => (
            <div key={unit.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="min-w-0 truncate pr-4 font-medium">{unit.title}</span>
                <span className="font-bold text-primary">{unit.accuracy}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 ease-out',
                    unit.accuracy >= 80
                      ? 'bg-success'
                      : unit.accuracy >= 50
                        ? 'bg-primary'
                        : 'bg-warning',
                  )}
                  style={{ width: `${unit.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skill Mastery */}
      <section className="p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">{t('dashboard.skillMastery')}</h3>
              <p className="text-xs text-muted-foreground">{t('dashboard.skillMasteryDesc')}</p>
            </div>
          </div>
        </div>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.accuracyBySkill}>
              <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
              <PolarAngleAxis
                dataKey="skill"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
              />
              <Radar
                name={t('dashboard.accuracyBySkill')}
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
