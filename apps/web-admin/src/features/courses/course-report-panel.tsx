'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Activity, BarChart3, CheckCircle2, Clock3, Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui';
import { CourseEnrollmentReport } from '@/lib/course-api';

interface CourseReportPanelProps {
  report?: CourseEnrollmentReport;
  loading?: boolean;
}

export function CourseReportPanel({ report, loading = false }: CourseReportPanelProps) {
  const t = useTranslations('Admin');
  const locale = useLocale();

  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t('learningProgress')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('learningProgressDesc')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('loading')}
        </div>
      </section>
    );
  }

  if (!report || report.students.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t('learningProgress')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('learningProgressDesc')}</p>
        </div>
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          {t('noEnrollmentReport')}
        </div>
      </section>
    );
  }

  const totalHours = Math.floor(report.totals.totalTimeSpentSeconds / 3600);
  const remainingMinutes = Math.round((report.totals.totalTimeSpentSeconds % 3600) / 60);

  const statItems = [
    {
      icon: Users,
      label: t('enrolledStudents'),
      value: report.totals.enrolledStudents,
    },
    {
      icon: CheckCircle2,
      label: t('completedStudents'),
      value: report.totals.completedStudents,
    },
    {
      icon: BarChart3,
      label: t('avgProgress'),
      value: `${report.totals.averageCompletionPercentage}%`,
    },
    {
      icon: Activity,
      label: t('studySessions'),
      value: report.totals.activitySessions,
    },
    {
      icon: Clock3,
      label: t('timeTracked'),
      value: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{t('learningProgress')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('learningProgressDesc')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {statItems.map((item) => (
          <div key={item.label} className="rounded-md border p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{t('learnerProgress')}</p>
            <p className="text-xs text-muted-foreground">
              {t('completionRateValue', { value: report.totals.completionRate })}
            </p>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {report.students.map((student) => {
            const lastActivityLabel = student.lastActivityAt
              ? new Intl.DateTimeFormat(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(student.lastActivityAt))
              : t('noActivityYet');

            return (
              <div key={student.enrollmentId} className="border-b px-4 py-4 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {student.fullName || student.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <Badge
                    variant={
                      student.status === 'COMPLETED'
                        ? 'success'
                        : student.status === 'IN_PROGRESS'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {t(`reportStatus.${student.status}`)}
                  </Badge>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${student.completionPercentage}%` }}
                  />
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>
                    {t('completedCount', {
                      completed: student.completedLessons,
                      total: student.totalLessons,
                    })}
                  </span>
                  <span>{t('studentProgressValue', { value: student.completionPercentage })}</span>
                  <span>{t('studentSessionsValue', { value: student.activitySessions })}</span>
                  <span>{t('lastActivityValue', { value: lastActivityLabel })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
