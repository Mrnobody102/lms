'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, Input, Label } from '@/components/ui';
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  useCreatePracticeExerciseSet,
  useCreatePracticeQuestion,
  usePracticeExerciseSets,
  usePracticeQuestions,
} from '@/hooks/use-practice';
import { PracticeQuestionType } from '@/lib/practice-api';
import { AlertCircle, BookOpen, CheckCircle2, Dumbbell, Loader2, Plus } from 'lucide-react';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const query = { courseId: courseId || undefined, unitId: unitId || undefined };
  const { data: questions = [], isLoading: questionsLoading } = usePracticeQuestions(query);
  const { data: exerciseSets = [], isLoading: setsLoading } = usePracticeExerciseSets(query);
  const createQuestion = useCreatePracticeQuestion();
  const createExerciseSet = useCreatePracticeExerciseSet();

  useEffect(() => {
    if (!courseId && courses[0]?.id) {
      setCourseId(courses[0].id);
    }
  }, [courseId, courses]);

  useEffect(() => {
    setUnitId('');
    setSelectedQuestionIds([]);
  }, [courseId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const handleCreateQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!courseId || !prompt.trim() || !correctAnswer.trim()) {
      setMessage({ type: 'error', text: t('practiceRequiredFields') });
      return;
    }

    const options =
      questionType === 'MULTIPLE_CHOICE'
        ? optionsText
            .split('\n')
            .map((option) => option.trim())
            .filter(Boolean)
        : undefined;

    if (questionType === 'MULTIPLE_CHOICE' && (!options || options.length < 2)) {
      setMessage({ type: 'error', text: t('practiceOptionsRequired') });
      return;
    }

    const parsedCorrectAnswer =
      questionType === 'MULTIPLE_CHOICE' ? Number(correctAnswer) : correctAnswer.trim();
    if (questionType === 'MULTIPLE_CHOICE' && Number.isNaN(parsedCorrectAnswer)) {
      setMessage({ type: 'error', text: t('practiceCorrectAnswerIndexRequired') });
      return;
    }

    createQuestion.mutate(
      {
        courseId,
        unitId: unitId || undefined,
        type: questionType,
        prompt: prompt.trim(),
        options,
        correctAnswer: parsedCorrectAnswer,
        explanation: explanation.trim() || undefined,
        skillTags: skillTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setPrompt('');
          setOptionsText('');
          setCorrectAnswer('');
          setExplanation('');
          setSkillTags('');
          setMessage({ type: 'success', text: t('practiceQuestionCreated') });
        },
        onError: () => setMessage({ type: 'error', text: t('practiceQuestionCreateError') }),
      },
    );
  };

  const handleCreateExerciseSet = (event: FormEvent) => {
    event.preventDefault();
    if (!courseId || !setTitle.trim() || selectedQuestionIds.length === 0) {
      setMessage({ type: 'error', text: t('practiceSetRequiredFields') });
      return;
    }

    createExerciseSet.mutate(
      {
        courseId,
        unitId: unitId || undefined,
        title: setTitle.trim(),
        description: setDescription.trim() || undefined,
        isPublished: true,
        questionIds: selectedQuestionIds,
      },
      {
        onSuccess: () => {
          setSetTitle('');
          setSetDescription('');
          setSelectedQuestionIds([]);
          setMessage({ type: 'success', text: t('practiceSetCreated') });
        },
        onError: () => setMessage({ type: 'error', text: t('practiceSetCreateError') }),
      },
    );
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
                      <Badge variant="secondary">{questions.length}</Badge>
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
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{question.type}</Badge>
                                {question.skillTags.map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
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
                              <Badge variant={set.isPublished ? 'success' : 'outline'}>
                                {set.isPublished ? t('published') : t('draft')}
                              </Badge>
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
                  <form onSubmit={handleCreateQuestion} className="rounded-xl border bg-card p-5">
                    <h2 className="mb-4 text-base font-semibold">{t('createQuestion')}</h2>
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
                        </select>
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

                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={createQuestion.isPending}
                      >
                        {createQuestion.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {t('createQuestion')}
                      </Button>
                    </div>
                  </form>

                  <form
                    onSubmit={handleCreateExerciseSet}
                    className="rounded-xl border bg-card p-5"
                  >
                    <h2 className="mb-4 text-base font-semibold">{t('createExerciseSet')}</h2>
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
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={createExerciseSet.isPending}
                      >
                        {createExerciseSet.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Dumbbell className="h-4 w-4" />
                        )}
                        {t('createExerciseSet')}
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
