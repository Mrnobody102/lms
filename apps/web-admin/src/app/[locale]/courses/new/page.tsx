'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { AuthGuard } from '@/components/layout/auth-guard';
import { useCreateCourse } from '@/hooks/use-courses';
import { usePrograms } from '@/hooks/use-programs';
import { Button, Input, Label, Alert, AlertDescription } from '@/components/ui';
import { ArrowLeft, Plus, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { buildCourseAiSettings } from '@/lib/course-api';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';

export default function NewCoursePage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [programId, setProgramId] = useState<string>('');
  const [levelId, setLevelId] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const { mutate: createCourse, isPending: loading, error: createError } = useCreateCourse();
  const { data: programs } = usePrograms();
  const [localError, setLocalError] = useState<string | null>(null);
  const hasProgramLevels = useMemo(
    () => programs?.some((program) => (program.levels?.length ?? 0) > 0) ?? false,
    [programs],
  );
  const selectedProgram = useMemo(
    () => programs?.find((program) => program.id === programId) ?? null,
    [programId, programs],
  );
  const selectedProgramLevels = selectedProgram?.levels ?? [];

  const handleProgramChange = (nextProgramId: string) => {
    setProgramId(nextProgramId);
    const nextProgram = programs?.find((program) => program.id === nextProgramId);
    const nextLevelIds = new Set((nextProgram?.levels ?? []).map((level) => level.id));
    if (!nextLevelIds.has(levelId)) {
      setLevelId('');
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLocalError(null);
    createCourse(
      {
        title,
        aiSettings: buildCourseAiSettings(aiEnabled, aiPrompt),
        levelId: levelId || undefined,
      },
      {
        onSuccess: (newCourse) => {
          router.push(`/courses/${newCourse.id}/edit`);
        },
        onError: () => {
          setLocalError(t('cannotCreateCourse'));
        },
      },
    );
  };

  const error =
    createError || localError
      ? getApiErrorMessage(
          createError ?? localError,
          t(
            getApiErrorStatus(createError) === 500
              ? 'courseCreateServerError'
              : 'cannotCreateCourse',
          ),
        )
      : null;

  return (
    <AuthGuard requiredCapability="course:manage">
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-[var(--admin-sidebar-width)] p-6 lg:p-8">
          <div className="max-w-xl mx-auto">
            <AdminHeader title={t('createNewCourse')} description={t('createNewCourseDesc')} />
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t('backToList')}
            </Link>

            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{t('createNewCourse')}</h1>
                  <p className="text-sm text-muted-foreground">{t('createNewCourseDesc')}</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('courseName')}</Label>
                  <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('courseNamePlaceholder')}
                    className="text-base"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('programOptional')}</Label>
                    <select
                      value={programId}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">{t('none')}</option>
                      {programs?.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">{t('programOptionalDesc')}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('levelOptional')}</Label>
                    <select
                      value={levelId}
                      onChange={(e) => setLevelId(e.target.value)}
                      disabled={!selectedProgram || selectedProgramLevels.length === 0}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{t('none')}</option>
                      {selectedProgramLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {!selectedProgram
                        ? t('selectProgramFirst')
                        : selectedProgramLevels.length === 0
                          ? t('noProgramLevelsInProgram')
                          : t('levelOptionalDesc')}
                    </p>
                  </div>
                </div>

                {!hasProgramLevels && (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                    <p>{t('noLevelsConfigured')}</p>
                    <Link
                      href="/programs"
                      className="mt-2 inline-flex font-medium text-primary hover:underline"
                    >
                      {t('managePrograms')}
                    </Link>
                  </div>
                )}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t('aiSettings')}</Label>
                      <p className="text-xs text-muted-foreground">{t('aiSettingsDesc')}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={(event) => setAiEnabled(event.target.checked)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20"
                      />
                      {t('aiEnabled')}
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('aiPrompt')}</Label>
                    <textarea
                      value={aiPrompt}
                      onChange={(event) => setAiPrompt(event.target.value)}
                      placeholder={t('aiPromptPlaceholder')}
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading || !title.trim()} className="w-full gap-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t('startBuilding')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('startBuildingDesc')}
                </p>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
