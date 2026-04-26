'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge } from '@/components/ui';
import { useAdminOverview } from '@/hooks/use-admin-users';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Loader2,
  UserPlus,
  Users,
} from 'lucide-react';

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
          trend: t('pendingStudentsValue', { count: overview.totals.pendingStudents }),
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
                    <div key={stat.label} className="bg-card border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stat.trend}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
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

                    <Link href="/courses" className="block">
                      <div className="inline-flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                        <span className="text-sm">{t('approveStudents')}</span>
                        <Badge variant="destructive" className="text-[10px] ml-2 shrink-0">
                          {overview.totals.pendingStudents}
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
