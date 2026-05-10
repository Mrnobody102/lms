'use client';

import { CheckCircle2, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PracticeQuestionType } from '../../lib/practice-api';

interface AIFeedbackPanelProps {
  aiFeedback?: unknown;
  className?: string;
}

interface AIFeedbackShape {
  status?: string;
  mode?: PracticeQuestionType;
  matched?: boolean;
  transcript?: string;
  summary?: string;
}

export function AIFeedbackPanel({ aiFeedback, className }: AIFeedbackPanelProps) {
  const t = useTranslations('Student');
  const feedback = normalizeAiFeedback(aiFeedback);

  if (!feedback) {
    return null;
  }

  const modeLabel =
    feedback.mode === 'AI_EVALUATED_AUDIO'
      ? t('practice.aiAudio')
      : feedback.mode === 'AI_EVALUATED_TEXT'
        ? t('practice.aiText')
        : null;
  const isReviewed = feedback.status === 'AUTO_REVIEWED';
  const summary =
    feedback.summary ??
    (isReviewed
      ? feedback.matched
        ? t('practice.aiMatched')
        : t('practice.aiNeedsReview')
      : t('practice.aiPendingReview'));

  return (
    <div
      className={`rounded-3xl border border-primary/10 bg-primary/5 p-5 text-sm text-foreground ${className ?? ''}`}
    >
      <div className="mb-3 flex items-center gap-2 text-primary">
        <MessageSquare className="h-5 w-5" />
        <h4 className="text-sm font-black uppercase tracking-tight">
          {t('practice.aiFeedbackTitle')}
        </h4>
      </div>

      <p className="font-medium leading-relaxed text-muted-foreground">{summary}</p>

      {feedback.transcript && (
        <p className="mt-3 break-words rounded-2xl bg-background/70 p-3 text-xs font-semibold text-muted-foreground">
          {t('practice.aiTranscriptValue', { value: feedback.transcript })}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {modeLabel && (
          <span className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {modeLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
          <CheckCircle2 className="h-3 w-3" />
          {isReviewed ? t('practice.aiReviewedBadge') : t('practice.aiPendingBadge')}
        </span>
      </div>
    </div>
  );
}

function normalizeAiFeedback(value: unknown): AIFeedbackShape | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return { status: 'PENDING_REVIEW', summary: value };
  }

  if (typeof value !== 'object') {
    return { status: 'PENDING_REVIEW' };
  }

  const candidate = value as Record<string, unknown>;
  return {
    status: typeof candidate.status === 'string' ? candidate.status : undefined,
    mode:
      candidate.mode === 'AI_EVALUATED_AUDIO' || candidate.mode === 'AI_EVALUATED_TEXT'
        ? candidate.mode
        : undefined,
    matched: typeof candidate.matched === 'boolean' ? candidate.matched : undefined,
    transcript: typeof candidate.transcript === 'string' ? candidate.transcript : undefined,
    summary: typeof candidate.summary === 'string' ? candidate.summary : undefined,
  };
}
