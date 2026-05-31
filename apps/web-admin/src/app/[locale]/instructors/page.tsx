'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Badge, Button, Input, Label } from '@/components/ui';
import {
  useInstructors,
  useCreateInstructor,
  useUpdateStudentStatus,
} from '@/hooks/use-admin-users';
import { EmptyState, ErrorState, LoadingState, PaginationControls } from '@repo/ui';
import { PASSWORD_COMPLEXITY_REGEX } from '@repo/shared';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Search,
  UserCheck2,
  UserPlus,
  UserX2,
  Users,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Link } from '@/navigation';
import type { AxiosError } from 'axios';

type StatusFilter = 'all' | 'active' | 'inactive';

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  isActive: true,
};

export default function AdminInstructorsPage() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active';

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isLoading, isError } = useInstructors({
    page,
    limit: 20,
    search: debouncedSearch.trim() || undefined,
    isActive,
  });
  const createInstructor = useCreateInstructor();
  const updateStatus = useUpdateStudentStatus();

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const instructors = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const passwordValid = PASSWORD_COMPLEXITY_REGEX.test(form.password);
  const formValid =
    form.fullName.trim().length > 0 && form.email.trim().length > 0 && passwordValid;

  const resetForm = () => {
    setForm(emptyForm);
    setShowCreateForm(false);
  };

  const handleCreate = () => {
    if (!formValid) {
      setMessage({ type: 'error', text: t('instructors.formInvalid') });
      return;
    }

    createInstructor.mutate(
      {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim() || undefined,
        isActive: form.isActive,
      },
      {
        onSuccess: () => {
          resetForm();
          setMessage({ type: 'success', text: t('instructors.created') });
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{ message?: string | string[] }>;
          const apiMessage = axiosError.response?.data?.message;
          const text = Array.isArray(apiMessage)
            ? apiMessage.join(', ')
            : apiMessage || t('instructors.createError');
          setMessage({ type: 'error', text });
        },
      },
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader
              title={t('instructors.title')}
              description={t('instructors.description')}
            />
            {message && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {t('instructors.countValue', { count: total })}
              </div>
              <Button
                type="button"
                className="gap-2"
                onClick={() => setShowCreateForm((open) => !open)}
              >
                <UserPlus className="h-4 w-4" />
                {t('instructors.addInstructor')}
              </Button>
            </div>

            {showCreateForm && (
              <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold">{t('instructors.addInstructor')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t('instructors.fullName')}</Label>
                    <Input
                      value={form.fullName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, fullName: event.target.value }))
                      }
                      placeholder={t('instructors.fullNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('instructors.email')}</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder={t('instructors.emailPlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('instructors.password')}</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, password: event.target.value }))
                      }
                      placeholder={t('instructors.passwordPlaceholder')}
                    />
                    {form.password.length > 0 && !passwordValid && (
                      <p className="text-xs text-destructive">{t('instructors.passwordHint')}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('instructors.phoneNumber')}</Label>
                    <Input
                      value={form.phoneNumber}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phoneNumber: event.target.value }))
                      }
                      placeholder={t('instructors.phoneNumberPlaceholder')}
                    />
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isActive: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  {t('instructors.activeOnCreate')}
                </label>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    className="gap-2"
                    disabled={!formValid || createInstructor.isPending}
                    onClick={handleCreate}
                  >
                    {createInstructor.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {t('instructors.createSubmit')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex h-10 min-w-[200px] flex-1 items-center rounded-md border border-input bg-background text-foreground shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('instructors.searchPlaceholder')}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2">
                {(['all', 'active', 'inactive'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition-colors ${
                      statusFilter === filter
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {t(`instructors.filter.${filter}`)}
                  </button>
                ))}
              </div>
            </div>
            {isLoading ? (
              <LoadingState title={t('loading')} className="rounded-md border" />
            ) : isError ? (
              <ErrorState title={t('instructors.loadError')} />
            ) : instructors.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('instructors.empty')}
                description={t('instructors.emptyDesc')}
                className="rounded-xl border border-dashed bg-muted/20 py-24"
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[minmax(0,1.4fr)_130px_260px] gap-4 border-b bg-muted/30 px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground items-center">
                    <span>{t('instructors.title')}</span>
                    <span>{t('status')}</span>
                    <span>{t('actions')}</span>
                  </div>
                  <div className="divide-y">
                    {instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        className="grid grid-cols-[minmax(0,1.4fr)_130px_260px] gap-4 px-5 py-4 hover:bg-muted/50 transition-colors items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {instructor.fullName || instructor.email}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {instructor.email}
                          </p>
                          {instructor.createdAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t('instructors.since', {
                                value: new Intl.DateTimeFormat(locale, {
                                  dateStyle: 'medium',
                                }).format(new Date(instructor.createdAt)),
                              })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Badge variant={instructor.isActive ? 'success' : 'outline'}>
                            {instructor.isActive
                              ? t('instructors.filter.active')
                              : t('instructors.filter.inactive')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline" className="gap-1.5">
                            <Link href={`/instructors/${instructor.id}`}>
                              <Eye className="h-4 w-4" />
                              {t('instructors.viewDetails')}
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={instructor.isActive ? 'outline' : 'default'}
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              updateStatus.mutate(
                                { userId: instructor.id, isActive: !instructor.isActive },
                                {
                                  onSuccess: () =>
                                    setMessage({
                                      type: 'success',
                                      text: instructor.isActive
                                        ? t('instructors.deactivated')
                                        : t('instructors.activated'),
                                    }),
                                  onError: () =>
                                    setMessage({
                                      type: 'error',
                                      text: t('instructors.statusUpdateError'),
                                    }),
                                },
                              )
                            }
                            className="gap-1.5"
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : instructor.isActive ? (
                              <UserX2 className="h-4 w-4" />
                            ) : (
                              <UserCheck2 className="h-4 w-4" />
                            )}
                            {instructor.isActive ? t('deactivate') : t('activate')}
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
                      onPageChange={setPage}
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
