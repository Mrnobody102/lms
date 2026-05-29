'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Badge, Button } from '@/components/ui';
import { useStudentDetail, useUpdateStudentStatus } from '@/hooks/use-admin-users';
import { LoadingState, ErrorState } from '@repo/ui';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  UserCheck2,
  UserX2,
  Users,
} from 'lucide-react';
import { useState } from 'react';

export default function StudentDetailPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const params = useParams();
  const studentId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';

  const { data: student, isLoading, isError } = useStudentDetail(studentId);
  const updateStudentStatus = useUpdateStudentStatus();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(dateStr),
    );

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Link
                href="/students"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('students')}
              </Link>
            </div>

            {isLoading ? (
              <LoadingState title={t('loading')} className="rounded-xl border" />
            ) : isError || !student ? (
              <ErrorState title={t('notFoundStudent')} />
            ) : (
              <div className="space-y-6">
                {/* Header card */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                          {student.fullName || t('common.unnamed')}
                        </h1>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <div className="mt-2">
                          <Badge variant={student.isActive ? 'success' : 'outline'}>
                            {student.isActive ? t('activeStudents') : t('inactiveStudents')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant={student.isActive ? 'outline' : 'default'}
                        disabled={updateStudentStatus.isPending}
                        onClick={() => {
                          updateStudentStatus.mutate(
                            { userId: student.id, isActive: !student.isActive },
                            {
                              onSuccess: () =>
                                setMessage({
                                  type: 'success',
                                  text: student.isActive
                                    ? t('studentDeactivated')
                                    : t('studentActivated'),
                                }),
                              onError: () =>
                                setMessage({ type: 'error', text: t('studentStatusUpdateError') }),
                            },
                          );
                        }}
                        className="gap-2"
                      >
                        {updateStudentStatus.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : student.isActive ? (
                          <UserX2 className="h-4 w-4" />
                        ) : (
                          <UserCheck2 className="h-4 w-4" />
                        )}
                        {student.isActive ? t('deactivate') : t('activate')}
                      </Button>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                        message.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                          : 'bg-destructive/5 border-destructive/20 text-destructive'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {message.text}
                    </div>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard icon={Mail} label="Email" value={student.email} />
                  {student.phoneNumber && (
                    <InfoCard icon={Phone} label={t('phoneNumber')} value={student.phoneNumber} />
                  )}
                  <InfoCard
                    icon={Calendar}
                    label={t('studentSince', { value: '' }).replace(': ', '')}
                    value={student.createdAt ? formatDate(student.createdAt) : '—'}
                  />
                  {student.updatedAt && (
                    <InfoCard
                      icon={Calendar}
                      label={t('lastUpdated')}
                      value={formatDate(student.updatedAt)}
                    />
                  )}
                </div>

                {/* ID / meta */}
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t('systemInfo')}
                  </p>
                  <dl className="space-y-1.5">
                    <div className="flex gap-3 text-sm">
                      <dt className="w-24 shrink-0 text-muted-foreground">ID</dt>
                      <dd className="font-mono text-xs break-all">{student.id}</dd>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <dt className="w-24 shrink-0 text-muted-foreground">{t('role')}</dt>
                      <dd>{student.role}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-medium">{value}</p>
        </div>
      </div>
    </div>
  );
}
