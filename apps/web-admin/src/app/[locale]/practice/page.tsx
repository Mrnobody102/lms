'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DraftPreviewCard } from '@/components/authoring/draft-preview-card';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Input,
  Label,
} from '@/components/ui';
import { formatDraftValue, parseCsv, parseList } from '@/features/authoring/draft-utils';
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  useCreatePracticeExerciseSet,
  useCreatePracticeQuestion,
  useDeletePracticeExerciseSet,
  useDeletePracticeQuestion,
  usePracticeExerciseSets,
  usePracticeExerciseSet,
  usePracticeQuestions,
  useUpdatePracticeExerciseSet,
  useUpdatePracticeQuestion,
} from '@/hooks/use-practice';
import type { PracticeExerciseSet, PracticeQuestion } from '@/lib/practice-api';
import { PracticeQuestionType } from '@/lib/practice-api';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Copy,
  Dumbbell,
  Loader2,
  Plus,
  PencilLine,
  Trash2,
  X,
} from 'lucide-react';

export default function AdminPracticePage() {
  const t = useTranslations('Admin');
  const { data: courseData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const courses = useMemo(() => courseData?.data ?? [], [courseData]);
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [questionType, setQuestionType] = useState<PracticeQuestionType>('MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [skillTags, setSkillTags] = useState('');
  const [setTitle, setSetTitle] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingExerciseSetId, setEditingExerciseSetId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<PracticeQuestion | null>(null);
  const [exerciseSetToDelete, setExerciseSetToDelete] = useState<PracticeExerciseSet | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const selectedUnit = units.find((unit) => unit.id === unitId) ?? null;
  const query = { courseId: courseId || undefined, unitId: unitId || undefined };
  const { data: questions = [], isLoading: questionsLoading } = usePracticeQuestions(query);
  const { data: exerciseSets = [], isLoading: setsLoading } = usePracticeExerciseSets(query);
  const createQuestion = useCreatePracticeQuestion();
  const updateQuestion = useUpdatePracticeQuestion();
  const deleteQuestion = useDeletePracticeQuestion();
  const createExerciseSet = useCreatePracticeExerciseSet();
  const { data: editingExerciseSet } = usePracticeExerciseSet(editingExerciseSetId ?? '');
  const updateExerciseSet = useUpdatePracticeExerciseSet();
  const deleteExerciseSet = useDeletePracticeExerciseSet();
  const questionSaving = createQuestion.isPending || updateQuestion.isPending;
  const exerciseSetSaving = createExerciseSet.isPending || updateExerciseSet.isPending;
  const questionDraft = useMemo(
    () =>
      buildPracticeQuestionDraft({
        courseId,
        questionType,
        prompt,
        optionsText,
        correctAnswer,
        skillTags,
      }),
    [courseId, correctAnswer, optionsText, prompt, questionType, skillTags],
  );
  const exerciseSetDraft = useMemo(
    () =>
      buildPracticeSetDraft({
        courseId,
        setTitle,
        selectedQuestionCount: selectedQuestionIds.length,
        isPublished,
      }),
    [courseId, isPublished, selectedQuestionIds.length, setTitle],
  );

  useEffect(() => {
    if (!courseId && courses[0]?.id) {
      setCourseId(courses[0].id);
    }
  }, [courseId, courses]);

  useEffect(() => {
    setUnitId('');
    setSelectedQuestionIds([]);
    setEditingQuestionId(null);
    setEditingExerciseSetId(null);
  }, [courseId]);

  useEffect(() => {
    if (!editingExerciseSetId || !editingExerciseSet) return;

    setCourseId(editingExerciseSet.courseId);
    setUnitId(editingExerciseSet.unitId ?? '');
    setSetTitle(editingExerciseSet.title);
    setSetDescription(editingExerciseSet.description ?? '');
    setIsPublished(editingExerciseSet.isPublished);
    setSelectedQuestionIds(editingExerciseSet.questions.map((item) => item.question.id));
  }, [editingExerciseSet, editingExerciseSetId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const resetQuestionDraft = () => {
    setEditingQuestionId(null);
    setQuestionType('MULTIPLE_CHOICE');
    setPrompt('');
    setOptionsText('');
    setCorrectAnswer('');
    setExplanation('');
    setSkillTags('');
  };

  const resetExerciseSetDraft = () => {
    setEditingExerciseSetId(null);
    setSetTitle('');
    setSetDescription('');
    setSelectedQuestionIds([]);
    setIsPublished(true);
  };

  const handleSubmitQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!questionDraft.checks.course || !questionDraft.checks.prompt || !correctAnswer.trim()) {
      setMessage({ type: 'error', text: t('practiceRequiredFields') });
      return;
    }

    if (!questionDraft.checks.options) {
      setMessage({ type: 'error', text: t('practiceOptionsRequired') });
      return;
    }

    if (questionType === 'MULTIPLE_CHOICE' && !questionDraft.correctAnswerIsNumeric) {
      setMessage({ type: 'error', text: t('practiceCorrectAnswerIndexRequired') });
      return;
    }

    if (!questionDraft.checks.correctAnswer) {
      setMessage({ type: 'error', text: t('practiceCorrectAnswerIndexRangeRequired') });
      return;
    }

    const payload = {
      unitId: unitId || null,
      type: questionType,
      prompt: prompt.trim(),
      options: questionType === 'MULTIPLE_CHOICE' ? questionDraft.options : undefined,
      correctAnswer: questionDraft.correctAnswerValue,
      explanation: explanation.trim() || null,
      skillTags: questionDraft.skillTags,
    };

    const mutation = editingQuestionId
      ? updateQuestion.mutateAsync({ id: editingQuestionId, payload })
      : createQuestion.mutateAsync({
          courseId,
          unitId: unitId || undefined,
          type: questionType,
          prompt: prompt.trim(),
          options: questionType === 'MULTIPLE_CHOICE' ? questionDraft.options : undefined,
          correctAnswer: questionDraft.correctAnswerValue,
          explanation: explanation.trim() || undefined,
          skillTags: questionDraft.skillTags,
        });

    mutation
      .then(() => {
        resetQuestionDraft();
        setMessage({
          type: 'success',
          text: editingQuestionId ? t('practiceQuestionUpdated') : t('practiceQuestionCreated'),
        });
      })
      .catch(() =>
        setMessage({
          type: 'error',
          text: editingQuestionId
            ? t('practiceQuestionUpdateError')
            : t('practiceQuestionCreateError'),
        }),
      );
  };

  const handleDuplicateQuestion = (question: PracticeQuestion) => {
    createQuestion.mutate(
      {
        courseId,
        unitId: question.unitId ?? (unitId || undefined),
        type: question.type,
        prompt: question.prompt,
        options: question.type === 'MULTIPLE_CHOICE' ? question.options : undefined,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation ?? undefined,
        skillTags: question.skillTags,
      },
      {
        onSuccess: () => setMessage({ type: 'success', text: t('practiceQuestionDuplicated') }),
        onError: () => setMessage({ type: 'error', text: t('practiceQuestionDuplicateError') }),
      },
    );
  };

  const handleEditQuestion = (question: PracticeQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionType(question.type);
    setPrompt(question.prompt);
    setOptionsText(
      question.type === 'MULTIPLE_CHOICE' && Array.isArray(question.options)
        ? question.options.map((option) => String(option)).join('\n')
        : '',
    );
    setCorrectAnswer(formatDraftValue(question.correctAnswer));
    setExplanation(question.explanation ?? '');
    setSkillTags(question.skillTags.join(', '));
    setUnitId(question.unitId ?? '');
    setMessage({ type: 'success', text: t('practiceQuestionLoadedDraft') });
  };

  const handleUseQuestionAsDraft = (question: PracticeQuestion) => {
    setEditingQuestionId(null);
    setQuestionType(question.type);
    setPrompt(question.prompt);
    setOptionsText(
      question.type === 'MULTIPLE_CHOICE' && Array.isArray(question.options)
        ? question.options.map((option) => String(option)).join('\n')
        : '',
    );
    setCorrectAnswer(formatDraftValue(question.correctAnswer));
    setExplanation(question.explanation ?? '');
    setSkillTags(question.skillTags.join(', '));
    setMessage({ type: 'success', text: t('practiceQuestionLoadedDraft') });
  };

  const handleDeleteQuestion = (question: PracticeQuestion) => {
    setQuestionToDelete(question);
  };

  const selectAllQuestions = () => {
    setSelectedQuestionIds(questions.map((question) => question.id));
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const handleSubmitExerciseSet = (event: FormEvent) => {
    event.preventDefault();
    if (
      !exerciseSetDraft.checks.course ||
      !exerciseSetDraft.checks.title ||
      selectedQuestionIds.length === 0
    ) {
      setMessage({ type: 'error', text: t('practiceSetRequiredFields') });
      return;
    }

    const payload = {
      unitId: unitId || null,
      title: setTitle.trim(),
      description: setDescription.trim() || null,
      isPublished,
      questionIds: selectedQuestionIds,
    };

    const mutation = editingExerciseSetId
      ? updateExerciseSet.mutateAsync({ id: editingExerciseSetId, payload })
      : createExerciseSet.mutateAsync({
          courseId,
          unitId: unitId || undefined,
          title: setTitle.trim(),
          description: setDescription.trim() || undefined,
          isPublished,
          questionIds: selectedQuestionIds,
        });

    mutation
      .then(() => {
        resetExerciseSetDraft();
        setMessage({
          type: 'success',
          text: editingExerciseSetId ? t('practiceSetUpdated') : t('practiceSetCreated'),
        });
      })
      .catch(() =>
        setMessage({
          type: 'error',
          text: editingExerciseSetId ? t('practiceSetUpdateError') : t('practiceSetCreateError'),
        }),
      );
  };

  const handleEditExerciseSet = (set: PracticeExerciseSet) => {
    setEditingExerciseSetId(set.id);
  };

  const handleDeleteExerciseSet = (set: PracticeExerciseSet) => {
    setExerciseSetToDelete(set);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('practice')} description={t('practiceManagementDesc')} />

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
                  onChange={(event) => {
                    setUnitId(event.target.value);
                    setSelectedQuestionIds([]);
                  }}
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
                <BookOpen className="h-4 w-4" />
                <AlertDescription>{t('practiceSelectCourseFirst')}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-6">
                  <section className="rounded-xl border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold">{t('questionBank')}</h2>
                        <p className="text-sm text-muted-foreground">{t('questionBankDesc')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{questions.length}</Badge>
                        <Button variant="outline" size="sm" onClick={selectAllQuestions}>
                          {t('selectAllQuestions')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelectedQuestions}>
                          {t('clearSelection')}
                        </Button>
                      </div>
                    </div>

                    {questionsLoading ? (
                      <LoadingRow label={t('loading')} />
                    ) : questions.length === 0 ? (
                      <EmptyState title={t('noPracticeQuestions')} />
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {questions.map((question) => (
                          <label
                            key={question.id}
                            className="flex cursor-pointer items-start gap-3 px-4 py-3"
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedQuestionIds.includes(question.id)}
                              onChange={(event) => {
                                setSelectedQuestionIds((current) =>
                                  event.target.checked
                                    ? [...current, question.id]
                                    : current.filter((id) => id !== question.id),
                                );
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">
                                    {question.type === 'MULTIPLE_CHOICE'
                                      ? t('multipleChoice')
                                      : question.type === 'FILL_BLANK'
                                        ? t('fillBlank')
                                        : question.type === 'AI_EVALUATED_AUDIO'
                                          ? t('aiEvaluatedAudio')
                                          : t('aiEvaluatedText')}
                                  </Badge>
                                  {question.skillTags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleEditQuestion(question);
                                    }}
                                    title={t('editQuestion')}
                                    aria-label={t('editQuestion')}
                                  >
                                    <PencilLine className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleUseQuestionAsDraft(question);
                                    }}
                                    title={t('useQuestionAsDraft')}
                                    aria-label={t('useQuestionAsDraft')}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleDuplicateQuestion(question);
                                    }}
                                    title={t('duplicateQuestion')}
                                    aria-label={t('duplicateQuestion')}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleDeleteQuestion(question);
                                    }}
                                    title={t('deleteQuestion')}
                                    aria-label={t('deleteQuestion')}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <p className="mt-2 text-sm font-medium">{question.prompt}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold">{t('exerciseSets')}</h2>
                        <p className="text-sm text-muted-foreground">{t('exerciseSetsDesc')}</p>
                      </div>
                      <Badge variant="secondary">{exerciseSets.length}</Badge>
                    </div>

                    {setsLoading ? (
                      <LoadingRow label={t('loading')} />
                    ) : exerciseSets.length === 0 ? (
                      <EmptyState title={t('noExerciseSets')} />
                    ) : (
                      <div className="grid gap-3">
                        {exerciseSets.map((set) => (
                          <div key={set.id} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold">{set.title}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {set.unit?.title || t('allUnits')}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Badge variant={set.isPublished ? 'success' : 'outline'}>
                                  {set.isPublished ? t('published') : t('draft')}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditExerciseSet(set)}
                                  title={t('editExerciseSet')}
                                  aria-label={t('editExerciseSet')}
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteExerciseSet(set)}
                                  title={t('deleteExerciseSet')}
                                  aria-label={t('deleteExerciseSet')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {t('questionCount', { count: set._count?.questions ?? 0 })}
                              </span>
                              <span>{t('attemptCount', { count: set._count?.attempts ?? 0 })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="space-y-6">
                  <DraftPreviewCard
                    title={t('practiceQuestionPreview')}
                    ready={questionDraft.isReady}
                    rows={[
                      { label: t('courseName'), value: selectedCourse?.title ?? t('selectCourse') },
                      { label: t('unit'), value: selectedUnit?.title ?? t('allUnits') },
                      {
                        label: t('questionType'),
                        value: getPracticeQuestionTypeLabel(questionType, t),
                      },
                      {
                        label: t('questionPrompt'),
                        value: prompt.trim() || t('questionPromptPlaceholder'),
                      },
                      {
                        label: t('answerOptions'),
                        value: questionDraft.options.length,
                      },
                      {
                        label: t('skillTags'),
                        value: questionDraft.skillTags.length,
                      },
                    ]}
                    checklist={[
                      { label: t('courseName'), ok: questionDraft.checks.course },
                      { label: t('questionPrompt'), ok: questionDraft.checks.prompt },
                      { label: t('answerOptions'), ok: questionDraft.checks.options },
                      { label: t('correctAnswer'), ok: questionDraft.checks.correctAnswer },
                    ]}
                  />

                  <form onSubmit={handleSubmitQuestion} className="rounded-xl border bg-card p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold">
                        {editingQuestionId ? t('editQuestion') : t('createQuestion')}
                      </h2>
                      {editingQuestionId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={resetQuestionDraft}
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('cancelEdit')}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>{t('questionType')}</Label>
                        <select
                          value={questionType}
                          onChange={(event) =>
                            setQuestionType(event.target.value as PracticeQuestionType)
                          }
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
                          <option value="FILL_BLANK">{t('fillBlank')}</option>
                          <option value="AI_EVALUATED_AUDIO">{t('aiEvaluatedAudio')}</option>
                          <option value="AI_EVALUATED_TEXT">{t('aiEvaluatedText')}</option>
                        </select>
                        {(questionType === 'AI_EVALUATED_AUDIO' ||
                          questionType === 'AI_EVALUATED_TEXT') && (
                          <p className="text-xs text-muted-foreground">{t('aiQuestionHint')}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label>{t('questionPrompt')}</Label>
                        <textarea
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder={t('questionPromptPlaceholder')}
                        />
                      </div>

                      {questionType === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-1.5">
                          <Label>{t('answerOptions')}</Label>
                          <textarea
                            value={optionsText}
                            onChange={(event) => setOptionsText(event.target.value)}
                            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder={t('answerOptionsPlaceholder')}
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label>{t('correctAnswer')}</Label>
                        <Input
                          value={correctAnswer}
                          onChange={(event) => setCorrectAnswer(event.target.value)}
                          placeholder={
                            questionType === 'MULTIPLE_CHOICE'
                              ? t('correctAnswerIndexPlaceholder')
                              : t('correctAnswerTextPlaceholder')
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>{t('skillTags')}</Label>
                        <Input
                          value={skillTags}
                          onChange={(event) => setSkillTags(event.target.value)}
                          placeholder={t('skillTagsPlaceholder')}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>{t('explanation')}</Label>
                        <textarea
                          value={explanation}
                          onChange={(event) => setExplanation(event.target.value)}
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>

                      <Button type="submit" className="w-full gap-2" disabled={questionSaving}>
                        {questionSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editingQuestionId ? (
                          <PencilLine className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {editingQuestionId ? t('updateQuestion') : t('createQuestion')}
                      </Button>
                    </div>
                  </form>

                  <DraftPreviewCard
                    title={t('exerciseSetPreview')}
                    ready={exerciseSetDraft.isReady}
                    rows={[
                      { label: t('courseName'), value: selectedCourse?.title ?? t('selectCourse') },
                      { label: t('unit'), value: selectedUnit?.title ?? t('allUnits') },
                      { label: t('status'), value: isPublished ? t('published') : t('draft') },
                      {
                        label: t('exerciseSetTitle'),
                        value: setTitle.trim() || t('exerciseSetTitlePlaceholder'),
                      },
                      {
                        label: t('questionCount'),
                        value: selectedQuestionIds.length,
                      },
                    ]}
                    checklist={[
                      { label: t('courseName'), ok: exerciseSetDraft.checks.course },
                      { label: t('exerciseSetTitle'), ok: exerciseSetDraft.checks.title },
                      {
                        label: t('selectedQuestionsValue', { count: 1 }),
                        ok: exerciseSetDraft.checks.questions,
                      },
                    ]}
                  />

                  <form
                    onSubmit={handleSubmitExerciseSet}
                    className="rounded-xl border bg-card p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold">
                        {editingExerciseSetId ? t('editExerciseSet') : t('createExerciseSet')}
                      </h2>
                      {editingExerciseSetId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={resetExerciseSetDraft}
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('cancelEdit')}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>{t('exerciseSetTitle')}</Label>
                        <Input
                          value={setTitle}
                          onChange={(event) => setSetTitle(event.target.value)}
                          placeholder={t('exerciseSetTitlePlaceholder')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('description')}</Label>
                        <textarea
                          value={setDescription}
                          onChange={(event) => setSetDescription(event.target.value)}
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                        {t('selectedQuestionsValue', { count: selectedQuestionIds.length })}
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(event) => setIsPublished(event.target.checked)}
                        />
                        {t('publishNow')}
                      </label>
                      <Button type="submit" className="w-full gap-2" disabled={exerciseSetSaving}>
                        {exerciseSetSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editingExerciseSetId ? (
                          <PencilLine className="h-4 w-4" />
                        ) : (
                          <Dumbbell className="h-4 w-4" />
                        )}
                        {editingExerciseSetId ? t('updateExerciseSet') : t('createExerciseSet')}
                      </Button>
                    </div>
                  </form>
                </aside>
              </div>
            )}
          </div>
        </main>
        <DeleteConfirmDialog
          open={Boolean(questionToDelete)}
          title={t('deleteQuestion')}
          description={t('confirmDeleteQuestion')}
          confirmLabel={t('deleteQuestion')}
          cancelLabel={t('cancel')}
          pending={deleteQuestion.isPending}
          onOpenChange={(open) => {
            if (!open) setQuestionToDelete(null);
          }}
          onConfirm={() => {
            if (!questionToDelete) return;
            deleteQuestion.mutate(questionToDelete.id, {
              onSuccess: () => {
                if (editingQuestionId === questionToDelete.id) resetQuestionDraft();
                setQuestionToDelete(null);
                setMessage({ type: 'success', text: t('practiceQuestionDeleted') });
              },
              onError: () => setMessage({ type: 'error', text: t('practiceQuestionDeleteError') }),
            });
          }}
        />
        <DeleteConfirmDialog
          open={Boolean(exerciseSetToDelete)}
          title={t('deleteExerciseSet')}
          description={t('confirmDeleteExerciseSet')}
          confirmLabel={t('deleteExerciseSet')}
          cancelLabel={t('cancel')}
          pending={deleteExerciseSet.isPending}
          onOpenChange={(open) => {
            if (!open) setExerciseSetToDelete(null);
          }}
          onConfirm={() => {
            if (!exerciseSetToDelete) return;
            deleteExerciseSet.mutate(exerciseSetToDelete.id, {
              onSuccess: () => {
                if (editingExerciseSetId === exerciseSetToDelete.id) resetExerciseSetDraft();
                setExerciseSetToDelete(null);
                setMessage({ type: 'success', text: t('practiceSetDeleted') });
              },
              onError: () => setMessage({ type: 'error', text: t('practiceSetDeleteError') }),
            });
          }}
        />
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

function DeleteConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function buildPracticeQuestionDraft(params: {
  courseId: string;
  questionType: PracticeQuestionType;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  skillTags: string;
}) {
  const options = parseList(params.optionsText);
  const skillTags = parseCsv(params.skillTags);
  const hasCorrectAnswer = params.correctAnswer.trim().length > 0;
  const correctAnswerIndex = Number(params.correctAnswer);
  const correctAnswerIsNumeric = hasCorrectAnswer && Number.isInteger(correctAnswerIndex);
  const correctAnswerInRange =
    params.questionType === 'MULTIPLE_CHOICE'
      ? correctAnswerIsNumeric && correctAnswerIndex >= 0 && correctAnswerIndex < options.length
      : hasCorrectAnswer;

  const checks = {
    course: Boolean(params.courseId),
    prompt: params.prompt.trim().length > 0,
    options: params.questionType !== 'MULTIPLE_CHOICE' || options.length >= 2,
    correctAnswer: correctAnswerInRange,
  };

  return {
    options,
    skillTags,
    correctAnswerValue:
      params.questionType === 'MULTIPLE_CHOICE' ? correctAnswerIndex : params.correctAnswer.trim(),
    correctAnswerIsNumeric,
    checks,
    isReady: Object.values(checks).every(Boolean),
  };
}

function buildPracticeSetDraft(params: {
  courseId: string;
  setTitle: string;
  selectedQuestionCount: number;
  isPublished: boolean;
}) {
  const checks = {
    course: Boolean(params.courseId),
    title: params.setTitle.trim().length > 0,
    questions: params.selectedQuestionCount > 0,
  };

  return {
    isPublished: params.isPublished,
    checks,
    isReady: Object.values(checks).every(Boolean),
  };
}

function getPracticeQuestionTypeLabel(
  type: PracticeQuestionType,
  t: ReturnType<typeof useTranslations<'Admin'>>,
) {
  if (type === 'MULTIPLE_CHOICE') return t('multipleChoice');
  if (type === 'FILL_BLANK') return t('fillBlank');
  if (type === 'AI_EVALUATED_AUDIO') return t('aiEvaluatedAudio');
  return t('aiEvaluatedText');
}
