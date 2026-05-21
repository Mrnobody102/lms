'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge } from '@/components/ui';
import { useAdminOverview } from '@/hooks/use-admin-users';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  FileCheck2,
  Loader2,
  UserPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default function AdminHome() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { data: overview, isLoading, isError } = useAdminOverview();

  const stats = overview
    ? [
        {
          label: t('totalStudents'),
          value: overview.totals.totalStudents,
          trend: t('newStudents7dValue', { count: overview.totals.newStudents7d }),
          icon: Users,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900',
        },
        {
          label: t('newStudents'),
          value: overview.totals.newStudents7d,
          trend: t('inactiveStudentsValue', { count: overview.totals.inactiveStudents }),
          icon: UserPlus,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-100 dark:bg-emerald-900',
        },
        {
          label: t('activeCourses'),
          value: overview.totals.activeCourses,
          trend: t('activeEnrollmentsValue', { count: overview.totals.activeEnrollments }),
          icon: BookOpen,
          color: 'text-primary',
          bg: 'bg-primary/10',
        },
        {
          label: t('completionRate'),
          value: `${overview.totals.completionRate}%`,
          trend: t('trackedSessionsValue', { count: overview.totals.trackedSessions }),
          icon: CheckCircle2,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-100 dark:bg-orange-900',
        },
      ]
    : [];

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader
              title={t('dashboard')}
              description={t('welcome')}
              showCreateCourse={true}
            />

            {isLoading ? (
              <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </div>
            ) : isError || !overview ? (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('overviewLoadError')}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card border rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} bg-opacity-50`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stat.trend}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 bg-card border rounded-xl p-5">
                    <h2 className="text-base font-semibold mb-4">{t('recentRegistrations')}</h2>
                    {overview.recentRegistrations.length === 0 ? (
                      <div className="rounded-md border p-4 text-sm text-muted-foreground">
                        {t('noRecentRegistrations')}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {overview.recentRegistrations.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                                {(student.fullName || student.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {student.fullName || student.email}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-3">
                              <p className="text-xs font-semibold text-primary">
                                {student.latestCourseTitle || t('noCourseAssigned')}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatDateTime(student.createdAt, locale)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border rounded-xl p-5 flex flex-col gap-4">
                    <h2 className="text-base font-semibold">{t('quickActions')}</h2>

                    <Link
                      href={{ pathname: '/students', query: { status: 'inactive' } }}
                      className="block"
                    >
                      <div className="inline-flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                        <span className="text-sm">{t('approveStudents')}</span>
                        <Badge variant="destructive" className="text-[10px] ml-2 shrink-0">
                          {overview.totals.inactiveStudents}
                        </Badge>
                      </div>
                    </Link>

                    <Link href="/courses" className="block">
                      <div className="inline-flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                        <span className="text-sm">{t('reviewEnrollments')}</span>
                        <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
                          {overview.totals.activeEnrollments}
                        </Badge>
                      </div>
                    </Link>

                    <Link href="/courses" className="block">
                      <div className="inline-flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                        <span className="text-sm">{t('viewLearningReports')}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('trackedSessionsValue', { count: overview.totals.trackedSessions })}
                        </span>
                      </div>
                    </Link>

                    <div className="mt-auto pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t('overviewHealth')}</span>
                        <span className="font-medium text-primary">
                          {t('overviewCompletionValue', {
                            value: overview.totals.completionRate,
                          })}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${overview.totals.completionRate}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        {t('activeEnrollmentsValue', { count: overview.totals.activeEnrollments })}
                      </div>
                    </div>
                  </div>
                </div>

                {overview.reporting && <DashboardReportSummary reporting={overview.reporting} />}
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

type ActivityCalendarEntry = {
  date: string;
  sessions: number;
  completedLessons: number;
  timeSpentSeconds: number;
};

type AccuracySummary = {
  attempts: number;
  score: number;
  totalPoints: number;
  accuracy: number;
};

type ReportingSummary = {
  activityCalendar: ActivityCalendarEntry[];
  practiceAccuracy: AccuracySummary;
  examAccuracy: AccuracySummary;
};

function DashboardReportSummary({ reporting }: { reporting: ReportingSummary }) {
  const t = useTranslations('Admin');

  return (
    <section className="mt-8 border-t pt-8">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{t('reportSnapshot')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('reportSnapshotDesc')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ActivityTrend calendar={reporting.activityCalendar} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <AccuracyCard
            icon={Dumbbell}
            title={t('practiceAccuracy')}
            metric={reporting.practiceAccuracy}
          />
          <AccuracyCard
            icon={FileCheck2}
            title={t('examAccuracy')}
            metric={reporting.examAccuracy}
          />
        </div>
      </div>
    </section>
  );
}

function ActivityTrend({ calendar }: { calendar: ActivityCalendarEntry[] }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const maxActivity = Math.max(
    ...calendar.map((entry) => entry.sessions + entry.completedLessons),
    1,
  );

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t('activityTrend')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t('activityTrendDesc')}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2">
        {calendar.map((entry) => {
          const activityCount = entry.sessions + entry.completedLessons;
          const barHeight = `${Math.max(12, Math.round((activityCount / maxActivity) * 72))}px`;

          return (
            <div key={entry.date} className="min-w-0">
              <div className="flex h-20 items-end rounded-md bg-muted/40 px-1.5 pb-1.5">
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{ height: barHeight }}
                  title={t('activityDayTooltip', {
                    sessions: entry.sessions,
                    completed: entry.completedLessons,
                  })}
                />
              </div>
              <p className="mt-2 truncate text-center text-[11px] font-medium">
                {new Intl.DateTimeFormat(locale, {
                  weekday: 'short',
                }).format(new Date(`${entry.date}T00:00:00Z`))}
              </p>
              <p className="text-center text-[11px] text-muted-foreground">{activityCount}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AccuracyCard({
  icon: Icon,
  title,
  metric,
}: {
  icon: LucideIcon;
  title: string;
  metric: AccuracySummary;
}) {
  const t = useTranslations('Admin');

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('attemptsValue', { count: metric.attempts })}
          </p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-3xl font-bold tracking-tight">{metric.accuracy}%</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('reportPointsValue', { score: metric.score, total: metric.totalPoints })}
        </p>
        <div className="mt-3 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${metric.accuracy}%` }}
          />
        </div>
      </div>
    </div>
  );
}
