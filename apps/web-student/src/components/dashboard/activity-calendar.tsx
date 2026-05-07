'use client';

import { CalendarDays } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type LearningProgressSummary } from '@/lib/progress-api';

interface ActivityCalendarProps {
  activityCalendar: LearningProgressSummary['activityCalendar'];
}

export function ActivityCalendar({ activityCalendar }: ActivityCalendarProps) {
  const locale = useLocale();
  const t = useTranslations('Student');
  const hasActivity = activityCalendar.some(
    (entry) => entry.sessions > 0 || entry.completedLessons > 0 || entry.timeSpentSeconds > 0,
  );

  return (
    <section className="mt-8 border-t pt-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('dashboard.activityCalendar')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.activityCalendarDesc')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <LegendDot className="bg-primary" label={t('dashboard.activityOpened')} />
          <LegendDot className="bg-emerald-500" label={t('dashboard.activityCompleted')} />
          <LegendDot className="bg-amber-500" label={t('dashboard.activitySpent')} />
        </div>
      </div>

      {!hasActivity ? (
        <div className="mt-5 rounded-md border border-dashed p-5 text-sm text-muted-foreground">
          {t('dashboard.activityCalendarEmpty')}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {activityCalendar.map((entry) => {
            const totalTouches = entry.sessions + entry.completedLessons;
            const intensityClass =
              totalTouches >= 6
                ? 'bg-primary text-primary-foreground'
                : totalTouches >= 3
                  ? 'bg-primary/15 text-foreground'
                  : totalTouches > 0
                    ? 'bg-muted/50 text-foreground'
                    : 'bg-background text-muted-foreground';
            const minutesSpent = Math.round(entry.timeSpentSeconds / 60);

            return (
              <article key={entry.date} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {new Intl.DateTimeFormat(locale, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(`${entry.date}T00:00:00Z`))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${intensityClass}`}>
                    {totalTouches}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <Metric label={t('dashboard.activityOpened')} value={entry.sessions} />
                  <Metric label={t('dashboard.activityCompleted')} value={entry.completedLessons} />
                  <Metric label={t('dashboard.activitySpent')} value={`${minutesSpent}m`} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-sm bg-muted/40 px-2 py-2 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
