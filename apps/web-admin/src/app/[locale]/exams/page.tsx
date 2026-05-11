'use client';

import { FormEvent, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  FileCheck2,
  Eye,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { DraftPreviewCard } from '@/components/authoring/draft-preview-card';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, Input, Label } from '@/components/ui';
import { formatDraftValue, parseCsv, parseList } from '@/features/authoring/draft-utils';
import { useCourse, useCourses } from '@/hooks/use-courses';
import { useCreateExam, useExam, useExams } from '@/hooks/use-exams';
import { Exam, ExamQuestionType } from '@/lib/exam-api';

type ExamQuestionDraft = {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  points: string;
  skillTags: string;
  explanation: string;
};

function createExamQuestionDraft(type: ExamQuestionType = 'MULTIPLE_CHOICE'): ExamQuestionDraft {
  return {
    id:
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    prompt: '',
    optionsText: '',
    correctAnswer: '',
    points: '1',
    skillTags: '',
    explanation: '',
  };
}

export default function AdminExamsPage() {
  const t = useTranslations('Admin');
  const { data: courseData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const courses = useMemo(() => courseData?.data ?? [], [courseData]);
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [passingScore, setPassingScore] = useState('60');
  const [isPublished, setIsPublished] = useState(true);
  const [sectionTitle, setSectionTitle] = useState('');
  const [questionDrafts, setQuestionDrafts] = useState<ExamQuestionDraft[]>(() => [
    createExamQuestionDraft(),
  ]);
  const [templateExamId, setTemplateExamId] = useState('');
  const [templateAction, setTemplateAction] = useState<'load' | 'duplicate' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const query = { courseId: courseId || undefined, unitId: unitId || undefined };
  const { data: exams = [], isLoading: examsLoading } = useExams(query);
  const { data: templateExam, isLoading: templateLoading } = useExam(templateExamId);
  const createExam = useCreateExam();
  const selectedUnit = units.find((unit) => unit.id === unitId) ?? null;
  const draft = useMemo(
    () =>
      buildExamDraft({
        courseId,
        title,
        sectionTitle,
        durationMinutes,
        passingScore,
        questionDrafts,
      }),
    [courseId, durationMinutes, passingScore, questionDrafts, sectionTitle, title],
  );

  useEffect(() => {
    if (!courseId && courses[0]?.id) {
      setCourseId(courses[0].id);
    }
  }, [courseId, courses]);

  useEffect(() => {
    setUnitId('');
  }, [courseId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!templateExam || !templateAction) return;

    hydrateDraftFromExam(templateExam, templateAction === 'duplicate', {
      setCourseId,
      setUnitId,
      setTitle,
      setDescription,
      setDurationMinutes,
      setPassingScore,
      setIsPublished,
      setSectionTitle,
      setQuestionDrafts,
      duplicateTitle: (value) => t('duplicatedExamTitle', { title: value }),
    });
    setMessage({
      type: 'success',
      text: templateAction === 'duplicate' ? t('examDuplicatedToDraft') : t('examLoadedToDraft'),
    });
    setTemplateAction(null);
    setTemplateExamId('');
  }, [t, templateAction, templateExam]);

  const handleCreateExam = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.checks.course || !draft.checks.title || !draft.checks.section) {
      setMessage({ type: 'error', text: t('examRequiredFields') });
      return;
    }

    if (!draft.checks.hasQuestions) {
      setMessage({ type: 'error', text: t('examQuestionsRequired') });
      return;
    }

    if (!draft.checks.duration || !draft.checks.passingScore) {
      setMessage({ type: 'error', text: t('examNumericFieldsRequired') });
      return;
    }

    if (draft.invalidQuestionCount > 0) {
      setMessage({ type: 'error', text: t('examQuestionValidationError') });
      return;
    }

    createExam.mutate(
      {
        courseId,
        unitId: unitId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: draft.durationMinutes ?? 0,
        passingScore: draft.passingScore ?? 0,
        isPublished,
        sections: [
          {
            title: sectionTitle.trim(),
            questions: draft.questions,
          },
        ],
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setSectionTitle('');
          setQuestionDrafts([createExamQuestionDraft()]);
          setMessage({ type: 'success', text: t('examCreated') });
        },
        onError: () => setMessage({ type: 'error', text: t('examCreateError') }),
      },
    );
  };

  const updateQuestionDraft = (id: string, patch: Partial<ExamQuestionDraft>) => {
    setQuestionDrafts((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  };

  const addQuestionDraft = () => {
    const lastType = questionDrafts.at(-1)?.type ?? 'MULTIPLE_CHOICE';
    setQuestionDrafts((current) => [...current, createExamQuestionDraft(lastType)]);
  };

  const duplicateQuestionDraft = (id: string) => {
    setQuestionDrafts((current) => {
      const index = current.findIndex((question) => question.id === id);
      if (index === -1) return current;

      const next = [...current];
      next.splice(index + 1, 0, {
        ...current[index],
        id: createExamQuestionDraft().id,
      });
      return next;
    });
  };

  const removeQuestionDraft = (id: string) => {
    setQuestionDrafts((current) =>
      current.length <= 1 ? current : current.filter((question) => question.id !== id),
    );
  };

  const moveQuestionDraft = (id: string, direction: -1 | 1) => {
    setQuestionDrafts((current) => {
      const index = current.findIndex((question) => question.id === id);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [question] = next.splice(index, 1);
      next.splice(nextIndex, 0, question);
      return next;
    });
  };

  const loadExamTemplate = (examId: string, action: 'load' | 'duplicate') => {
    setTemplateExamId(examId);
    setTemplateAction(action);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('exams')} description={t('examManagementDesc')} />

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

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('courseName')}</Label>
                <select
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
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
                  value={unitId}
                  onChange={(event) => setUnitId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!courseId}
                >
                  <option value="">{t('allUnits')}</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!courseId ? (
              <Alert>
                <FileCheck2 className="h-4 w-4" />
                <AlertDescription>{t('examSelectCourseFirst')}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
                <section className="rounded-xl border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold">{t('examTemplates')}</h2>
                      <p className="text-sm text-muted-foreground">{t('examTemplatesDesc')}</p>
                    </div>
                    <Badge variant="secondary">{exams.length}</Badge>
                  </div>

                  {examsLoading ? (
                    <LoadingRow label={t('loading')} />
                  ) : exams.length === 0 ? (
                    <EmptyState title={t('noExams')} />
                  ) : (
                    <div className="grid gap-3">
                      {exams.map((exam) => (
                        <article key={exam.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold">{exam.title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {exam.unit?.title || t('allUnits')}
                              </p>
                            </div>
                            <Badge variant={exam.isPublished ? 'success' : 'outline'}>
                              {exam.isPublished ? t('published') : t('draft')}
                            </Badge>
                          </div>
                          {exam.description && (
                            <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>{t('durationValue', { minutes: exam.durationMinutes })}</span>
                            <span>{t('passingScoreValue', { value: exam.passingScore ?? 0 })}</span>
                            <span>{t('sectionCount', { count: exam._count?.sections ?? 0 })}</span>
                            <span>{t('attemptCount', { count: exam._count?.attempts ?? 0 })}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              disabled={templateLoading && templateExamId === exam.id}
                              onClick={() => loadExamTemplate(exam.id, 'load')}
                            >
                              {templateLoading && templateExamId === exam.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              {t('loadExamToDraft')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="gap-2"
                              disabled={templateLoading && templateExamId === exam.id}
                              onClick={() => loadExamTemplate(exam.id, 'duplicate')}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {t('duplicateExam')}
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <aside className="space-y-6">
                  <DraftPreviewCard
                    title={t('examPreview')}
                    ready={draft.isReady}
                    rows={[
                      { label: t('courseName'), value: selectedCourse?.title ?? t('selectCourse') },
                      { label: t('unit'), value: selectedUnit?.title ?? t('allUnits') },
                      { label: t('status'), value: isPublished ? t('published') : t('draft') },
                      {
                        label: t('examTitle'),
                        value: title.trim() || t('examTitlePlaceholder'),
                      },
                      {
                        label: t('sectionTitle'),
                        value: sectionTitle.trim() || t('sectionTitlePlaceholder'),
                      },
                      {
                        label: t('examQuestions'),
                        value: draft.questionCount,
                      },
                      {
                        label: t('sections'),
                        value: draft.sectionCount,
                      },
                      {
                        label: t('durationMinutes'),
                        value: draft.durationMinutes ?? 0,
                      },
                      {
                        label: t('passingScore'),
                        value: draft.passingScore ?? 0,
                      },
                      {
                        label: t('readyQuestions'),
                        value: `${draft.validQuestionCount}/${draft.questionCount}`,
                      },
                    ]}
                    checklist={[
                      { label: t('courseName'), ok: draft.checks.course },
                      { label: t('examTitle'), ok: draft.checks.title },
                      { label: t('sectionTitle'), ok: draft.checks.section },
                      { label: t('examQuestions'), ok: draft.checks.questions },
                      { label: t('durationMinutes'), ok: draft.checks.duration },
                      { label: t('passingScore'), ok: draft.checks.passingScore },
                    ]}
                  />

                  <form onSubmit={handleCreateExam} className="rounded-xl border bg-card p-5">
                    <h2 className="mb-4 text-base font-semibold">{t('createExam')}</h2>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>{t('examTitle')}</Label>
                        <Input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder={t('examTitlePlaceholder')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('description')}</Label>
                        <textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>{t('durationMinutes')}</Label>
                          <Input
                            value={durationMinutes}
                            onChange={(event) => setDurationMinutes(event.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t('passingScore')}</Label>
                          <Input
                            value={passingScore}
                            onChange={(event) => setPassingScore(event.target.value)}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(event) => setIsPublished(event.target.checked)}
                        />
                        {t('publishNow')}
                      </label>

                      <div className="border-t pt-4 space-y-4">
                        <div className="space-y-1.5">
                          <Label>{t('sectionTitle')}</Label>
                          <Input
                            value={sectionTitle}
                            onChange={(event) => setSectionTitle(event.target.value)}
                            placeholder={t('sectionTitlePlaceholder')}
                          />
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Label>{t('examQuestions')}</Label>
                            <p className="text-xs text-muted-foreground">
                              {t('examQuestionsDesc')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addQuestionDraft}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold hover:bg-muted"
                          >
                            <Plus className="h-4 w-4" />
                            {t('addQuestion')}
                          </button>
                        </div>

                        <div className="space-y-4">
                          {questionDrafts.map((draftItem, index) => (
                            <QuestionDraftCard
                              key={draftItem.id}
                              draft={draftItem}
                              index={index}
                              canMoveUp={index > 0}
                              canMoveDown={index < questionDrafts.length - 1}
                              canRemove={questionDrafts.length > 1}
                              onChange={(patch) => updateQuestionDraft(draftItem.id, patch)}
                              onDuplicate={() => duplicateQuestionDraft(draftItem.id)}
                              onRemove={() => removeQuestionDraft(draftItem.id)}
                              onMoveUp={() => moveQuestionDraft(draftItem.id, -1)}
                              onMoveDown={() => moveQuestionDraft(draftItem.id, 1)}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={createExam.isPending}
                      >
                        {createExam.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {t('createExam')}
                      </Button>
                    </div>
                  </form>
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{title}</div>
  );
}

function QuestionDraftCard({
  draft,
  index,
  canMoveUp,
  canMoveDown,
  canRemove,
  onChange,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  t,
}: {
  draft: ExamQuestionDraft;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<ExamQuestionDraft>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  t: ReturnType<typeof useTranslations<'Admin'>>;
}) {
  const options = parseList(draft.optionsText);
  const points = parsePositiveNumber(draft.points);
  const hasCorrectAnswer = draft.correctAnswer.trim().length > 0;
  const correctAnswerIndex = Number(draft.correctAnswer);
  const correctAnswerIsNumeric = hasCorrectAnswer && Number.isInteger(correctAnswerIndex);
  const correctAnswerInRange =
    draft.type === 'MULTIPLE_CHOICE'
      ? correctAnswerIsNumeric && correctAnswerIndex >= 0 && correctAnswerIndex < options.length
      : hasCorrectAnswer;
  const isReady =
    draft.prompt.trim().length > 0 &&
    (draft.type !== 'MULTIPLE_CHOICE' || options.length >= 2) &&
    correctAnswerInRange &&
    points !== null;

  return (
    <article className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{t('questionLabel', { index: index + 1 })}</h3>
            <Badge variant={isReady ? 'success' : 'outline'}>
              {isReady ? t('readyToSave') : t('needsAttention')}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {draft.type === 'MULTIPLE_CHOICE' ? t('multipleChoice') : t('fillBlank')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title={t('moveUp')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title={t('moveDown')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-40"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            title={t('duplicateQuestion')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            title={t('remove')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-destructive disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('questionPrompt')}</Label>
          <textarea
            value={draft.prompt}
            onChange={(event) => onChange({ prompt: event.target.value })}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t('questionPromptPlaceholder')}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t('questionType')}</Label>
          <select
            value={draft.type}
            onChange={(event) => onChange({ type: event.target.value as ExamQuestionType })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
            <option value="FILL_BLANK">{t('fillBlank')}</option>
          </select>
        </div>

        {draft.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-1.5">
            <Label>{t('answerOptions')}</Label>
            <textarea
              value={draft.optionsText}
              onChange={(event) => onChange({ optionsText: event.target.value })}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t('answerOptionsPlaceholder')}
            />
          </div>
        )}

        <div className="grid grid-cols-[1fr_90px] gap-3">
          <div className="space-y-1.5">
            <Label>{t('correctAnswer')}</Label>
            <Input
              value={draft.correctAnswer}
              onChange={(event) => onChange({ correctAnswer: event.target.value })}
              placeholder={
                draft.type === 'MULTIPLE_CHOICE'
                  ? t('correctAnswerIndexPlaceholder')
                  : t('correctAnswerTextPlaceholder')
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('points')}</Label>
            <Input
              value={draft.points}
              onChange={(event) => onChange({ points: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('skillTags')}</Label>
          <Input
            value={draft.skillTags}
            onChange={(event) => onChange({ skillTags: event.target.value })}
            placeholder={t('skillTagsPlaceholder')}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t('explanation')}</Label>
          <textarea
            value={draft.explanation}
            onChange={(event) => onChange({ explanation: event.target.value })}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </article>
  );
}

function buildExamDraft(params: {
  courseId: string;
  title: string;
  sectionTitle: string;
  durationMinutes: string;
  passingScore: string;
  questionDrafts: ExamQuestionDraft[];
}) {
  const durationMinutes = parsePositiveInteger(params.durationMinutes);
  const passingScore = parsePercentage(params.passingScore);
  const questions = params.questionDrafts.map((draft) => buildExamQuestionPayload(draft));
  const checks = {
    course: Boolean(params.courseId),
    title: params.title.trim().length > 0,
    section: params.sectionTitle.trim().length > 0,
    duration: durationMinutes !== null,
    passingScore: passingScore !== null,
    hasQuestions: questions.length > 0,
    questions: questions.length > 0 && questions.every((question) => question.valid),
  };

  return {
    durationMinutes,
    passingScore,
    sectionCount: 1,
    questionCount: questions.length,
    validQuestionCount: questions.filter((question) => question.valid).length,
    invalidQuestionCount: questions.filter((question) => !question.valid).length,
    questions: questions.map((question) => question.payload),
    checks,
    isReady: Object.values(checks).every(Boolean),
  };
}

function buildExamQuestionPayload(draft: ExamQuestionDraft) {
  const options = parseList(draft.optionsText);
  const points = parsePositiveNumber(draft.points);
  const skillTags = parseCsv(draft.skillTags);
  const hasCorrectAnswer = draft.correctAnswer.trim().length > 0;
  const correctAnswerIndex = Number(draft.correctAnswer);
  const correctAnswerIsNumeric = hasCorrectAnswer && Number.isInteger(correctAnswerIndex);
  const correctAnswerInRange =
    draft.type === 'MULTIPLE_CHOICE'
      ? correctAnswerIsNumeric && correctAnswerIndex >= 0 && correctAnswerIndex < options.length
      : hasCorrectAnswer;
  const valid =
    draft.prompt.trim().length > 0 &&
    (draft.type !== 'MULTIPLE_CHOICE' || options.length >= 2) &&
    correctAnswerInRange &&
    points !== null;

  return {
    valid,
    payload: {
      type: draft.type,
      prompt: draft.prompt.trim(),
      options: draft.type === 'MULTIPLE_CHOICE' ? options : undefined,
      correctAnswer:
        draft.type === 'MULTIPLE_CHOICE' ? correctAnswerIndex : draft.correctAnswer.trim(),
      explanation: draft.explanation.trim() || undefined,
      points: points ?? 1,
      skillTags,
    },
  };
}

function hydrateDraftFromExam(
  exam: Exam,
  duplicate: boolean,
  actions: {
    setCourseId: (value: string) => void;
    setUnitId: (value: string) => void;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setDurationMinutes: (value: string) => void;
    setPassingScore: (value: string) => void;
    setIsPublished: (value: boolean) => void;
    setSectionTitle: (value: string) => void;
    setQuestionDrafts: Dispatch<SetStateAction<ExamQuestionDraft[]>>;
    duplicateTitle: (value: string) => string;
  },
) {
  actions.setCourseId(exam.courseId);
  actions.setUnitId(exam.unitId ?? '');
  actions.setTitle(duplicate ? actions.duplicateTitle(exam.title) : exam.title);
  actions.setDescription(exam.description ?? '');
  actions.setDurationMinutes(String(exam.durationMinutes));
  actions.setPassingScore(String(exam.passingScore ?? 60));
  actions.setIsPublished(exam.isPublished);
  actions.setSectionTitle(exam.sections[0]?.title ?? '');
  const questionDrafts = exam.sections.flatMap((section) =>
    section.questions.map((question) => mapExamQuestionToDraft(question)),
  );

  actions.setQuestionDrafts(
    questionDrafts.length > 0 ? questionDrafts : [createExamQuestionDraft()],
  );
}

function mapExamQuestionToDraft(question: Exam['sections'][number]['questions'][number]) {
  return {
    ...createExamQuestionDraft(question.type),
    type: question.type,
    prompt: question.prompt,
    optionsText:
      question.type === 'MULTIPLE_CHOICE' && Array.isArray(question.options)
        ? question.options.map((option) => String(option)).join('\n')
        : '',
    correctAnswer: formatDraftValue(question.correctAnswer),
    points: String(question.points ?? 1),
    skillTags: question.skillTags.join(', '),
    explanation: question.explanation ?? '',
  };
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePercentage(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}
