'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription } from '@/components/ui';
import { useLevelReport } from '@/hooks/use-reports';
import { Link } from '@/navigation';
import { AlertCircle, BookOpen, ChevronRight } from 'lucide-react';
import { AccuracyCell, ProgressBarCell, ReportTable } from '@/components/reports/report-table';
import { withCohortQuery } from '@/lib/report-links';
import type { CourseRollupRow } from '@/lib/reports-api';

export default function LevelReportPage() {
  const t = useTranslations('Admin');
  const params = useParams<{ levelId: string }>();
  const searchParams = useSearchParams();
  const levelId = params.levelId;
  const cohortId = searchParams.get('cohortId') ?? undefined;
  const filters = cohortId ? { cohortId } : {};
  const { data, isLoading, error } = useLevelReport(levelId, filters);

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <nav className="text-xs text-muted-foreground mb-3">
              <Link href={withCohortQuery('/reports', cohortId)} className="hover:text-foreground">
                {t('reports.title')}
              </Link>
              <span className="mx-2">/</span>
              {data ? (
                <Link
                  href={withCohortQuery(`/reports/programs/${data.program.id}`, cohortId)}
                  className="hover:text-foreground"
                >
                  {data.program.title}
                </Link>
              ) : (
                <span>{t('reports.breadcrumbProgram')}</span>
              )}
              <span className="mx-2">/</span>
              <span>{data?.level.title ?? t('reports.breadcrumbLevel')}</span>
            </nav>

            <AdminHeader
              title={data?.level.title ?? t('reports.breadcrumbLevel')}
              description={t('reports.levelDetailDesc')}
            />

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('reports.loadError')}</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="rounded-md border bg-card p-6 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <ReportTable<CourseRollupRow>
                rows={data?.courses ?? []}
                rowKey={(r) => r.courseId}
                emptyMessage={t('reports.noCourses')}
                columns={[
                  {
                    header: t('reports.courseColumn'),
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium">{r.title}</span>
                      </div>
                    ),
                  },
                  {
                    header: t('reports.enrollment'),
                    align: 'right',
                    render: (r) => <span className="tabular-nums">{r.enrollmentCount}</span>,
                  },
                  {
                    header: t('reports.lessonCount'),
                    align: 'right',
                    render: (r) => <span className="tabular-nums">{r.lessonCount}</span>,
                  },
                  {
                    header: t('reports.completion'),
                    render: (r) => <ProgressBarCell value={r.completionRate} />,
                  },
                  {
                    header: t('reports.practiceAccuracy'),
                    align: 'right',
                    render: (r) => <AccuracyCell value={r.practiceAccuracy} />,
                  },
                  {
                    header: t('reports.examAccuracy'),
                    align: 'right',
                    render: (r) => <AccuracyCell value={r.examAccuracy} />,
                  },
                  {
                    header: '',
                    align: 'right',
                    render: (r) => (
                      <Link
                        href={withCohortQuery(`/reports/courses/${r.courseId}`, cohortId)}
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        {t('reports.drillDown')}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
