'use client';

import { Compass, Dumbbell, RefreshCcw, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ErrorState, LoadingState } from '@repo/ui';
import { Badge } from '@/components/ui';
import { useLearnerNextSteps } from '@/hooks/use-adaptive';
import type { AdaptiveNextStep, AdaptiveStepKind } from '@/lib/adaptive-api';

type AdaptiveTranslator = ReturnType<typeof useTranslations>;

const DEFAULT_MASTERY_THRESHOLD = 60;

export function LearnerAdaptivePanel({ userId }: { userId: string }) {
  const t = useTranslations('Admin.adaptive');
  const { data, isLoading, isError } = useLearnerNextSteps(userId);
  const steps = data?.steps ?? [];
  const threshold = data?.signals.weakMasteryThreshold ?? DEFAULT_MASTERY_THRESHOLD;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b bg-muted/40 p-4 flex items-center gap-2">
        <Compass className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{t('title')}</h3>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">{t('desc')}</p>

        {isLoading ? (
          <LoadingState title={t('loading')} className="rounded-lg border" />
        ) : isError || !data ? (
          <ErrorState title={t('loadError')} />
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label={t('summary.dueNow')} value={data.signals.dueNow} />
              <SummaryTile label={t('summary.weakSkills')} value={data.signals.weakSkillCount} />
              <SummaryTile
                label={t('summary.pendingPaths')}
                value={data.signals.pendingPathItems}
              />
              <SummaryTile label={t('summary.tracked')} value={data.signals.trackedSkillCount} />
            </dl>

            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('empty')}</p>
            ) : (
              <ol className="space-y-3">
                {steps.map((step) => (
                  <StepRow key={step.id} step={step} t={t} />
                ))}
              </ol>
            )}

            <p className="text-xs text-muted-foreground">{t('explainer', { threshold })}</p>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function StepRow({ step, t }: { step: AdaptiveNextStep; t: AdaptiveTranslator }) {
  const breakdown = Object.entries(step.scoreBreakdown)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');

  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {t('rankValue', { rank: step.rank })}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <StepIcon kind={step.kind} />
        </span>
        <Badge variant="outline">{getKindLabel(step.kind, t)}</Badge>
        {step.skillCode ? (
          <span className="font-mono text-xs font-semibold">{step.skillCode}</span>
        ) : null}
        {step.status ? (
          <span className="text-xs text-muted-foreground">{getStatusLabel(step.status, t)}</span>
        ) : null}
        <span className="ml-auto text-xs font-medium text-muted-foreground" title={breakdown}>
          {t('scoreValue', { score: step.score })}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">{getReasonLabel(step, t)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {buildSignalChips(step, t).map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    </li>
  );
}

function StepIcon({ kind }: { kind: AdaptiveStepKind }) {
  switch (kind) {
    case 'REVIEW_DUE':
      return <RefreshCcw className="h-4 w-4" />;
    case 'ADAPTIVE_PATH':
      return <Target className="h-4 w-4" />;
    case 'WEAK_SKILL':
      return <Dumbbell className="h-4 w-4" />;
  }
}

function getKindLabel(kind: AdaptiveStepKind, t: AdaptiveTranslator) {
  switch (kind) {
    case 'REVIEW_DUE':
      return t('kind.reviewDue');
    case 'ADAPTIVE_PATH':
      return t('kind.adaptivePath');
    case 'WEAK_SKILL':
      return t('kind.weakSkill');
  }
}

function getReasonLabel(step: AdaptiveNextStep, t: AdaptiveTranslator) {
  switch (step.reasonCode) {
    case 'srs_cards_due':
      return t('reason.srsCardsDue');
    case 'weak_skill_practice_misses':
      return t('reason.practiceMisses');
    case 'low_skill_mastery':
      return t('reason.lowMastery');
  }
}

function getStatusLabel(status: NonNullable<AdaptiveNextStep['status']>, t: AdaptiveTranslator) {
  switch (status) {
    case 'IN_PROGRESS':
      return t('status.inProgress');
    case 'COMPLETED':
      return t('status.completed');
    case 'SKIPPED':
      return t('status.skipped');
    default:
      return t('status.pending');
  }
}

function buildSignalChips(step: AdaptiveNextStep, t: AdaptiveTranslator) {
  const { signals } = step;
  const chips: string[] = [];

  if (signals.dueNow !== null) chips.push(t('signals.dueNow', { value: signals.dueNow }));
  if (signals.dueToday !== null) chips.push(t('signals.dueToday', { value: signals.dueToday }));
  if (signals.topDueSkills.length > 0) {
    chips.push(t('signals.topSkills', { value: signals.topDueSkills.join(', ') }));
  }
  if (signals.attempted !== null && signals.incorrect !== null) {
    chips.push(t('signals.misses', { incorrect: signals.incorrect, attempted: signals.attempted }));
  }
  if (signals.mastery !== null) chips.push(t('signals.mastery', { value: signals.mastery }));
  if (signals.attempts !== null) chips.push(t('signals.attempts', { value: signals.attempts }));
  if (signals.questionCount !== null) {
    chips.push(t('signals.questions', { value: signals.questionCount }));
  }
  if (signals.dueForSkill !== null && signals.dueForSkill > 0) {
    chips.push(t('signals.dueForSkill', { value: signals.dueForSkill }));
  }

  return chips;
}
