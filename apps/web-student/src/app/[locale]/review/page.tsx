'use client';

import DOMPurify from 'dompurify';
import { AlertCircle, ArrowRight, BrainCircuit, CheckCircle2, Layers3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { AudioPromptPlayer } from '@/components/practice/audio-prompt-player';
import { useAuthStore } from '@/features/auth/auth.store';
import { useCustomCards, useReviewQueue, useSubmitReview } from '@/hooks/use-srs';
import type { ReviewCardGrade, ReviewQueueItem } from '@/lib/srs-api';
import { Link } from '@/navigation';

function sanitizeReviewHtml(content: string) {
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
    ADD_ATTR: ['target', 'rel'],
  });
}

const ALL_FILTER = 'all';

export default function ReviewPage() {
  const t = useTranslations('Student.srs');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const searchParams = useSearchParams();
  const [deckFilter, setDeckFilter] = useState(searchParams.get('deck') ?? ALL_FILTER);
  const [courseFilter, setCourseFilter] = useState(searchParams.get('courseId') ?? ALL_FILTER);
  const reviewParams = useMemo(
    () => ({
      deck: deckFilter === ALL_FILTER ? undefined : deckFilter,
      courseId: courseFilter === ALL_FILTER ? undefined : courseFilter,
    }),
    [courseFilter, deckFilter],
  );
  const { data: queue, isLoading } = useReviewQueue(reviewParams, isAuthenticated);
  const { data: customCards = [] } = useCustomCards(isAuthenticated);
  const [sessionQueue, setSessionQueue] = useState<ReviewQueueItem[]>([]);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const startTimeRef = useRef(0);
  const pointerStartXRef = useRef<number | null>(null);
  const { mutate: submitReview, isPending } = useSubmitReview();
  const currentCard = sessionQueue[0];
  const question = currentCard?.question;
  const deckOptions = useMemo(() => {
    return Array.from(
      new Set(
        customCards
          .map((card) => card.customContent?.deck?.trim())
          .filter((deck): deck is string => Boolean(deck)),
      ),
    ).sort((first, second) => first.localeCompare(second));
  }, [customCards]);
  const courseOptions = useMemo(() => {
    return Array.from(
      new Map(
        customCards
          .map((card) => {
            const content = card.customContent;
            const title = content?.courseTitle?.trim();
            if (!title) return null;
            return [content?.courseId || title, title] as const;
          })
          .filter((entry): entry is readonly [string, string] => Boolean(entry)),
      ).entries(),
    ).sort((first, second) => first[1].localeCompare(second[1]));
  }, [customCards]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentCard?.cardId]);

  useEffect(() => {
    const nextQueue = queue ?? [];
    setSessionQueue(nextQueue);
    setSessionTotal(nextQueue.length);
    setShowAnswer(false);
    setMessage(null);
  }, [queue]);

  const handleGrade = useCallback(
    (grade: ReviewCardGrade) => {
      if (!currentCard || isPending) return;

      const durationMs = Date.now() - startTimeRef.current;
      setMessage(null);
      submitReview(
        { cardId: currentCard.cardId, grade, durationMs },
        {
          onSuccess: () => {
            setSessionQueue((items) => items.filter((item) => item.cardId !== currentCard.cardId));
            setShowAnswer(false);
            setDragX(0);
          },
          onError: () => setMessage(t('reviewSubmitError')),
        },
      );
    },
    [currentCard, isPending, submitReview, t],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase();
        if (['input', 'select', 'textarea', 'button'].includes(tag)) return;
      }

      if ((event.code === 'Space' || event.key === 'Enter') && !showAnswer) {
        event.preventDefault();
        setShowAnswer(true);
        return;
      }

      if (!showAnswer) return;

      const gradeByKey: Record<string, ReviewCardGrade> = {
        '1': 'AGAIN',
        '2': 'HARD',
        '3': 'GOOD',
        '4': 'EASY',
        ArrowLeft: 'AGAIN',
        ArrowRight: 'GOOD',
      };
      const grade = gradeByKey[event.key];
      if (grade) {
        event.preventDefault();
        handleGrade(grade);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGrade, showAnswer]);

  if (isInitialized && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-3xl px-6 py-20">
          <AuthRequiredPanel returnTo="/review" />
        </main>
      </div>
    );
  }

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-3xl px-6 py-20 flex flex-col items-center justify-center text-center">
          <BrainCircuit className="h-12 w-12 text-primary animate-pulse mb-4" />
          <p className="text-lg font-semibold">{t('loading')}</p>
        </main>
      </div>
    );
  }

  if (sessionQueue.length === 0) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-3xl px-6 py-20 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{t('reviewSessionDone')}</h1>
          <p className="text-muted-foreground mb-8">{t('reviewSessionDoneDesc')}</p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowRight className="h-5 w-5" />
            {t('backToDashboard')}
          </Link>
        </main>
      </div>
    );
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) return;
    setDragX(Math.max(-140, Math.min(140, event.clientX - pointerStartXRef.current)));
  };

  const handlePointerEnd = () => {
    if (Math.abs(dragX) < 90) {
      setDragX(0);
      pointerStartXRef.current = null;
      return;
    }

    if (!showAnswer) {
      setShowAnswer(true);
    } else {
      handleGrade(dragX > 0 ? 'GOOD' : 'AGAIN');
    }

    setDragX(0);
    pointerStartXRef.current = null;
  };

  const activeDeck = question?.customContent?.deck;
  const activeCourse = question?.customContent?.courseTitle;
  const activeUnit = question?.customContent?.unitTitle;

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <StudentNav showLinks />

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <BrainCircuit className="h-5 w-5 text-primary" />
              {t('reviewSessionTitle')}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('reviewSessionHint')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={deckFilter}
              onChange={(event) => setDeckFilter(event.target.value)}
              aria-label={t('reviewDeckFilter')}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
            >
              <option value="all">{t('reviewAllDecks')}</option>
              {deckOptions.map((deck) => (
                <option key={deck} value={deck}>
                  {deck}
                </option>
              ))}
            </select>
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              aria-label={t('reviewCourseFilter')}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
            >
              <option value="all">{t('reviewAllCourses')}</option>
              {courseOptions.map(([courseId, title]) => (
                <option key={courseId} value={courseId}>
                  {title}
                </option>
              ))}
            </select>
            <div className="text-sm font-medium text-muted-foreground">
              {Math.max(sessionTotal - sessionQueue.length + 1, 1)} / {sessionTotal}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-muted/10">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {message && (
            <div
              className="mb-5 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {question ? (
            <div className="mb-8">
              <div
                role="button"
                tabIndex={0}
                aria-label={showAnswer ? t('swipeGradeHint') : t('showAnswer')}
                onClick={() => {
                  if (!showAnswer) setShowAnswer(true);
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                className="block w-full touch-pan-y cursor-pointer rounded-xl border bg-card text-left shadow-sm outline-none ring-primary/20 transition hover:border-primary/30 focus-visible:ring-2"
                style={{
                  transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
                }}
              >
                <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl">
                  <div className="border-b p-6 sm:p-8">
                    <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{t('reviewQuestionPrompt')}</span>
                      {activeDeck ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          <Layers3 className="h-3 w-3" />
                          {activeDeck}
                        </span>
                      ) : null}
                      {activeCourse ? (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {activeUnit ? `${activeCourse} / ${activeUnit}` : activeCourse}
                        </span>
                      ) : null}
                      {currentCard.skillCodes.length > 0 ? (
                        <span>{currentCard.skillCodes.join(', ')}</span>
                      ) : null}
                    </div>
                    <div
                      className="lesson-rich-content text-2xl font-semibold leading-relaxed sm:text-3xl"
                      dangerouslySetInnerHTML={{ __html: sanitizeReviewHtml(question.prompt) }}
                    />
                    {question.audioMediaAsset?.url ? (
                      <div className="mt-6">
                        <AudioPromptPlayer
                          url={question.audioMediaAsset.url}
                          replayLimit={question.audioReplayLimit}
                          unrestricted
                        />
                      </div>
                    ) : null}

                    {Array.isArray(question.options) ? (
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {question.options.map((opt: unknown, i: number) => (
                          <div key={i} className="rounded-lg border bg-muted/30 p-4">
                            {String(opt)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {showAnswer ? (
                    <div className="flex-1 bg-primary/5 p-6 sm:p-8">
                      {question.customContent?.phonetics ? (
                        <div className="mb-4 text-lg font-semibold text-primary">
                          {question.customContent.phonetics}
                        </div>
                      ) : null}
                      <div className="mb-6">
                        <p className="mb-2 text-sm font-semibold text-primary">
                          {t('correctAnswer')}
                        </p>
                        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-lg font-semibold">
                          {formatAnswer(question.correctAnswer)}
                        </div>
                      </div>
                      {question.explanation && question.explanation !== question.correctAnswer ? (
                        <div>
                          <p className="mb-2 text-sm font-semibold text-muted-foreground">
                            {t('explanation')}
                          </p>
                          <div
                            className="lesson-rich-content text-sm leading-relaxed text-foreground/80"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeReviewHtml(question.explanation),
                            }}
                          />
                        </div>
                      ) : null}
                      <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
                        {t('swipeGradeHint')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center bg-muted/10 p-8">
                      <div className="text-center">
                        <div className="mx-auto mb-3 inline-flex h-12 items-center justify-center rounded-md bg-secondary px-6 font-semibold text-secondary-foreground">
                          {t('showAnswer')}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">{t('flipHint')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground mb-8">
              {t('questionUnavailable')}
            </div>
          )}

          {showAnswer && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <GradeButton
                label={t('grade.again')}
                hint={t('gradeHint.again')}
                colorClass="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                onClick={() => handleGrade('AGAIN')}
                disabled={isPending}
              />
              <GradeButton
                label={t('grade.hard')}
                hint={t('gradeHint.hard')}
                colorClass="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20"
                onClick={() => handleGrade('HARD')}
                disabled={isPending}
              />
              <GradeButton
                label={t('grade.good')}
                hint={t('gradeHint.good')}
                colorClass="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                onClick={() => handleGrade('GOOD')}
                disabled={isPending}
              />
              <GradeButton
                label={t('grade.easy')}
                hint={t('gradeHint.easy')}
                colorClass="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
                onClick={() => handleGrade('EASY')}
                disabled={isPending}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GradeButton({
  label,
  hint,
  colorClass,
  onClick,
  disabled,
}: {
  label: string;
  hint: string;
  colorClass: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${colorClass}`}
    >
      <span className="font-bold text-lg mb-1">{label}</span>
      <span className="text-xs opacity-70 text-center leading-tight">{hint}</span>
    </button>
  );
}

function formatAnswer(value: unknown) {
  if (typeof value === 'string') {
    return value || '-';
  }

  if (value === null || value === undefined) {
    return '-';
  }

  return JSON.stringify(value);
}
