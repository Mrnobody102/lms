'use client';

import { useState } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GeneratedPracticeQuestion } from '../../hooks/use-daily-quest';

interface DailyQuestModalProps {
  questions: GeneratedPracticeQuestion[];
  onClose: () => void;
  onComplete: () => void;
}

export function DailyQuestModal({ questions, onClose, onComplete }: DailyQuestModalProps) {
  const t = useTranslations('Student.dailyQuest');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const question = questions[currentIndex];
  const correctOptionId = (question.correctAnswer as { optionId?: string })?.optionId;
  const isCorrect = selectedOption === correctOptionId;

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      // Done all questions
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold">
            {t('modalTitle', { current: currentIndex + 1, total: questions.length })}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-6 text-lg font-medium">{question.prompt}</p>

          <div className="space-y-3">
            {question.options?.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const showAsCorrect = isSubmitted && opt.id === correctOptionId;
              const showAsWrong = isSubmitted && isSelected && !isCorrect;

              return (
                <button
                  key={opt.id}
                  onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                  disabled={isSubmitted}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    showAsCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : showAsWrong
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.text}</span>
                    {showAsCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {showAsWrong && <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          {isSubmitted && (
            <div
              className={`mt-6 rounded-xl p-4 ${
                isCorrect
                  ? 'bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-100'
                  : 'bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-100'
              }`}
            >
              <p className="font-bold mb-1">{isCorrect ? t('correct') : t('incorrect')}</p>
              <p className="text-sm">{question.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t bg-muted/20 px-6 py-4">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {t('check')}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {currentIndex < questions.length - 1 ? t('continue') : t('finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
