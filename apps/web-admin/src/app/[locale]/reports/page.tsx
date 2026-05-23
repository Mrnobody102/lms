'use client';

import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription } from '@/components/ui';
import { useProgramsReport } from '@/hooks/use-reports';
import { Link } from '@/navigation';
import { AlertCircle, ChevronRight, Layers } from 'lucide-react';
import { AccuracyCell, ProgressBarCell, ReportTable } from '@/components/reports/report-table';
import { SkillAccuracyPanel } from '@/components/reports/skill-accuracy-panel';
import { ActivityTrendPanel } from '@/components/reports/activity-trend-panel';
import { TrendReportPanel } from '@/components/reports/trend-report-panel';
import { useCohorts } from '@/hooks/use-cohorts';
import { useState } from 'react';
import type { ProgramRollupRow, UnassignedRollupRow } from '@/lib/reports-api';

type Row = ProgramRollupRow | UnassignedRollupRow;

export default function ReportsHomePage() {
  const t = useTranslations('Admin');
  const { data, isLoading, error } = useProgramsReport();
  const { cohorts } = useCohorts();
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  const filters = selectedCohortId ? { cohortId: selectedCohortId } : {};

  const rows: Row[] = data
    ? data.unassigned
      ? [...data.programs, data.unassigned]
      : data.programs
    : [];

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <AdminHeader title={t('reports.title')} description={t('reports.titleDesc')} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t('cohorts.filterLabel')}</span>
                <select
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm min-w-[200px]"
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                >
                  <option value="">{t('common.all')}</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('reports.loadError')}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <ActivityTrendPanel filters={filters} />
                    <TrendReportPanel filters={filters} />
                    {isLoading ? (
                      <div className="rounded-md border bg-card p-6 space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <ReportTable<Row>
                        rows={rows}
                        rowKey={(r) => r.id ?? 'unassigned'}
                        emptyMessage={t('reports.noPrograms')}
                        columns={[
                          {
                            header: t('reports.programColumn'),
                            render: (r) => (
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary shrink-0" />
                                <span className="font-medium">{r.title}</span>
                              </div>
                            ),
                          },
                          {
                            header: t('reports.levelCount'),
                            align: 'right',
                            render: (r) => <span className="tabular-nums">{r.levelCount}</span>,
                          },
                          {
                            header: t('reports.courseCount'),
                            align: 'right',
                            render: (r) => <span className="tabular-nums">{r.courseCount}</span>,
                          },
                          {
                            header: t('reports.enrollment'),
                            align: 'right',
                            render: (r) => (
                              <span className="tabular-nums">{r.enrollmentCount}</span>
                            ),
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
                            render: (r) =>
                              r.id ? (
                                <Link
                                  href={`/reports/programs/${r.id}`}
                                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                                >
                                  {t('reports.drillDown')}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              ) : null,
                          },
                        ]}
                      />
                    )}
                  </div>

                  <SkillAccuracyPanel />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
