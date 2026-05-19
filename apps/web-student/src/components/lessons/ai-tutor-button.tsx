'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useExplainPracticeAnswer, useExplainExamAnswer } from '@/hooks/use-ai-tutor';
import ReactMarkdown from 'react-markdown';

interface AiTutorButtonProps {
  attemptId: string;
  questionId: string;
  type: 'practice' | 'exam';
  initialFeedback?: string; // If already fetched
}

export function AiTutorButton({
  attemptId,
  questionId,
  type,
  initialFeedback,
}: AiTutorButtonProps) {
  const t = useTranslations('Student.aiTutor');
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(initialFeedback ?? null);
  const [error, setError] = useState<string | null>(null);

  const explainPractice = useExplainPracticeAnswer();
  const explainExam = useExplainExamAnswer();

  const isPending = type === 'practice' ? explainPractice.isPending : explainExam.isPending;

  const handleAsk = async () => {
    setIsOpen(true);
    if (feedback) return; // Already have feedback
    setError(null);

    try {
      const mutation = type === 'practice' ? explainPractice.mutateAsync : explainExam.mutateAsync;
      const res = await mutation({ attemptId, questionId });
      setFeedback(res.explanation);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleAsk}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <Sparkles className="h-4 w-4" />
        {t('askAiButton')}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Sparkles className="h-5 w-5" />
          <span>{t('aiFeedbackTitle')}</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isPending ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {t('analyzing')}
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">
          <p className="font-semibold">{t('errorTitle')}</p>
          <p>{error.includes('lượt sử dụng') ? t('quotaExceeded') : error}</p>
        </div>
      ) : feedback ? (
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed prose-pre:bg-background/50">
          <ReactMarkdown>{feedback}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
