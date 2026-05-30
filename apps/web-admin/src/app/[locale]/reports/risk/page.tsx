'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { SearchableRelationPicker } from '@/components/filters/searchable-relation-picker';
import { Badge, Button, Label } from '@/components/ui';
import { useCohorts } from '@/hooks/use-cohorts';
import { useCourses } from '@/hooks/use-courses';
import type { RiskFlagType, RiskSeverity } from '@/lib/reports-api';
import { reportsApi } from '@/lib/reports-api';
import { Link } from '@/navigation';

const SEVERITIES: Array<'all' | RiskSeverity> = ['all', 'LOW', 'MEDIUM', 'HIGH'];
const FLAGS: Array<'all' | RiskFlagType> = [
  'all',
  'NO_ACTIVITY',
  'FALLING_BEHIND',
  'LOW_MASTERY',
  'OVERDUE_SRS',
  'DECLINING_SCORE',
];
const RISK_LABEL_KEYS = {
  DECLINING_SCORE: 'reports.riskDECLINING_SCORE',
  FALLING_BEHIND: 'reports.riskFALLING_BEHIND',
  LOW_MASTERY: 'reports.riskLOW_MASTERY',
  NO_ACTIVITY: 'reports.riskNO_ACTIVITY',
  OVERDUE_SRS: 'reports.riskOVERDUE_SRS',
} as const satisfies Record<RiskFlagType, `reports.risk${RiskFlagType}`>;
const SEVERITY_LABEL_KEYS = {
  HIGH: 'reports.riskSeverity.HIGH',
  LOW: 'reports.riskSeverity.LOW',
  MEDIUM: 'reports.riskSeverity.MEDIUM',
} as const satisfies Record<RiskSeverity, `reports.riskSeverity.${RiskSeverity}`>;

export default function RiskReportPage() {
  const t = useTranslations('Admin');
  const queryClient = useQueryClient();
  const { data: courseData } = useCourses({ limit: 100 });
  const { cohorts } = useCohorts();
  const courses = courseData?.data ?? [];
  const [courseId, setCourseId] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [severity, setSeverity] = useState<'all' | RiskSeverity>('all');
  const [flag, setFlag] = useState<'all' | RiskFlagType>('all');

  const query = useQuery({
    queryKey: ['risk-flags', courseId, cohortId, severity, flag],
    queryFn: () =>
      reportsApi.getRiskFlags({
        courseId: courseId || undefined,
        cohortId: cohortId || undefined,
        severity: severity === 'all' ? undefined : severity,
        flag: flag === 'all' ? undefined : flag,
        limit: 100,
      }),
  });
  const recompute = useMutation({
    mutationFn: () =>
      reportsApi.recomputeRiskFlags({
        courseId: courseId || undefined,
        cohortId: cohortId || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['risk-flags'] }),
  });
  const rows = query.data?.data ?? [];

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-6 md:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AdminHeader title={t('reports.riskTitle')} description={t('reports.riskDesc')} />
            <div className="mb-6 grid gap-4 md:grid-cols-5">
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
                <Label>{t('reports.cohortColumn')}</Label>
                <SearchableRelationPicker
                  value={cohortId}
                  onChange={setCohortId}
                  options={[
                    { value: '', label: t('common.all') },
                    ...cohorts.map((cohort) => ({ value: cohort.id, label: cohort.name })),
                  ]}
                  placeholder={t('common.all')}
                  searchPlaceholder={t('reports.compareWithLabel')}
                  emptyMessage={t('common.all')}
                />
              </div>
              <SelectFilter
                label={t('reports.severity')}
                value={severity}
                onChange={(value) => setSeverity(value as 'all' | RiskSeverity)}
              >
                {SEVERITIES.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? t('common.all') : t(SEVERITY_LABEL_KEYS[item])}
                  </option>
                ))}
              </SelectFilter>
              <SelectFilter
                label={t('reports.flag')}
                value={flag}
                onChange={(value) => setFlag(value as 'all' | RiskFlagType)}
              >
                {FLAGS.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? t('common.all') : t(RISK_LABEL_KEYS[item])}
                  </option>
                ))}
              </SelectFilter>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => recompute.mutate()}
                  disabled={recompute.isPending}
                  className="w-full gap-2"
                >
                  {recompute.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t('reports.recomputeRisk')}
                </Button>
              </div>
            </div>

            <section className="rounded-lg border bg-card">
              {query.isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {t('reports.noRiskFlags')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{t('reports.studentColumn')}</th>
                        <th className="px-4 py-3">{t('reports.courseColumn')}</th>
                        <th className="px-4 py-3">{t('reports.severity')}</th>
                        <th className="px-4 py-3">{t('reports.riskFlags')}</th>
                        <th className="px-4 py-3">{t('reports.scoreColumn')}</th>
                        <th className="px-4 py-3">{t('reports.riskReasons')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={`${row.userId}-${row.courseId}`} className="border-b">
                          <td className="px-4 py-3">
                            <Link
                              href={`/students?search=${encodeURIComponent(row.email)}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {row.fullName}
                            </Link>
                            <div className="text-xs text-muted-foreground">{row.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/courses/${row.courseId}/edit`}
                              className="text-primary hover:underline"
                            >
                              {row.courseTitle}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <SeverityBadge severity={row.severity} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {row.flags.map((item) => (
                                <Badge key={item} variant="outline">
                                  {t(RISK_LABEL_KEYS[item])}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold">{row.score}</td>
                          <td className="min-w-[240px] px-4 py-3 text-xs text-muted-foreground">
                            <ul className="space-y-1">
                              {row.reasons.map((reason) => (
                                <li key={`${reason.flag}-${reason.value ?? 'none'}`}>
                                  {reason.message}
                                  {typeof reason.value === 'number' &&
                                  typeof reason.threshold === 'number'
                                    ? ` (${reason.value}/${reason.threshold})`
                                    : null}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  const t = useTranslations('Admin');
  const variant =
    severity === 'HIGH' ? 'destructive' : severity === 'MEDIUM' ? 'secondary' : 'outline';
  return (
    <Badge variant={variant}>
      <AlertTriangle className="mr-1 h-3 w-3" />
      {t(SEVERITY_LABEL_KEYS[severity])}
    </Badge>
  );
}
