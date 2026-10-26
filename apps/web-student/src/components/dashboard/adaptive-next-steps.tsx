'use client';

import {
  ArrowRight,
  Compass,
  Dumbbell,
  Loader2,
  RefreshCcw,
  SkipForward,
  Target,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdaptiveNextSteps, useUpdateAdaptivePathStatus } from '@/hooks/use-adaptive';
import type { AdaptiveNextStep, AdaptiveStepKind } from '@/lib/adaptive-api';
import { Link } from '@/navigation';

type StudentTranslator = ReturnType<typeof useTranslations>;

const DEFAULT_MASTERY_THRESHOLD = 60;

export function AdaptiveNextSteps({ enabled = true }: { enabled?: boolean }) {
  const t = useTranslations('Student');
  const { data, isLoading, isError, refetch } = useAdaptiveNextSteps(undefined, enabled);
  const updateStatus = useUpdateAdaptivePathStatus();
  const steps = data?.steps ?? [];
  const threshold = data?.signals.weakMasteryThreshold ?? DEFAULT_MASTERY_THRESHOLD;

  return (
    <section className="rounded-md border bg-card p-5" data-testid="adaptive-next-steps">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Compass className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t('adaptive.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('adaptive.desc')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-20 animate-pulse rounded-md border bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {t('adaptive.loadError')}
          <button type="button" onClick={() => void refetch()} className="ml-3 underline">
            {t('adaptive.retry')}
          </button>
        </div>
      ) : steps.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t('adaptive.empty')}</p>
          <p className="mt-1">{t('adaptive.emptyDesc')}</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              threshold={threshold}
              isUpdating={updateStatus.isPending}
              onSkip={(id) => updateStatus.mutate({ id, status: 'SKIPPED' })}
            />
          ))}
        </ol>
      )}

      {updateStatus.isError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {t('adaptive.actionError')}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">{t('adaptive.explainer', { threshold })}</p>
    </section>
  );
}

function StepRow({
  step,
  threshold,
  isUpdating,
  onSkip,
}: {
  step: AdaptiveNextStep;
  threshold: number;
  isUpdating: boolean;
  onSkip: (pathItemId: string) => void;
}) {
  const t = useTranslations('Student');
  const pathItemId = step.kind === 'ADAPTIVE_PATH' ? step.pathItemId : null;
  const dueForSkill = step.signals.dueForSkill ?? 0;

  return (
    <li className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <StepIcon kind={step.kind} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {t('adaptive.rankValue', { rank: step.rank })}
            </span>
            <h3 className="break-words text-sm font-semibold">{getStepTitle(step, t)}</h3>
            {step.status === 'IN_PROGRESS' ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {t('adaptive.inProgressBadge')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{getStepDetail(step, threshold, t)}</p>
          {dueForSkill > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('adaptive.dueForSkill', { count: dueForSkill })}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {pathItemId ? (
          <button
            type="button"
            onClick={() => onSkip(pathItemId)}
            disabled={isUpdating}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SkipForward className="h-4 w-4" />
            )}
            {t('adaptive.skip')}
          </button>
        ) : null}
        <Link
          href={step.href}
          aria-disabled={isUpdating}
          onClick={(event) => {
            if (isUpdating) event.preventDefault();
          }}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          {getStepCta(step, t)}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </li>
  );
}

function StepIcon({ kind }: { kind: AdaptiveStepKind }) {
  switch (kind) {
    case 'REVIEW_DUE':
      return <RefreshCcw className="h-5 w-5" />;
    case 'ADAPTIVE_PATH':
      return <Target className="h-5 w-5" />;
    case 'WEAK_SKILL':
      return <Dumbbell className="h-5 w-5" />;
  }
}

function getStepTitle(step: AdaptiveNextStep, t: StudentTranslator) {
  switch (step.kind) {
    case 'REVIEW_DUE':
      return t('adaptive.step.srsDueTitle', { count: step.signals.dueNow ?? 0 });
    case 'ADAPTIVE_PATH':
      return t('adaptive.step.pathTitle', { skill: step.skillCode ?? '' });
    case 'WEAK_SKILL':
      return t('adaptive.step.weakTitle', { skill: step.skillCode ?? '' });
  }
}

function getStepDetail(step: AdaptiveNextStep, threshold: number, t: StudentTranslator) {
  const { signals } = step;

  switch (step.kind) {
    case 'REVIEW_DUE':
      return signals.topDueSkills.length > 0
        ? t('adaptive.step.srsDueDetail', {
            today: signals.dueToday ?? 0,
            skills: signals.topDueSkills.join(', '),
          })
        : t('adaptive.step.srsDueDetailNoSkills', { today: signals.dueToday ?? 0 });
    case 'ADAPTIVE_PATH':
      if (signals.attempted === null || signals.incorrect === null) {
        return t('adaptive.step.pathDetailNoStats');
      }
      return signals.mastery === null
        ? t('adaptive.step.pathDetailNoMastery', {
            incorrect: signals.incorrect,
            attempted: signals.attempted,
          })
        : t('adaptive.step.pathDetail', {
            incorrect: signals.incorrect,
            attempted: signals.attempted,
            mastery: signals.mastery,
          });
    case 'WEAK_SKILL':
      return t('adaptive.step.weakDetail', {
        mastery: signals.mastery ?? 0,
        attempts: signals.attempts ?? 0,
        threshold,
      });
  }
}

function getStepCta(step: AdaptiveNextStep, t: StudentTranslator) {
  switch (step.nextAction) {
    case 'review_srs':
      return t('adaptive.action.reviewSrs');
    case 'practice_similar_questions':
      return t('adaptive.action.practiceSimilar');
    case 'practice_weak_skill':
      return t('adaptive.action.practiceWeak');
  }
}
