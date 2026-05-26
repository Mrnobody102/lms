'use client';

import { useState } from 'react';
import { Flame, Loader2, PlayCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDailyQuest } from '../../hooks/use-daily-quest';
import { DailyQuestModal } from './daily-quest-modal';
import type { GeneratedPracticeQuestion } from '../../hooks/use-daily-quest';

export function DailyQuestWidget() {
  const t = useTranslations('Student');
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState<GeneratedPracticeQuestion[] | null>(null);

  const { mutate: generateQuest, isPending } = useDailyQuest();

  const handleStartQuest = () => {
    if (questions) {
      setIsOpen(true);
      return;
    }

    generateQuest(
      {},
      {
        onSuccess: (data) => {
          setQuestions(data);
          setIsOpen(true);
        },
        onError: (error: unknown) => {
          alert(getErrorMessage(error, t('dailyQuest.generateError')));
        },
      },
    );
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-rose-50 p-6 dark:border-orange-900/50 dark:from-orange-950/20 dark:to-rose-950/20">
        <div className="absolute right-0 top-0 -mr-4 -mt-4 opacity-10 blur-xl">
          <Sparkles className="h-32 w-32 text-orange-500" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-orange-950 dark:text-orange-50">
                {t('dailyQuest.title')}
              </h2>
              <p className="mt-1 text-sm text-orange-800/80 dark:text-orange-200/80">
                {t('dailyQuest.description')}
              </p>
            </div>
          </div>

          <button
            onClick={handleStartQuest}
            disabled={isPending}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-6 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('dailyQuest.generating')}
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                {t('dailyQuest.start')}
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && questions && (
        <DailyQuestModal
          questions={questions}
          onClose={() => setIsOpen(false)}
          onComplete={() => {
            setIsOpen(false);
            setQuestions(null); // Reset after complete
            alert(t('dailyQuest.completed'));
            // Will trigger refetch summary internally
          }}
        />
      )}
    </>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const response = 'response' in error ? error.response : undefined;
  if (!response || typeof response !== 'object') {
    return fallback;
  }

  const data = 'data' in response ? response.data : undefined;
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const message = 'message' in data ? data.message : undefined;
  return typeof message === 'string' ? message : fallback;
}
