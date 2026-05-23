'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription } from '@/components/ui';
import { useProgramReport } from '@/hooks/use-reports';
import { Link } from '@/navigation';
import { AlertCircle, ChevronRight, Layers } from 'lucide-react';
import { AccuracyCell, ProgressBarCell, ReportTable } from '@/components/reports/report-table';
import { SkillAccuracyPanel } from '@/components/reports/skill-accuracy-panel';
import { withCohortQuery } from '@/lib/report-links';
import type { LevelRollupRow } from '@/lib/reports-api';

export default function ProgramReportPage() {
  const t = useTranslations('Admin');
  const params = useParams<{ programId: string }>();
  const searchParams = useSearchParams();
  const programId = params.programId;
  const cohortId = searchParams.get('cohortId') ?? undefined;
  const filters = cohortId ? { cohortId } : {};
  const { data, isLoading, error } = useProgramReport(programId, filters);

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <nav className="text-xs text-muted-foreground mb-3">
              <Link href={withCohortQuery('/reports', cohortId)} className="hover:text-foreground">
                {t('reports.title')}
              </Link>
              <span className="mx-2">/</span>
              <span>{data?.program.title ?? t('reports.breadcrumbProgram')}</span>
            </nav>

            <AdminHeader
              title={data?.program.title ?? t('reports.breadcrumbProgram')}
              description={data?.program.description ?? t('reports.titleDesc')}
            />

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('reports.loadError')}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {isLoading ? (
                    <div className="rounded-md border bg-card p-6 space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ReportTable<LevelRollupRow>
                      rows={data?.levels ?? []}
                      rowKey={(r) => r.id}
                      emptyMessage={t('reports.noLevels')}
                      columns={[
                        {
                          header: t('reports.levelColumn'),
                          render: (r) => (
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium">{r.title}</span>
                            </div>
                          ),
                        },
                        {
                          header: t('reports.courseCount'),
                          align: 'right',
                          render: (r) => <span className="tabular-nums">{r.courseCount}</span>,
                        },
                        {
                          header: t('reports.enrollment'),
                          align: 'right',
                          render: (r) => <span className="tabular-nums">{r.enrollmentCount}</span>,
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
                              href={withCohortQuery(`/reports/levels/${r.id}`, cohortId)}
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

                <SkillAccuracyPanel filters={{ programId, ...filters }} />
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
