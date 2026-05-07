'use client';

import { usePerformance } from '@/hooks/use-performance';
import { useTranslations } from 'next-intl';
import { BarChart3, BrainCircuit, TrendingUp } from 'lucide-react';
import { cn } from '@repo/ui';

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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {data.accuracyBySkill.map((skill) => (
            <div
              key={skill.skill}
              className="p-4 rounded-xl bg-muted/30 border border-border/30 flex flex-col items-center text-center group/skill"
            >
              <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-muted fill-none"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className={cn(
                      'fill-none transition-all duration-1000 ease-out',
                      skill.accuracy >= 80
                        ? 'stroke-success'
                        : skill.accuracy >= 50
                          ? 'stroke-orange-500'
                          : 'stroke-destructive',
                    )}
                    strokeWidth="4"
                    strokeDasharray="175.9"
                    strokeDashoffset={175.9 - (175.9 * skill.accuracy) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black">
                  {skill.accuracy}%
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover/skill:text-foreground transition-colors">
                {skill.skill}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
