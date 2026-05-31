'use client';

import { CalendarDays, Clock3, MonitorPlay, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Badge } from '@/components/ui';
import { useCourseRuns } from '@/hooks/use-course-runs';
import type { CourseRunSummary } from '@/lib/course-run-api';

export default function CourseRunsPage() {
  const t = useTranslations('Admin.courseRuns');
  const locale = useLocale();
  const { data: runs = [], isLoading, isError } = useCourseRuns();

  return (
    <AuthGuard requiredCapability="class:read">
      <div className="min-h-screen bg-background md:flex">
        <AdminSidebar />
        <main className="flex-1 p-6 md:ml-[var(--admin-sidebar-width)] lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AdminHeader title={t('title')} description={t('description')} />

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-52 animate-pulse rounded-xl border bg-muted/30" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
                {t('loadError')}
              </div>
            ) : runs.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-20 text-center">
                <CalendarDays className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('emptyTitle')}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {t('emptyDescription')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {runs.map((run) => (
                  <CourseRunCard key={run.id} locale={locale} run={run} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function CourseRunCard({ locale, run }: { locale: string; run: CourseRunSummary }) {
  const t = useTranslations('Admin.courseRuns');
  const startsAt = run.startsAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(run.startsAt),
      )
    : t('notScheduled');

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {run.course.languageCode?.toUpperCase() || t('classLabel')}
            {run.course.proficiencyLevel ? ` · ${run.course.proficiencyLevel}` : ''}
          </p>
          <h2 className="mt-1 line-clamp-2 text-lg font-semibold">{run.title}</h2>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{run.course.title}</p>
        </div>
        <Badge variant={run.status === 'IN_PROGRESS' ? 'success' : 'secondary'}>
          {t(`statuses.${run.status}`)}
        </Badge>
      </div>

      <div className="space-y-3 text-sm">
        <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={startsAt} />
        <InfoRow
          icon={<Users className="h-4 w-4" />}
          label={t('capacityValue', {
            count: run._count?.enrollments ?? 0,
            capacity: run.capacity,
          })}
        />
        <InfoRow
          icon={<Clock3 className="h-4 w-4" />}
          label={t('sessionValue', {
            count: run._count?.sessions ?? 0,
          })}
        />
        <InfoRow
          icon={<MonitorPlay className="h-4 w-4" />}
          label={run.onlineMeetingUrl || run.location || t('noLocation')}
        />
      </div>
    </article>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}
