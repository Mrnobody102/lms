'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, Input } from '@/components/ui';
import { useStudents, useUpdateStudentStatus } from '@/hooks/use-admin-users';
import { AlertCircle, Loader2, Search, UserCheck2, UserX2, Users } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminStudentsPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(readInitialStatusFilter);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active' ? true : false;

  const { data, isLoading, isError } = useStudents({
    search: search.trim() || undefined,
    isActive,
  });
  const updateStudentStatus = useUpdateStudentStatus();

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const students = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const filterItems = useMemo(
    () => [
      { key: 'all' as const, label: t('allStudents') },
      { key: 'active' as const, label: t('activeStudents') },
      { key: 'inactive' as const, label: t('inactiveStudents') },
    ],
    [t],
  );

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('students')} description={t('manageStudentsDesc')} />

            {message && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {message.text}
              </div>
            )}

            <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchStudents')}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filterItems.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setStatusFilter(filter.key)}
                    className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors ${
                      statusFilter === filter.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {t('studentsFound', { count: total })}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('studentsLoadError')}</AlertDescription>
              </Alert>
            ) : students.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center">
                <p className="text-base font-semibold">{t('noStudents')}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t('noStudentsDesc')}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="grid grid-cols-[minmax(0,1.2fr)_140px_140px_180px] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{t('students')}</span>
                  <span>{t('status')}</span>
                  <span>{t('tenant')}</span>
                  <span>{t('actions')}</span>
                </div>

                <div className="divide-y">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="grid grid-cols-[minmax(0,1.2fr)_140px_140px_180px] gap-4 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {student.fullName || student.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                        {student.createdAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('studentSince', {
                              value: new Intl.DateTimeFormat(locale, {
                                dateStyle: 'medium',
                              }).format(new Date(student.createdAt)),
                            })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Badge variant={student.isActive ? 'success' : 'outline'}>
                          {student.isActive ? t('activeStudents') : t('inactiveStudents')}
                        </Badge>
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        {student.tenant?.name || student.tenantId}
                      </div>

                      <div className="flex items-center">
                        <Button
                          type="button"
                          size="sm"
                          variant={student.isActive ? 'outline' : 'default'}
                          disabled={updateStudentStatus.isPending}
                          onClick={() => {
                            updateStudentStatus.mutate(
                              {
                                userId: student.id,
                                isActive: !student.isActive,
                              },
                              {
                                onSuccess: () => {
                                  setMessage({
                                    type: 'success',
                                    text: student.isActive
                                      ? t('studentDeactivated')
                                      : t('studentActivated'),
                                  });
                                },
                                onError: () => {
                                  setMessage({
                                    type: 'error',
                                    text: t('studentStatusUpdateError'),
                                  });
                                },
                              },
                            );
                          }}
                          className="gap-1.5"
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function normalizeStatusFilter(value: string | null): StatusFilter {
  return value === 'all' || value === 'inactive' || value === 'active' ? value : 'active';
}

function readInitialStatusFilter(): StatusFilter {
  if (typeof window === 'undefined') {
    return 'active';
  }

  return normalizeStatusFilter(new URLSearchParams(window.location.search).get('status'));
}
