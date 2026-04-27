'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, FileCheck2, Loader2, Plus } from 'lucide-react';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Button, Input, Label } from '@/components/ui';
import { useCourse, useCourses } from '@/hooks/use-courses';
import { useCreateExam, useExams } from '@/hooks/use-exams';
import { ExamQuestionType } from '@/lib/exam-api';

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
  const [questionType, setQuestionType] = useState<ExamQuestionType>('MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState('1');
  const [skillTags, setSkillTags] = useState('');
  const [explanation, setExplanation] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const query = { courseId: courseId || undefined, unitId: unitId || undefined };
  const { data: exams = [], isLoading: examsLoading } = useExams(query);
  const createExam = useCreateExam();

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

  const handleCreateExam = (event: FormEvent) => {
    event.preventDefault();
    if (
      !courseId ||
      !title.trim() ||
      !sectionTitle.trim() ||
      !prompt.trim() ||
      !correctAnswer.trim()
    ) {
      setMessage({ type: 'error', text: t('examRequiredFields') });
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
      setMessage({ type: 'error', text: t('examOptionsRequired') });
      return;
    }

    const parsedCorrectAnswer =
      questionType === 'MULTIPLE_CHOICE' ? Number(correctAnswer) : correctAnswer.trim();
    if (questionType === 'MULTIPLE_CHOICE' && Number.isNaN(parsedCorrectAnswer)) {
      setMessage({ type: 'error', text: t('examCorrectAnswerIndexRequired') });
      return;
    }

    const parsedDuration = Number(durationMinutes);
    const parsedPassingScore = Number(passingScore);
    const parsedPoints = Number(points);
    if (
      Number.isNaN(parsedDuration) ||
      Number.isNaN(parsedPassingScore) ||
      Number.isNaN(parsedPoints)
    ) {
      setMessage({ type: 'error', text: t('examNumericFieldsRequired') });
      return;
    }

    createExam.mutate(
      {
        courseId,
        unitId: unitId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: parsedDuration,
        passingScore: parsedPassingScore,
        isPublished,
        sections: [
          {
            title: sectionTitle.trim(),
            questions: [
              {
                type: questionType,
                prompt: prompt.trim(),
                options,
                correctAnswer: parsedCorrectAnswer,
                explanation: explanation.trim() || undefined,
                points: parsedPoints,
                skillTags: skillTags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              },
            ],
          },
        ],
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setSectionTitle('');
          setPrompt('');
          setOptionsText('');
          setCorrectAnswer('');
          setPoints('1');
          setSkillTags('');
          setExplanation('');
          setMessage({ type: 'success', text: t('examCreated') });
        },
        onError: () => setMessage({ type: 'error', text: t('examCreateError') }),
      },
    );
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
                        </article>
                      ))}
                    </div>
                  )}
                </section>

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
                      <div className="space-y-1.5">
                        <Label>{t('questionType')}</Label>
                        <select
                          value={questionType}
                          onChange={(event) =>
                            setQuestionType(event.target.value as ExamQuestionType)
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
                      <div className="grid grid-cols-[1fr_90px] gap-3">
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
                          <Label>{t('points')}</Label>
                          <Input
                            value={points}
                            onChange={(event) => setPoints(event.target.value)}
                          />
                        </div>
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
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={createExam.isPending}>
                      {createExam.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {t('createExam')}
                    </Button>
                  </div>
                </form>
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
