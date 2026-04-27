'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '@/components/layout/student-nav';
import { useExam, useStartExamAttempt, useSubmitExamAttempt } from '@/hooks/use-exams';
import {
  Exam,
  ExamAnswerFeedback,
  ExamAttempt,
  ExamAttemptResult,
  ExamQuestion,
} from '@/lib/exam-api';
import { Link } from '@/navigation';

export default function ExamAttemptPage() {
  const t = useTranslations('Student');
  const params = useParams();
  const idParam = params.id;
  const examId = (Array.isArray(idParam) ? idParam[0] : idParam) ?? '';
  const { data: exam, isLoading, isError } = useExam(examId);
  const startAttempt = useStartExamAttempt(examId);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamAttemptResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const submitAttempt = useSubmitExamAttempt(attempt?.id);

  const visibleExam = activeExam ?? exam;
  const questions = useMemo(
    () => visibleExam?.sections.flatMap((section) => section.questions) ?? [],
    [visibleExam],
  );
  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );
  const allAnswered =
    questions.length > 0 &&
    questions.every((question) => {
      const answer = answers[question.id];
      return answer !== undefined && answer.trim() !== '';
    });
  const timeExpired = attempt ? remainingMs !== null && remainingMs <= 0 : false;

  useEffect(() => {
    if (!attempt || result) {
      setRemainingMs(null);
      return;
    }

    const syncRemaining = () => {
      const nextRemaining = new Date(attempt.deadlineAt).getTime() - Date.now();
      setRemainingMs(Math.max(nextRemaining, 0));
    };

    syncRemaining();
    const timer = window.setInterval(syncRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result]);

  useEffect(() => {
    if (!timeExpired || result) {
      return;
    }

    setMessage((current) => current ?? t('exam.expiredMessage'));
  }, [result, t, timeExpired]);

  const handleStart = () => {
    setMessage(null);
    startAttempt.mutate(undefined, {
      onSuccess: (data) => {
        setAttempt(data.attempt);
        setActiveExam(data.exam);
        setAnswers({});
        setResult(null);
        setRemainingMs(new Date(data.attempt.deadlineAt).getTime() - Date.now());
        if (data.resumed) {
          setMessage(t('exam.resumeMessage'));
        }
      },
      onError: () => setMessage(t('exam.startError')),
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!attempt) {
      setMessage(t('exam.startRequired'));
      return;
    }
    if (!allAnswered) {
      setMessage(t('exam.answerRequired'));
      return;
    }
    if (timeExpired) {
      setMessage(t('exam.expiredMessage'));
      return;
    }

    submitAttempt.mutate(
      questions.map((question) => ({
        questionId: question.id,
        answer:
          question.type === 'MULTIPLE_CHOICE'
            ? Number(answers[question.id])
            : answers[question.id].trim(),
      })),
      {
        onSuccess: (data) => {
          setResult(data);
          setAttempt(data.attempt);
          setRemainingMs(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: (error) => setMessage(getSubmitErrorMessage(error, t)),
      },
    );
  };

  const resetAttempt = () => {
    setAttempt(null);
    setActiveExam(null);
    setAnswers({});
    setResult(null);
    setMessage(null);
    setRemainingMs(null);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/exams"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('exam.backToExams')}
        </Link>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('exam.loading')}
          </div>
        ) : isError || !visibleExam ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {t('exam.loadError')}
          </div>
        ) : (
          <>
            <header className="mb-6 rounded-md border bg-card p-6">
              <p className="text-sm font-semibold text-primary">{t('exam.badge')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{visibleExam.title}</h1>
              {visibleExam.description && (
                <p className="mt-2 text-sm text-muted-foreground">{visibleExam.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border px-2 py-1">
                  {visibleExam.course?.title ?? t('exam.courseFallback')}
                </span>
                {visibleExam.unit?.title && (
                  <span className="rounded-md border px-2 py-1">{visibleExam.unit.title}</span>
                )}
                <span className="rounded-md border px-2 py-1">
                  {t('exam.durationValue', { minutes: visibleExam.durationMinutes })}
                </span>
                {visibleExam.passingScore !== null && visibleExam.passingScore !== undefined && (
                  <span className="rounded-md border px-2 py-1">
                    {t('exam.passingScoreValue', { value: visibleExam.passingScore })}
                  </span>
                )}
                {attempt && !result && (
                  <span
                    className={`rounded-md border px-2 py-1 ${
                      timeExpired
                        ? 'border-destructive/30 bg-destructive/5 text-destructive'
                        : 'border-primary/20 bg-primary/5 text-primary'
                    }`}
                  >
                    {timeExpired
                      ? t('exam.expiredBadge')
                      : t('exam.timeRemainingValue', {
                          value: formatRemainingTime(remainingMs),
                        })}
                  </span>
                )}
              </div>
            </header>

            {result && (
              <ResultSummary
                result={result}
                reviewHref={`/exams/attempts/${result.attempt.id}`}
                onRetry={resetAttempt}
              />
            )}

            {message && (
              <div className="mb-5 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {message}
              </div>
            )}

            {!attempt ? (
              <section className="rounded-md border bg-card p-6">
                <h2 className="text-lg font-semibold">{t('exam.readyTitle')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('exam.readyDesc')}</p>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={startAttempt.isPending}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {startAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('exam.start')}
                </button>
              </section>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {visibleExam.sections.map((section) => (
                  <section key={section.id} className="space-y-4">
                    <h2 className="text-lg font-semibold">{section.title}</h2>
                    {section.questions.map((question, index) => {
                      const feedback = result?.result.answers.find(
                        (answer) => answer.questionId === question.id,
                      );

                      return (
                        <QuestionCard
                          key={question.id}
                          index={index}
                          question={question}
                          value={answers[question.id] ?? ''}
                          feedback={feedback}
                          disabled={Boolean(result)}
                          onChange={(value) =>
                            setAnswers((current) => ({ ...current, [question.id]: value }))
                          }
                          formatFeedbackAnswer={(value) =>
                            formatAnswer(questionById.get(question.id), value)
                          }
                        />
                      );
                    })}
                  </section>
                ))}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {result && (
                    <button
                      type="button"
                      onClick={resetAttempt}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold hover:bg-muted"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t('exam.tryAgain')}
                    </button>
                  )}
                  {!result && (
                    <button
                      type="submit"
                      disabled={submitAttempt.isPending || timeExpired}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t('exam.submit')}
                    </button>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  value,
  feedback,
  disabled,
  onChange,
  formatFeedbackAnswer,
}: {
  index: number;
  question: ExamQuestion;
  value: string;
  feedback?: ExamAnswerFeedback;
  disabled: boolean;
  onChange: (value: string) => void;
  formatFeedbackAnswer: (value: unknown) => string;
}) {
  const t = useTranslations('Student');
  const options = getOptions(question.options);

  return (
    <section className="rounded-md border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {question.type === 'MULTIPLE_CHOICE' ? t('exam.multipleChoice') : t('exam.fillBlank')}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {t('exam.pointsValue', { points: question.points })}
            </span>
            {question.skillTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-base font-semibold leading-relaxed">{question.prompt}</h3>
        </div>
      </div>

      {question.type === 'MULTIPLE_CHOICE' ? (
        <div className="grid gap-3">
          {options.map((option, optionIndex) => (
            <label
              key={`${question.id}-${optionIndex}`}
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
            >
              <input
                type="radio"
                name={question.id}
                value={String(optionIndex)}
                checked={value === String(optionIndex)}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('exam.fillBlankPlaceholder')}
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}

      {feedback && (
        <div
          className={`mt-4 rounded-md border p-4 text-sm ${
            feedback.isCorrect
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-destructive/20 bg-destructive/5 text-destructive'
          }`}
        >
          <div className="mb-2 flex items-center gap-2 font-semibold">
            {feedback.isCorrect ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {feedback.isCorrect ? t('exam.correct') : t('exam.incorrect')}
          </div>
          {!feedback.isCorrect && (
            <p>
              {t('exam.correctAnswerValue', {
                value: formatFeedbackAnswer(feedback.correctAnswer),
              })}
            </p>
          )}
          {feedback.explanation && (
            <p className="mt-2 text-muted-foreground">{feedback.explanation}</p>
          )}
        </div>
      )}
    </section>
  );
}

function ResultSummary({
  result,
  reviewHref,
  onRetry,
}: {
  result: ExamAttemptResult;
  reviewHref: string;
  onRetry: () => void;
}) {
  const t = useTranslations('Student');

  return (
    <section className="mb-6 rounded-md border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{t('exam.result')}</p>
          <h2 className="mt-1 text-2xl font-bold">
            {t('exam.scoreValue', {
              score: result.result.score,
              total: result.result.totalPoints,
            })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('exam.percentageValue', { value: result.result.percentage })}
          </p>
          {result.result.passed !== null && (
            <p className="mt-2 text-sm font-semibold">
              {result.result.passed ? t('exam.passed') : t('exam.notPassed')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={reviewHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
          >
            {t('exam.reviewAttempt')}
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            {t('exam.tryAgain')}
          </button>
        </div>
      </div>
    </section>
  );
}

function getOptions(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function formatAnswer(question: ExamQuestion | undefined, value: unknown) {
  if (question?.type === 'MULTIPLE_CHOICE' && typeof value === 'number') {
    return getOptions(question.options)[value] ?? String(value);
  }

  return String(value ?? '');
}

function formatRemainingTime(remainingMs: number | null) {
  const totalSeconds = Math.max(0, Math.ceil((remainingMs ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getSubmitErrorMessage(error: unknown, t: ReturnType<typeof useTranslations<'Student'>>) {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data
      ? String(error.response.data.message)
      : '';

  return message.includes('time has expired')
    ? t('exam.expiredSubmitError')
    : t('exam.submitError');
}
