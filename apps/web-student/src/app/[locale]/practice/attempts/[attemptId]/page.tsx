'use client';

import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { AIFeedbackPanel } from '@/components/lessons/ai-feedback-panel';
import { useAuthStore } from '@/features/auth/auth.store';
import { usePracticeAttempt } from '@/hooks/use-practice';
import { getReturnLessonHref, withReturnLessonId } from '@/lib/lesson-return';
import { getPracticeAttemptStats, PracticeQuestion } from '@/lib/practice-api';
import { Link } from '@/navigation';
import { AiTutorButton } from '@/components/lessons/ai-tutor-button';
import { AudioPromptPlayer } from '@/components/practice/audio-prompt-player';

export default function PracticeAttemptReviewPage() {
  const t = useTranslations('Student');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const locale = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const attemptId =
    (Array.isArray(params.attemptId) ? params.attemptId[0] : params.attemptId) ?? '';
  const returnLessonId = searchParams.get('returnLessonId');
  const returnLessonHref = getReturnLessonHref(returnLessonId);
  const currentHref = withReturnLessonId(`/practice/attempts/${attemptId}`, returnLessonId);
  const canLoadAttempt = isInitialized && isAuthenticated;
  const { data: attempt, isLoading, isError } = usePracticeAttempt(attemptId, canLoadAttempt);
  const stats = attempt ? getPracticeAttemptStats(attempt) : null;

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href={returnLessonHref ?? '/practice'}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {returnLessonHref ? t('practice.backToLesson') : t('practice.backToPractice')}
        </Link>

        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo={currentHref} />
        ) : !isInitialized || isLoading ? (
          <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('practice.loadingAttempt')}
          </div>
        ) : isError || !attempt ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {t('practice.loadAttemptError')}
          </div>
        ) : (
          <>
            <header className="mb-6 rounded-md border bg-card p-6">
              <p className="text-sm font-semibold text-primary">{t('practice.attemptReview')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">
                {attempt.exerciseSet.title}
              </h1>
              {attempt.exerciseSet.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {attempt.exerciseSet.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border px-2 py-1">
                  {attempt.exerciseSet.course.title}
                </span>
                {attempt.exerciseSet.unit?.title && (
                  <span className="rounded-md border px-2 py-1">
                    {attempt.exerciseSet.unit.title}
                  </span>
                )}
                <span className="rounded-md border px-2 py-1">
                  {t('practice.attemptSubmittedAtValue', {
                    value: formatDateTime(attempt.submittedAt, locale),
                  })}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-md border px-2 py-1">
                  {t('practice.answeredCountValue', {
                    count: stats?.answeredCount ?? attempt.totalPoints,
                    total: attempt.totalPoints,
                  })}
                </span>
                {(stats?.aiAnsweredCount ?? 0) > 0 && (
                  <span className="rounded-md border px-2 py-1">
                    {t('practice.aiReviewSummaryValue', {
                      reviewed: stats?.aiReviewedCount ?? 0,
                      pending: stats?.aiPendingCount ?? 0,
                    })}
                  </span>
                )}
              </div>
            </header>

            <section className="mb-6 rounded-md border bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">{t('practice.result')}</p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {t('practice.scoreValue', {
                      score: attempt.score,
                      total: attempt.totalPoints,
                    })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('practice.percentageValue', {
                      value: Math.round((attempt.score / Math.max(attempt.totalPoints, 1)) * 100),
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {returnLessonHref && (
                    <Link
                      href={returnLessonHref}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      {t('practice.continueLesson')}
                    </Link>
                  )}
                  <Link
                    href={withReturnLessonId(`/practice/${attempt.exerciseSet.id}`, returnLessonId)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('practice.tryAgain')}
                  </Link>
                </div>
              </div>
            </section>

            <div className="space-y-5">
              {attempt.answers.map((answer, index) => (
                <section key={answer.id} className="rounded-md border bg-card p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {answer.question.type === 'MULTIPLE_CHOICE'
                            ? t('practice.multipleChoice')
                            : answer.question.type === 'FILL_BLANK'
                              ? t('practice.fillBlank')
                              : answer.question.type === 'MATCHING'
                                ? t('practice.matching')
                                : answer.question.type === 'ORDERING'
                                  ? t('practice.ordering')
                                  : answer.question.type === 'AI_EVALUATED_AUDIO'
                                    ? t('practice.aiAudio')
                                    : t('practice.aiText')}
                        </span>
                        {answer.question.skillTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-base font-semibold leading-relaxed">
                        {answer.question.prompt}
                      </h2>
                    </div>
                  </div>

                  {answer.question.audioMediaAsset?.url ? (
                    <div className="mb-4">
                      <AudioPromptPlayer
                        url={answer.question.audioMediaAsset.url}
                        replayLimit={answer.question.audioReplayLimit ?? null}
                        unrestricted
                      />
                    </div>
                  ) : null}

                  <div
                    className={`rounded-md border p-4 text-sm ${
                      answer.isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-destructive/20 bg-destructive/5 text-destructive'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      {answer.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {answer.isCorrect ? t('practice.correct') : t('practice.incorrect')}
                    </div>
                    <p>
                      {t('practice.yourAnswerValue', {
                        value: formatPracticeAnswer(answer.question, answer.answer),
                      })}
                    </p>
                    {!answer.isCorrect && !isAiQuestionType(answer.question.type) && (
                      <p className="mt-2">
                        {t('practice.correctAnswerValue', {
                          value: formatPracticeAnswer(
                            answer.question,
                            answer.question.correctAnswer,
                          ),
                        })}
                      </p>
                    )}
                    {answer.question.explanation && (
                      <p className="mt-2 text-muted-foreground">{answer.question.explanation}</p>
                    )}
                    {!answer.isCorrect && !isAiQuestionType(answer.question.type) && (
                      <AiTutorButton
                        attemptId={attempt.id}
                        questionId={answer.question.id}
                        type="practice"
                        initialFeedback={
                          typeof answer.aiFeedback === 'string' ? answer.aiFeedback : undefined
                        }
                      />
                    )}
                    {isAiQuestionType(answer.question.type) && (
                      <AIFeedbackPanel aiFeedback={answer.aiFeedback} className="mt-4" />
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatPracticeAnswer(
  question: PracticeQuestion & { correctAnswer?: unknown },
  value: unknown,
) {
  if (question.type === 'MULTIPLE_CHOICE' && typeof value === 'number') {
    const options = Array.isArray(question.options)
      ? question.options.map((item) => String(item))
      : [];
    return options[value] ?? String(value);
  }

  if (question.type === 'MATCHING' || question.type === 'ORDERING') {
    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object') {
          return JSON.stringify(parsed, null, 2);
        }
      } else if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
    } catch {
      // fallback
    }
  }

  return String(value ?? '');
}

function isAiQuestionType(type: PracticeQuestion['type']) {
  return type === 'AI_EVALUATED_AUDIO' || type === 'AI_EVALUATED_TEXT';
}
