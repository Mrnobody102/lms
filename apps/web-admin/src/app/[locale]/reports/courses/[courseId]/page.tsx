'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge } from '@/components/ui';
import { useCourseStudentsReport, useCourseUnitsReport } from '@/hooks/use-reports';
import { Link } from '@/navigation';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccuracyCell, ProgressBarCell, ReportTable } from '@/components/reports/report-table';
import { SkillAccuracyPanel } from '@/components/reports/skill-accuracy-panel';
import { CsvDownloadButton } from '@/components/reports/csv-download-button';
import { buildReportCsvPath, withCohortQuery } from '@/lib/report-links';
import type { CourseStudentRow, ReportFilters, UnitRollupRow } from '@/lib/reports-api';

type Tab = 'units' | 'students' | 'skills';

export default function CourseReportPage() {
  const t = useTranslations('Admin');
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const courseId = params.courseId;
  const cohortId = searchParams.get('cohortId') ?? undefined;
  const filters = cohortId ? { cohortId } : {};
  const [tab, setTab] = useState<Tab>('units');

  const unitsQuery = useCourseUnitsReport(courseId, filters);
  const studentsQuery = useCourseStudentsReport(courseId, filters);

  const courseTitle = unitsQuery.data?.course.title ?? studentsQuery.data?.course.title ?? '';

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <nav className="text-xs text-muted-foreground mb-3">
              <Link href={withCohortQuery('/reports', cohortId)} className="hover:text-foreground">
                {t('reports.title')}
              </Link>
              <span className="mx-2">/</span>
              <span>{courseTitle || t('reports.breadcrumbCourse')}</span>
            </nav>

            <AdminHeader
              title={courseTitle || t('reports.breadcrumbCourse')}
              description={t('reports.courseDetailDesc')}
            />

            <div className="flex flex-wrap items-center gap-2 mb-6 border-b">
              {(['units', 'students', 'skills'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    tab === value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`reports.${value}Tab`)}
                </button>
              ))}
            </div>

            {tab === 'units' && (
              <UnitsTab
                courseId={courseId}
                filters={filters}
                rows={unitsQuery.data?.units ?? []}
                isLoading={unitsQuery.isLoading}
                error={unitsQuery.error}
              />
            )}
            {tab === 'students' && (
              <StudentsTab
                courseId={courseId}
                filters={filters}
                rows={studentsQuery.data?.students ?? []}
                isLoading={studentsQuery.isLoading}
                error={studentsQuery.error}
              />
            )}
            {tab === 'skills' && <SkillAccuracyPanel filters={{ courseId, ...filters }} />}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function UnitsTab({
  courseId,
  filters,
  rows,
  isLoading,
  error,
}: {
  courseId: string;
  filters: ReportFilters;
  rows: UnitRollupRow[];
  isLoading: boolean;
  error: unknown;
}) {
  const t = useTranslations('Admin');

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('reports.loadError')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CsvDownloadButton
          path={buildReportCsvPath(`/admin/reports/courses/${courseId}/units.csv`, filters)}
          filename={`course-${courseId}-units.csv`}
          disabled={rows.length === 0}
        />
      </div>
      {isLoading ? (
        <div className="rounded-md border bg-card p-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <ReportTable<UnitRollupRow>
          rows={rows}
          rowKey={(r) => r.id}
          emptyMessage={t('reports.noUnits')}
          columns={[
            {
              header: t('reports.unitColumn'),
              render: (r) => <span className="font-medium">{r.title}</span>,
            },
            {
              header: t('reports.lessonCount'),
              align: 'right',
              render: (r) => <span className="tabular-nums">{r.lessonCount}</span>,
            },
            {
              header: t('reports.totalQuestions'),
              align: 'right',
              render: (r) => <span className="tabular-nums">{r.totalQuestions}</span>,
            },
            {
              header: t('reports.accuracy'),
              align: 'right',
              render: (r) => <AccuracyCell value={r.accuracy} totalQuestions={r.totalQuestions} />,
            },
          ]}
        />
      )}
    </div>
  );
}

function StudentsTab({
  courseId,
  filters,
  rows,
  isLoading,
  error,
}: {
  courseId: string;
  filters: ReportFilters;
  rows: CourseStudentRow[];
  isLoading: boolean;
  error: unknown;
}) {
  const t = useTranslations('Admin');

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('reports.loadError')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CsvDownloadButton
          path={buildReportCsvPath(`/admin/reports/courses/${courseId}/students.csv`, filters)}
          filename={`course-${courseId}-students.csv`}
          disabled={rows.length === 0}
        />
      </div>
      {isLoading ? (
        <div className="rounded-md border bg-card p-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <ReportTable<CourseStudentRow>
          rows={rows}
          rowKey={(r) => r.userId}
          emptyMessage={t('reports.noStudents')}
          columns={[
            {
              header: t('reports.studentColumn'),
              render: (r) => (
                <div className="flex flex-col">
                  <span className="font-medium">{r.fullName}</span>
                  <span className="text-xs text-muted-foreground">{r.email}</span>
                </div>
              ),
            },
            {
              header: t('reports.statusColumn'),
              render: (r) =>
                r.isActive ? (
                  <Badge variant="secondary">{t('reports.active')}</Badge>
                ) : (
                  <Badge variant="outline">{t('reports.inactive')}</Badge>
                ),
            },
            {
              header: t('reports.completion'),
              render: (r) => <ProgressBarCell value={r.completionPercentage} />,
            },
            {
              header: t('reports.practiceAccuracy'),
              align: 'right',
              render: (r) => (
                <AccuracyCell value={r.practiceAccuracy} totalQuestions={r.practiceAttempts} />
              ),
            },
            {
              header: t('reports.examAccuracy'),
              align: 'right',
              render: (r) => (
                <AccuracyCell value={r.examAccuracy} totalQuestions={r.examAttempts} />
              ),
            },
            {
              header: t('reports.lastActivity'),
              render: (r) =>
                r.lastActivityAt ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(r.lastActivityAt)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
          ]}
        />
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
