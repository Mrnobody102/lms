'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '@/components/layout/student-nav';
import { usePracticeExerciseSet, useSubmitPracticeAttempt } from '@/hooks/use-practice';
import {
  PracticeAnswerFeedback,
  PracticeAttemptResult,
  PracticeQuestion,
} from '@/lib/practice-api';
import { Link } from '@/navigation';
import { AIEvaluationInput } from '@/components/lessons/ai-evaluation-input';
import { MatchingQuestion } from '@/components/lessons/matching-question';
import { OrderingQuestion } from '@/components/lessons/ordering-question';
import { AudioPromptPlayer } from '@/components/practice/audio-prompt-player';
import { SocraticTutorPanel } from '@/components/practice/socratic-tutor-panel';
import { DiscussionPanel } from '@/components/discussions/discussion-panel';
import { isQuestionAnswered, parseSubmittedAnswer } from '@/lib/question-answer.util';
import { Sparkles } from 'lucide-react';

export default function PracticeAttemptPage() {
  const t = useTranslations('Student');
  const params = useParams();
  const idParam = params.id;
  const exerciseSetId = (Array.isArray(idParam) ? idParam[0] : idParam) ?? '';
  const { data: exerciseSet, isLoading, isError } = usePracticeExerciseSet(exerciseSetId);
  const submitAttempt = useSubmitPracticeAttempt(exerciseSetId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const questions = useMemo(
    () => exerciseSet?.questions.map((link) => link.question) ?? [],
    [exerciseSet],
  );
  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );

  const unansweredIndices = useMemo(() => {
    return questions
      .map((question, index) =>
        isQuestionAnswered(question, answers[question.id]) ? -1 : index + 1,
      )
      .filter((i) => i !== -1);
  }, [questions, answers]);
  const allAnswered = questions.length > 0 && unansweredIndices.length === 0;

  // Clear validation errors when user answers all questions
  useEffect(() => {
    if (showValidationErrors && allAnswered) {
      setShowValidationErrors(false);
      setMessage(null);
    }
  }, [allAnswered, showValidationErrors]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!allAnswered) {
      setShowValidationErrors(true);
      return;
    }

    submitAttempt.mutate(
      questions.map((question) => ({
        questionId: question.id,
        answer: parseSubmittedAnswer(question, answers[question.id]),
      })),
      {
        onSuccess: (data) => {
          setResult(data);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => setMessage(t('practice.submitError')),
      },
    );
  };

  const resetAttempt = () => {
    setAnswers({});
    setResult(null);
    setMessage(null);
    setShowValidationErrors(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/practice"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('practice.backToPractice')}
        </Link>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('practice.loading')}
          </div>
        ) : isError || !exerciseSet ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {t('practice.loadError')}
          </div>
        ) : (
          <>
            <header className="mb-6 rounded-md border bg-card p-6">
              <p className="text-sm font-semibold text-primary">{t('practice.badge')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{exerciseSet.title}</h1>
              {exerciseSet.description && (
                <p className="mt-2 text-sm text-muted-foreground">{exerciseSet.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border px-2 py-1">
                  {exerciseSet.course?.title ?? t('practice.courseFallback')}
                </span>
                {exerciseSet.unit?.title && (
                  <span className="rounded-md border px-2 py-1">{exerciseSet.unit.title}</span>
                )}
                <span className="rounded-md border px-2 py-1">
                  {t('practice.questionCount', { count: questions.length })}
                </span>
              </div>
            </header>

            {result && (
              <ResultSummary
                result={result}
                reviewHref={`/practice/attempts/${result.attempt.id}`}
                onRetry={resetAttempt}
              />
            )}

            {message && (
              <div className="mb-5 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {questions.map((question, index) => {
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
                    showError={
                      showValidationErrors && !isQuestionAnswered(question, answers[question.id])
                    }
                    onChange={(value) =>
                      setAnswers((current) => ({ ...current, [question.id]: value }))
                    }
                    formatFeedbackAnswer={(value) =>
                      formatAnswer(questionById.get(question.id), value)
                    }
                  />
                );
              })}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                <div className="text-sm font-semibold text-destructive">
                  {showValidationErrors && !allAnswered && (
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {t('practice.answerRequired')} (Câu chưa trả lời:{' '}
                      {unansweredIndices.join(', ')})
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {result && (
                    <button
                      type="button"
                      onClick={resetAttempt}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold hover:bg-muted"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t('practice.tryAgain')}
                    </button>
                  )}
                  {!result && (
                    <button
                      type="submit"
                      disabled={submitAttempt.isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitAttempt.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t('practice.submit')}
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-8">
              <DiscussionPanel targetType="PRACTICE_EXERCISE_SET" exerciseSetId={exerciseSet.id} />
            </div>
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
  showError,
  onChange,
  formatFeedbackAnswer,
}: {
  index: number;
  question: PracticeQuestion;
  value: string;
  feedback?: PracticeAnswerFeedback;
  disabled: boolean;
  showError?: boolean;
  onChange: (value: string) => void;
  formatFeedbackAnswer: (value: unknown) => string;
}) {
  const t = useTranslations('Student');
  const [showSocratic, setShowSocratic] = useState(false);
  const options = getOptions(question.options);
  const isAiQuestion = isAiQuestionType(question.type);
  const audioUrl = question.audioMediaAsset?.url ?? null;

  return (
    <section
      id={`question-${index}`}
      className={`rounded-md border p-5 transition-colors ${
        showError
          ? 'border-destructive bg-destructive/5 ring-1 ring-destructive shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          : 'bg-card'
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {question.type === 'MULTIPLE_CHOICE'
                ? t('practice.multipleChoice')
                : question.type === 'FILL_BLANK'
                  ? t('practice.fillBlank')
                  : question.type === 'MATCHING'
                    ? t('practice.matching')
                    : question.type === 'ORDERING'
                      ? t('practice.ordering')
                      : question.type === 'AI_EVALUATED_AUDIO'
                        ? t('practice.aiAudio')
                        : t('practice.aiText')}
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
          <h2 className="text-base font-semibold leading-relaxed">{question.prompt}</h2>
        </div>
      </div>

      {audioUrl ? (
        <div className="mb-4">
          <AudioPromptPlayer
            url={audioUrl}
            replayLimit={question.audioReplayLimit ?? null}
            unrestricted={disabled}
          />
        </div>
      ) : null}

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
      ) : question.type === 'MATCHING' ? (
        <MatchingQuestion
          options={question.options as { left: string[]; right: string[] }}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      ) : question.type === 'ORDERING' ? (
        <OrderingQuestion options={options} value={value} disabled={disabled} onChange={onChange} />
      ) : question.type === 'FILL_BLANK' ? (
        <input
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('practice.fillBlankPlaceholder')}
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <AIEvaluationInput
          type={question.type as 'AI_EVALUATED_AUDIO' | 'AI_EVALUATED_TEXT'}
          value={value}
          disabled={disabled}
          onChange={onChange}
          aiFeedback={feedback?.aiFeedback}
        />
      )}

      {feedback && !isAiQuestion && (
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
            {feedback.isCorrect ? t('practice.correct') : t('practice.incorrect')}
          </div>
          {!feedback.isCorrect && (
            <p>
              {t('practice.correctAnswerValue', {
                value: formatFeedbackAnswer(feedback.correctAnswer),
              })}
            </p>
          )}
          {feedback.explanation && (
            <p className="mt-2 text-muted-foreground">{feedback.explanation}</p>
          )}

          {!feedback.isCorrect && !showSocratic && (
            <button
              type="button"
              onClick={() => setShowSocratic(true)}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors w-fit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('practice.socraticHint')}
            </button>
          )}

          {!feedback.isCorrect && showSocratic && (
            <SocraticTutorPanel
              questionPrompt={question.prompt}
              studentAnswer={value}
              correctAnswer={feedback.correctAnswer}
            />
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
  result: PracticeAttemptResult;
  reviewHref: string;
  onRetry: () => void;
}) {
  const t = useTranslations('Student');
  const aiStats = buildResultAiStats(result.result.answers);

  return (
    <section className="mb-6 rounded-md border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{t('practice.result')}</p>
          <h2 className="mt-1 text-2xl font-bold">
            {t('practice.scoreValue', {
              score: result.result.score,
              total: result.result.totalPoints,
            })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('practice.percentageValue', { value: result.result.percentage })}
          </p>
          {aiStats.aiAnsweredCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('practice.aiReviewSummaryValue', {
                reviewed: aiStats.aiReviewedCount,
                pending: aiStats.aiPendingCount,
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={reviewHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
          >
            {t('practice.reviewAttempt')}
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            {t('practice.tryAgain')}
          </button>
        </div>
      </div>
    </section>
  );
}

function getOptions(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function isAiQuestionType(type: PracticeQuestion['type']) {
  return type === 'AI_EVALUATED_AUDIO' || type === 'AI_EVALUATED_TEXT';
}

function formatAnswer(question: PracticeQuestion | undefined, value: unknown) {
  if (question?.type === 'MULTIPLE_CHOICE' && typeof value === 'number') {
    return getOptions(question.options)[value] ?? String(value);
  }

  if (question?.type === 'MATCHING' || question?.type === 'ORDERING') {
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

function buildResultAiStats(answers: PracticeAnswerFeedback[]) {
  const aiAnswers = answers.filter((answer) => Boolean(answer.aiFeedback));
  const aiReviewedCount = aiAnswers.filter(
    (answer) => getAiFeedbackStatus(answer.aiFeedback) === 'AUTO_REVIEWED',
  ).length;

  return {
    aiAnsweredCount: aiAnswers.length,
    aiReviewedCount,
    aiPendingCount: Math.max(aiAnswers.length - aiReviewedCount, 0),
  };
}

function getAiFeedbackStatus(value: unknown) {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const status = (value as Record<string, unknown>).status;
  return status === 'AUTO_REVIEWED' || status === 'PENDING_REVIEW' ? status : undefined;
}
