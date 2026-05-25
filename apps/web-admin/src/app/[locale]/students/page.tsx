'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, Input } from '@/components/ui';
import { useStudents, useUpdateStudentStatus } from '@/hooks/use-admin-users';
import { useCohorts } from '@/hooks/use-cohorts';
import { PaginationControls } from '@repo/ui';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck2,
  UserX2,
  Users,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminStudentsPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [page, setPage] = useState(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const debouncedEmail = useDebounce(emailFilter, 500);
  const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active' ? true : false;
  const { cohorts } = useCohorts();

  useEffect(() => {
    const initialStatus = searchParams.get('status');
    const initialCohortId = searchParams.get('cohortId');
    if (initialStatus) {
      setStatusFilter(normalizeStatusFilter(initialStatus));
    }
    if (initialCohortId) {
      setCohortId(initialCohortId);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
    setSelectedStudentIds([]);
  }, [cohortId, debouncedEmail, debouncedSearch, statusFilter]);

  const { data, isLoading, isError } = useStudents({
    page,
    limit: 20,
    search: debouncedSearch.trim() || undefined,
    email: debouncedEmail.trim() || undefined,
    isActive,
    cohortId: cohortId || undefined,
  });
  const updateStudentStatus = useUpdateStudentStatus();

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const students = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const visibleStudents = students;
  const selectedStudents = useMemo(
    () => visibleStudents.filter((student) => selectedStudentIds.includes(student.id)),
    [selectedStudentIds, visibleStudents],
  );
  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(emailFilter.trim()) ||
    Boolean(cohortId) ||
    statusFilter !== 'all';

  const filterItems = useMemo(
    () => [
      { key: 'all' as const, label: t('allStudents') },
      { key: 'active' as const, label: t('activeStudents') },
      { key: 'inactive' as const, label: t('inactiveStudents') },
    ],
    [t],
  );

  const clearFilters = () => {
    setSearch('');
    setEmailFilter('');
    setCohortId('');
    setStatusFilter('all');
    setPage(1);
    setSelectedStudentIds([]);
  };

  const selectVisibleStudents = () => {
    setSelectedStudentIds(visibleStudents.map((student) => student.id));
  };

  const clearSelectedStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((current) =>
      checked
        ? current.includes(studentId)
          ? current
          : [...current, studentId]
        : current.filter((id) => id !== studentId),
    );
  };

  const runBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedStudents.length === 0) return;
    setBulkAction(isActive ? 'activate' : 'deactivate');
    try {
      await Promise.all(
        selectedStudents.map((student) =>
          updateStudentStatus.mutateAsync({ userId: student.id, isActive }),
        ),
      );
      setSelectedStudentIds([]);
      setBulkConfirm(false);
      setMessage({
        type: 'success',
        text: isActive ? t('studentsActivated') : t('studentsDeactivated'),
      });
    } catch {
      setMessage({ type: 'error', text: t('studentStatusUpdateError') });
    } finally {
      setBulkAction(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
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

            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {t('studentsFound', { count: total })}
            </div>

            <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,0.7fr)_220px_auto_auto]">
              <div className="flex h-10 items-center rounded-md border border-input bg-background text-foreground shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSelectedStudentIds([]);
                  }}
                  placeholder={t('searchStudents')}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <Input
                value={emailFilter}
                onChange={(event) => {
                  setEmailFilter(event.target.value);
                  setSelectedStudentIds([]);
                }}
                placeholder={t('filterByEmail')}
                className="h-10 rounded-md"
              />
              <select
                value={cohortId}
                onChange={(event) => {
                  setCohortId(event.target.value);
                  setSelectedStudentIds([]);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('allCohorts')}</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {filterItems.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter.key);
                      setPage(1);
                      setSelectedStudentIds([]);
                    }}
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
              <Button type="button" variant="ghost" onClick={clearFilters} disabled={!hasFilters}>
                {t('clearFilters')}
              </Button>
            </div>

            {selectedStudentIds.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                <span className="text-sm font-medium">
                  {t('selectedStudentsValue', { count: selectedStudentIds.length })}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectVisibleStudents}
                    disabled={visibleStudents.length === 0}
                  >
                    {t('selectVisibleStudents')}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={clearSelectedStudents}>
                    {t('clearSelection')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setBulkAction('activate');
                      setBulkConfirm(true);
                    }}
                    disabled={selectedStudents.every((student) => student.isActive)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('activateSelected')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setBulkAction('deactivate');
                      setBulkConfirm(true);
                    }}
                    disabled={selectedStudents.every((student) => !student.isActive)}
                  >
                    <UserX2 className="h-4 w-4" />
                    {t('deactivateSelected')}
                  </Button>
                </div>
              </div>
            )}

            {bulkConfirm && bulkAction && selectedStudents.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <span className="text-sm text-destructive">
                  {bulkAction === 'activate'
                    ? t('confirmBulkActivateStudents', { count: selectedStudents.length })
                    : t('confirmBulkDeactivateStudents', { count: selectedStudents.length })}
                </span>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setBulkConfirm(false)}>
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    variant={bulkAction === 'activate' ? 'default' : 'destructive'}
                    disabled={updateStudentStatus.isPending}
                    onClick={() => runBulkStatusUpdate(bulkAction === 'activate')}
                  >
                    {updateStudentStatus.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {bulkAction === 'activate' ? t('activateSelected') : t('deactivateSelected')}
                  </Button>
                </div>
              </div>
            )}

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
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed bg-muted/20">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">{t('noStudents')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{t('noStudentsDesc')}</p>
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed bg-muted/20">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">
                  {t('noFilteredStudents')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">{t('noStudentsDesc')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[3rem_minmax(0,1.1fr)_140px_160px_180px] gap-4 border-b bg-muted/30 px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground items-center">
                    <span className="flex justify-center">{t('selectItem')}</span>
                    <span>{t('students')}</span>
                    <span>{t('status')}</span>
                    <span>{t('tenant')}</span>
                    <span>{t('actions')}</span>
                  </div>

                  <div className="divide-y">
                    {visibleStudents.map((student) => (
                      <div
                        key={student.id}
                        className="grid grid-cols-[3rem_minmax(0,1.1fr)_140px_160px_180px] gap-4 px-5 py-4 hover:bg-muted/50 transition-colors items-center"
                      >
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(event) =>
                              handleToggleStudent(student.id, event.target.checked)
                            }
                            aria-label={t('selectItem')}
                          />
                        </div>
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
                  <div className="border-t bg-muted/10 px-5 py-4">
                    <PaginationControls
                      page={page}
                      totalPages={totalPages}
                      disabled={isLoading}
                      labels={{
                        previous: t('previousPage'),
                        next: t('nextPage'),
                        pageValue: t('pageValue', { page, total: Math.max(totalPages, 1) }),
                      }}
                      onPageChange={(nextPage) => {
                        setPage(nextPage);
                        setSelectedStudentIds([]);
                      }}
                    />
                  </div>
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
