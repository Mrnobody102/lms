'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { SearchableRelationPicker } from '@/components/filters/searchable-relation-picker';
import { Badge, Label } from '@/components/ui';
import { useCohorts } from '@/hooks/use-cohorts';
import { useCourses } from '@/hooks/use-courses';
import { reportsApi } from '@/lib/reports-api';

export default function CohortComparisonPage() {
  const t = useTranslations('Admin');
  const { data: courseData } = useCourses({ limit: 100 });
  const { cohorts } = useCohorts();
  const courses = courseData?.data ?? [];
  const [courseId, setCourseId] = useState('');
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const comparisonQuery = useQuery({
    queryKey: ['cohort-comparison', courseId, selectedCohorts, startDate, endDate],
    queryFn: () =>
      reportsApi.getCohortComparison({
        courseId: courseId || undefined,
        cohortIds: selectedCohorts.length ? selectedCohorts : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });
  const rows = comparisonQuery.data?.data ?? [];
  const maxCompletion = Math.max(...rows.map((row) => row.completionRate), 1);

  const toggleCohort = (id: string) => {
    setSelectedCohorts((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-6 md:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AdminHeader
              title={t('reports.cohortCompareTitle')}
              description={t('reports.cohortCompareDesc')}
            />

            <div className="mb-6 grid gap-4 lg:grid-cols-[280px_160px_160px_1fr]">
              <div className="space-y-1.5">
                <Label>{t('courseName')}</Label>
                <SearchableRelationPicker
                  value={courseId}
                  onChange={setCourseId}
                  options={[
                    { value: '', label: t('reports.allCourses') },
                    ...courses.map((course) => ({ value: course.id, label: course.title })),
                  ]}
                  placeholder={t('reports.allCourses')}
                  searchPlaceholder={t('schedulePage.search')}
                  emptyMessage={t('reports.allCourses')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('reports.startDate')}</Label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('reports.endDate')}</Label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label>{t('reports.compareWithLabel')}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCohorts([])}
                    className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm ${
                      selectedCohorts.length === 0
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t('common.all')}
                  </button>
                  {cohorts.map((cohort) => (
                    <button
                      key={cohort.id}
                      type="button"
                      onClick={() => toggleCohort(cohort.id)}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        selectedCohorts.includes(cohort.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {cohort.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="rounded-lg border bg-card">
              <div className="flex items-center gap-2 border-b p-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">{t('reports.cohortComparison')}</h2>
              </div>
              {comparisonQuery.isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : rows.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {t('reports.noCohortComparison')}
                </p>
              ) : (
                <div>
                  <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((row) => (
                      <div key={row.cohortId} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium">{row.cohortName}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {row.completionRate}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.max(
                                4,
                                Math.round((row.completionRate / maxCompletion) * 100),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead className="border-b bg-muted/20 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">{t('reports.cohortColumn')}</th>
                          <th className="px-4 py-3">{t('reports.rank')}</th>
                          <th className="px-4 py-3">{t('reports.enrollment')}</th>
                          <th className="px-4 py-3">{t('reports.completion')}</th>
                          <th className="px-4 py-3">{t('reports.activityOpened')}</th>
                          <th className="px-4 py-3">{t('reports.practiceAccuracy')}</th>
                          <th className="px-4 py-3">{t('reports.examAccuracy')}</th>
                          <th className="px-4 py-3">{t('reports.mastery')}</th>
                          <th className="px-4 py-3">{t('reports.overdueSrs')}</th>
                          <th className="px-4 py-3">{t('reports.deltaCompletion')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.cohortId} className="border-b">
                            <td className="px-4 py-3 font-medium">{row.cohortName}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">#{row.rank}</Badge>
                            </td>
                            <td className="px-4 py-3">{row.learnerCount}</td>
                            <td className="px-4 py-3">{row.completionRate}%</td>
                            <td className="px-4 py-3">{row.activitySessions}</td>
                            <td className="px-4 py-3">{row.practiceAccuracy}%</td>
                            <td className="px-4 py-3">{row.examAccuracy}%</td>
                            <td className="px-4 py-3">{row.mastery}%</td>
                            <td className="px-4 py-3">{row.overdueSrsCards}</td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  row.deltaCompletion >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }
                              >
                                {row.deltaCompletion > 0 ? '+' : ''}
                                {row.deltaCompletion}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
