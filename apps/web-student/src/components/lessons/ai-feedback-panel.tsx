'use client';

import { CheckCircle2, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PracticeQuestionType } from '../../lib/practice-api';

interface AIFeedbackPanelProps {
  aiFeedback?: unknown;
  className?: string;
}

type AIFeedbackSource = 'ai' | 'fallback';

type AIFallbackReason =
  | 'provider_disabled'
  | 'governance_denied'
  | 'provider_unavailable'
  | 'unknown';

interface AIFeedbackShape {
  status?: string;
  mode?: PracticeQuestionType;
  matched?: boolean;
  transcript?: string;
  summary?: string;
  confidence?: number;
  provider?: string;
  model?: string;
  source?: AIFeedbackSource;
  fallbackReason?: AIFallbackReason;
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
  const isFallback = feedback.source === 'fallback';
  const summary =
    feedback.summary ??
    (isReviewed
      ? feedback.matched
        ? t('practice.aiMatched')
        : t('practice.aiNeedsReview')
      : isFallback
        ? t('practice.aiFallbackPending')
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

      {isFallback && (
        <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          {getFallbackMessage(feedback.fallbackReason, t)}
        </p>
      )}

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
          {isReviewed
            ? isFallback
              ? t('practice.aiFallbackBadge')
              : t('practice.aiReviewedBadge')
            : t('practice.aiPendingBadge')}
        </span>
        {isFallback && !isReviewed && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            {t('practice.aiFallbackBadge')}
          </span>
        )}
        {typeof feedback.confidence === 'number' && (
          <span className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('practice.aiConfidenceValue', {
              value: Math.round(feedback.confidence * 100),
            })}
          </span>
        )}
        {feedback.provider && (
          <span className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('practice.aiProviderValue', { value: feedback.provider })}
          </span>
        )}
        {feedback.model && (
          <span className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t('practice.aiModelValue', { value: feedback.model })}
          </span>
        )}
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
    confidence: normalizeConfidence(candidate.confidence),
    provider: typeof candidate.provider === 'string' ? candidate.provider : undefined,
    model: typeof candidate.model === 'string' ? candidate.model : undefined,
    source: normalizeSource(candidate.source),
    fallbackReason: normalizeFallbackReason(candidate.fallbackReason),
  };
}

function normalizeSource(value: unknown): AIFeedbackSource | undefined {
  return value === 'ai' || value === 'fallback' ? value : undefined;
}

function normalizeFallbackReason(value: unknown): AIFallbackReason | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value === 'provider_disabled' ||
    value === 'governance_denied' ||
    value === 'provider_unavailable'
    ? value
    : 'unknown';
}

function getFallbackMessage(
  reason: AIFallbackReason | undefined,
  t: ReturnType<typeof useTranslations>,
) {
  switch (reason) {
    case 'provider_disabled':
      return t('practice.aiFallbackDisabled');
    case 'governance_denied':
      return t('practice.aiFallbackDenied');
    case 'provider_unavailable':
      return t('practice.aiFallbackUnavailable');
    default:
      return t('practice.aiFallbackUnknown');
  }
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
