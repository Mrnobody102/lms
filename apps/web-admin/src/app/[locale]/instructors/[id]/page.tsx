'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, ImageUpload, Input, Label } from '@/components/ui';
import { useAdminUserDetail, useUpdateAdminUser } from '@/hooks/use-admin-users';
import { uploadMediaFile } from '@/lib/media-upload';
import { Link } from '@/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, UserRound } from 'lucide-react';

interface InstructorFormState {
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
  isActive: boolean;
}

const emptyForm: InstructorFormState = {
  fullName: '',
  phoneNumber: '',
  avatarUrl: '',
  isActive: true,
};

export default function InstructorDetailPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const instructorId = params.id as string;
  const { data: instructor, isError, isLoading } = useAdminUserDetail(instructorId);
  const updateUser = useUpdateAdminUser();
  const [form, setForm] = useState<InstructorFormState>(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!instructor) return;

    setForm({
      fullName: instructor.fullName || '',
      phoneNumber: instructor.phoneNumber || '',
      avatarUrl: instructor.avatarUrl || '',
      isActive: instructor.isActive,
    });
  }, [instructor]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const isInstructor = instructor?.role === 'INSTRUCTOR';
  const isDirty = useMemo(() => {
    if (!instructor) return false;

    return (
      form.fullName !== (instructor.fullName || '') ||
      form.phoneNumber !== (instructor.phoneNumber || '') ||
      form.avatarUrl !== (instructor.avatarUrl || '') ||
      form.isActive !== instructor.isActive
    );
  }, [form, instructor]);

  const handleSave = () => {
    if (!instructor || !isInstructor) return;

    updateUser.mutate(
      {
        userId: instructor.id,
        payload: {
          fullName: form.fullName.trim(),
          phoneNumber: form.phoneNumber.trim() || null,
          avatarUrl: form.avatarUrl.trim() || null,
          isActive: form.isActive,
        },
      },
      {
        onSuccess: () => setMessage({ type: 'success', text: t('instructors.saveSuccess') }),
        onError: () => setMessage({ type: 'error', text: t('instructors.saveError') }),
      },
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <AdminHeader
              title={t('instructors.detailTitle')}
              description={t('instructors.detailDescription')}
            />

            <Button asChild variant="ghost" className="mb-6 -ml-3 gap-2">
              <Link href="/instructors">
                <ArrowLeft className="h-4 w-4" />
                {t('instructors.backToInstructors')}
              </Link>
            </Button>

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

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : isError || !instructor || !isInstructor ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('instructors.notFound')}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {instructor.fullName || instructor.email}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{instructor.email}</p>
                    </div>
                  </div>
                  <Badge variant={form.isActive ? 'success' : 'outline'}>
                    {form.isActive
                      ? t('instructors.filter.active')
                      : t('instructors.filter.inactive')}
                  </Badge>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{t('instructors.accountInfo')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('instructors.emailCannotChange')}
                      </p>
                    </div>
                    {isDirty && <Badge variant="warning">{t('settingsDirty')}</Badge>}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
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
                      <Input value={instructor.email} readOnly className="bg-muted/40" />
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

                    <label className="flex items-center gap-2 self-end text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, isActive: event.target.checked }))
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                      {t('instructors.activeStatus')}
                    </label>
                  </div>

                  <div className="mt-6 space-y-1.5">
                    <Label>{t('instructors.avatar')}</Label>
                    <ImageUpload
                      value={form.avatarUrl}
                      onValueChange={(avatarUrl) =>
                        setForm((current) => ({ ...current, avatarUrl }))
                      }
                      onUpload={uploadMediaFile}
                      onUploadError={() =>
                        setMessage({ type: 'error', text: t('instructors.avatarUploadError') })
                      }
                      emptyLabel={t('instructors.avatarUpload')}
                      changeLabel={t('instructors.avatarChange')}
                      uploadingLabel={t('instructors.avatarUploading')}
                      helperText={t('instructors.avatarHelper')}
                      uploadedImageAlt={t('instructors.avatar')}
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          fullName: instructor.fullName || '',
                          phoneNumber: instructor.phoneNumber || '',
                          avatarUrl: instructor.avatarUrl || '',
                          isActive: instructor.isActive,
                        })
                      }
                      disabled={!isDirty || updateUser.isPending}
                    >
                      {t('resetChanges')}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={!isDirty || updateUser.isPending || !form.fullName.trim()}
                      className="gap-2"
                    >
                      {updateUser.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t('save')}
                    </Button>
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
