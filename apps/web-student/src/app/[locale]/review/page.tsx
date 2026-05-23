'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BrainCircuit, CheckCircle2, ArrowRight } from 'lucide-react';
import { useReviewQueue, useSubmitReview } from '@/hooks/use-srs';
import { Link } from '@/navigation';
import { StudentNav } from '@/components/layout/student-nav';
import { AudioPromptPlayer } from '@/components/practice/audio-prompt-player';

export default function ReviewPage() {
  const t = useTranslations('Student.srs');
  const { data: queue, isLoading } = useReviewQueue();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const startTimeRef = useRef(0);
  const { mutate: submitReview, isPending } = useSubmitReview();

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  if (isLoading) {
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

  if (!queue || currentIndex >= queue.length) {
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

  const currentCard = queue[currentIndex];
  const question = currentCard.question;

  const handleGrade = (grade: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    const durationMs = Date.now() - startTimeRef.current;
    submitReview(
      { cardId: currentCard.cardId, grade, durationMs },
      {
        onSuccess: () => {
          setShowAnswer(false);
          setCurrentIndex((i) => i + 1);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <StudentNav showLinks={false} />

      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <BrainCircuit className="h-5 w-5 text-primary" />
            {t('reviewSessionTitle')}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {queue.length}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-muted/10">
        <div className="mx-auto max-w-3xl px-6 py-12">
          {question ? (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden mb-8">
              <div className="p-8 border-b">
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  {t('reviewQuestionPrompt')} • {currentCard.skillCodes.join(', ')}
                </div>
                <div
                  className="text-xl font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: question.prompt }}
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
                  <div className="mt-6 space-y-3">
                    {question.options.map((opt: unknown, i: number) => (
                      <div key={i} className="p-4 rounded-lg border bg-muted/30">
                        {String(opt)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {showAnswer ? (
                <div className="p-8 bg-primary/5">
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-primary mb-2">{t('correctAnswer')}</p>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 font-medium">
                      {typeof question.correctAnswer === 'string'
                        ? question.correctAnswer
                        : JSON.stringify(question.correctAnswer)}
                    </div>
                  </div>
                  {question.explanation && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">
                        {t('explanation')}
                      </p>
                      <div
                        className="text-sm text-foreground/80 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: question.explanation }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 flex justify-center bg-muted/10">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="inline-flex h-12 items-center justify-center rounded-md bg-secondary px-8 font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {t('showAnswer')}
                  </button>
                </div>
              )}
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
      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${colorClass}`}
    >
      <span className="font-bold text-lg mb-1">{label}</span>
      <span className="text-xs opacity-70 text-center leading-tight">{hint}</span>
    </button>
  );
}
