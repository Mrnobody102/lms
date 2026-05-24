'use client';

import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Mic, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Badge, Button, Input, Label } from '@/components/ui';
import { useCourse, useCourses } from '@/hooks/use-courses';
import type { RoleplayMode, RoleplayScenario } from '@/lib/roleplay-api';
import { roleplayApi } from '@/lib/roleplay-api';

const MODES: RoleplayMode[] = ['TEXT', 'AUDIO', 'MIXED'];
const DEFAULT_TARGET_LANGUAGE = 'zh-CN';

interface ScenarioDraft {
  courseId: string;
  unitId: string;
  title: string;
  description: string;
  targetLanguage: string;
  level: string;
  skillTags: string;
  mode: RoleplayMode;
  systemPrompt: string;
  openingMessage: string;
  isPublished: boolean;
}

const emptyDraft: ScenarioDraft = {
  courseId: '',
  unitId: '',
  title: '',
  description: '',
  targetLanguage: DEFAULT_TARGET_LANGUAGE,
  level: '',
  skillTags: '',
  mode: 'TEXT',
  systemPrompt: '',
  openingMessage: '',
  isPublished: false,
};

export default function RoleplayScenarioPage() {
  const t = useTranslations('Admin');
  const queryClient = useQueryClient();
  const { data: courseData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const courses = useMemo(() => courseData?.data ?? [], [courseData]);
  const [draft, setDraft] = useState<ScenarioDraft>(emptyDraft);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { data: selectedCourse } = useCourse(draft.courseId);
  const units = selectedCourse?.units ?? [];

  const scenariosQuery = useQuery({
    queryKey: ['roleplay-scenarios', draft.courseId],
    queryFn: () =>
      roleplayApi.getScenarios({
        courseId: draft.courseId || undefined,
        limit: 100,
      }),
    enabled: Boolean(draft.courseId),
  });
  const scenarios = scenariosQuery.data?.data ?? [];

  useEffect(() => {
    if (!draft.courseId && courses[0]?.id) {
      setDraft((current) => ({ ...current, courseId: courses[0].id }));
    }
  }, [courses, draft.courseId]);

  const createScenario = useMutation({
    mutationFn: () =>
      roleplayApi.createScenario({
        courseId: draft.courseId,
        unitId: draft.unitId || undefined,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        targetLanguage: draft.targetLanguage.trim() || DEFAULT_TARGET_LANGUAGE,
        level: draft.level.trim() || undefined,
        skillTags: parseTags(draft.skillTags),
        mode: draft.mode,
        systemPrompt: draft.systemPrompt.trim(),
        openingMessage: draft.openingMessage.trim() || undefined,
        isPublished: draft.isPublished,
      }),
    onSuccess: () => {
      resetDraft(draft.courseId);
      invalidateScenarios(queryClient);
      setMessage({ type: 'success', text: t('roleplayScenarioCreated') });
    },
    onError: () => setMessage({ type: 'error', text: t('roleplayScenarioCreateError') }),
  });
  const updateScenario = useMutation({
    mutationFn: () =>
      roleplayApi.updateScenario(editingId, {
        courseId: draft.courseId,
        unitId: draft.unitId || undefined,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        targetLanguage: draft.targetLanguage.trim() || DEFAULT_TARGET_LANGUAGE,
        level: draft.level.trim() || undefined,
        skillTags: parseTags(draft.skillTags),
        mode: draft.mode,
        systemPrompt: draft.systemPrompt.trim(),
        openingMessage: draft.openingMessage.trim() || undefined,
        isPublished: draft.isPublished,
      }),
    onSuccess: () => {
      resetDraft(draft.courseId);
      invalidateScenarios(queryClient);
      setMessage({ type: 'success', text: t('roleplayScenarioUpdated') });
    },
    onError: () => setMessage({ type: 'error', text: t('roleplayScenarioUpdateError') }),
  });
  const publishScenario = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      published ? roleplayApi.unpublishScenario(id) : roleplayApi.publishScenario(id),
    onSuccess: () => {
      invalidateScenarios(queryClient);
      setMessage({ type: 'success', text: t('roleplayScenarioStatusUpdated') });
    },
  });
  const deleteScenario = useMutation({
    mutationFn: (id: string) => roleplayApi.deleteScenario(id),
    onSuccess: () => {
      invalidateScenarios(queryClient);
      setMessage({ type: 'success', text: t('roleplayScenarioDeleted') });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.courseId || !draft.title.trim() || !draft.systemPrompt.trim()) {
      setMessage({ type: 'error', text: t('roleplayScenarioRequired') });
      return;
    }

    if (editingId) {
      updateScenario.mutate();
      return;
    }

    createScenario.mutate();
  };

  const startEdit = (scenario: RoleplayScenario) => {
    setEditingId(scenario.id);
    setDraft({
      courseId: scenario.courseId,
      unitId: scenario.unitId ?? '',
      title: scenario.title,
      description: scenario.description ?? '',
      targetLanguage: scenario.targetLanguage,
      level: scenario.level ?? '',
      skillTags: scenario.skillTags.join(', '),
      mode: scenario.mode,
      systemPrompt: scenario.systemPrompt,
      openingMessage: scenario.openingMessage ?? '',
      isPublished: scenario.isPublished,
    });
  };

  const resetDraft = (courseId = '') => {
    setEditingId('');
    setDraft({ ...emptyDraft, courseId });
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-6 md:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AdminHeader
              title={t('roleplayScenariosTitle')}
              description={t('roleplayScenariosDesc')}
            />

            {message ? (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-destructive/20 bg-destructive/5 text-destructive'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {message.text}
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <form className="space-y-4 rounded-lg border bg-card p-4" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">
                    {editingId ? t('roleplayScenarioEdit') : t('roleplayScenarioCreate')}
                  </h2>
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('courseName')}</Label>
                  <select
                    value={draft.courseId}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        courseId: event.target.value,
                        unitId: '',
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={coursesLoading}
                  >
                    <option value="">{t('selectCourse')}</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('unit')}</Label>
                  <select
                    value={draft.unitId}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, unitId: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!draft.courseId}
                  >
                    <option value="">{t('allUnits')}</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField
                  label={t('roleplayScenarioName')}
                  value={draft.title}
                  onChange={(title) => setDraft((current) => ({ ...current, title }))}
                />
                <TextField
                  label={t('description')}
                  value={draft.description}
                  onChange={(description) => setDraft((current) => ({ ...current, description }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label={t('roleplayLanguage')}
                    value={draft.targetLanguage}
                    onChange={(targetLanguage) =>
                      setDraft((current) => ({ ...current, targetLanguage }))
                    }
                  />
                  <div className="space-y-1.5">
                    <Label>{t('roleplayMode')}</Label>
                    <select
                      value={draft.mode}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          mode: event.target.value as RoleplayMode,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {t(`roleplayModeValue.${mode}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <TextField
                  label={t('roleplayLevel')}
                  value={draft.level}
                  onChange={(level) => setDraft((current) => ({ ...current, level }))}
                />
                <TextField
                  label={t('skillTags')}
                  value={draft.skillTags}
                  onChange={(skillTags) => setDraft((current) => ({ ...current, skillTags }))}
                />
                <TextAreaField
                  label={t('roleplaySystemPrompt')}
                  value={draft.systemPrompt}
                  onChange={(systemPrompt) => setDraft((current) => ({ ...current, systemPrompt }))}
                />
                <TextAreaField
                  label={t('roleplayOpeningMessage')}
                  value={draft.openingMessage}
                  onChange={(openingMessage) =>
                    setDraft((current) => ({ ...current, openingMessage }))
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, isPublished: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  {t('publishedOnly')}
                </label>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createScenario.isPending || updateScenario.isPending}
                    className="gap-2"
                  >
                    {createScenario.isPending || updateScenario.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editingId ? t('save') : t('create')}
                  </Button>
                  {editingId ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetDraft(draft.courseId)}
                    >
                      {t('cancel')}
                    </Button>
                  ) : null}
                </div>
              </form>

              <section className="rounded-lg border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold">{t('roleplayScenarioList')}</h2>
                  <Badge variant="secondary">{scenarios.length}</Badge>
                </div>
                {scenariosQuery.isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t('loading')}</p>
                ) : scenarios.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('roleplayScenarioEmpty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {scenarios.map((scenario) => (
                      <article key={scenario.id} className="rounded-lg border bg-background p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">{scenario.title}</h3>
                              <Badge variant={scenario.isPublished ? 'default' : 'secondary'}>
                                {scenario.isPublished ? t('publishedOnly') : t('draftOnly')}
                              </Badge>
                              <Badge variant="outline">
                                {t(`roleplayModeValue.${scenario.mode}`)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {scenario.course?.title ?? scenario.courseId}
                              {scenario.unit ? ` · ${scenario.unit.title}` : ''}
                            </p>
                            {scenario.description ? (
                              <p className="mt-2 text-sm">{scenario.description}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(scenario)}>
                              <PencilLine className="h-4 w-4" />
                              {t('edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                publishScenario.mutate({
                                  id: scenario.id,
                                  published: scenario.isPublished,
                                })
                              }
                            >
                              {scenario.isPublished ? t('unpublish') : t('publish')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteScenario.mutate(scenario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('roleplayScenarioDelete')}
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <textarea
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function invalidateScenarios(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['roleplay-scenarios'] });
}
