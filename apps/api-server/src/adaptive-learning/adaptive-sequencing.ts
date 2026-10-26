import { AdaptiveLearningPathItemStatus, Prisma } from '@repo/database';

/**
 * Deterministic, explainable sequencing for a learner's next adaptive steps.
 *
 * Inputs are already tenant-scoped rows. Every step carries a reason code,
 * the raw signals it was built from, and a score breakdown so admins and
 * learners can see why it was ranked where it is.
 */
export type AdaptiveStepKind = 'REVIEW_DUE' | 'ADAPTIVE_PATH' | 'WEAK_SKILL';

export type AdaptiveReasonCode =
  | 'srs_cards_due'
  | 'weak_skill_practice_misses'
  | 'low_skill_mastery';

export type AdaptiveNextAction =
  | 'review_srs'
  | 'practice_similar_questions'
  | 'practice_weak_skill';

export interface AdaptiveStepSignals {
  dueNow: number | null;
  dueToday: number | null;
  dueForSkill: number | null;
  topDueSkills: string[];
  /** Mastery as a 0-100 percentage, null when the learner has no mastery record. */
  mastery: number | null;
  attempts: number | null;
  attempted: number | null;
  incorrect: number | null;
  priority: number | null;
  questionCount: number | null;
}

export interface AdaptiveNextStep {
  id: string;
  kind: AdaptiveStepKind;
  rank: number;
  score: number;
  reasonCode: AdaptiveReasonCode;
  nextAction: AdaptiveNextAction;
  summary: string;
  href: string;
  skillCode: string | null;
  courseId: string | null;
  pathItemId: string | null;
  status: AdaptiveLearningPathItemStatus | null;
  signals: AdaptiveStepSignals;
  scoreBreakdown: Record<string, number>;
}

export interface SequencingPathItem {
  id: string;
  courseId: string;
  sourceSkillCode: string;
  questionIds: string[];
  status: AdaptiveLearningPathItemStatus;
  priority: number;
  reason: Prisma.JsonValue;
}

export interface SequencingMastery {
  skillCode: string;
  mastery: number;
  attempts: number;
}

export interface SequencingInput {
  pathItems: SequencingPathItem[];
  masteries: SequencingMastery[];
  dueNow: number;
  dueToday: number;
  dueSkillCounts: Record<string, number>;
  limit?: number;
}

export const ADAPTIVE_SEQUENCING = {
  maxSteps: 6,
  maxLimit: 10,
  weakMasteryThreshold: 0.6,
  minAttemptsForWeakSkill: 3,
  maxWeakSkillSteps: 3,
  topDueSkillCount: 3,
  reviewDue: { base: 90, perCard: 0.5, maxCards: 20 },
  adaptivePath: {
    base: 50,
    maxPriority: 30,
    masteryGapWeight: 20,
    unknownMasteryGap: 10,
    inProgressBonus: 5,
  },
  weakSkill: { base: 40, masteryGapWeight: 30 },
  srsBoost: { perCard: 2, maxCards: 5 },
} as const;

const KIND_ORDER: Record<AdaptiveStepKind, number> = {
  REVIEW_DUE: 0,
  ADAPTIVE_PATH: 1,
  WEAK_SKILL: 2,
};

export function buildAdaptiveNextSteps(input: SequencingInput): AdaptiveNextStep[] {
  const limit = normalizeLimit(input.limit);
  const masteryBySkill = new Map(input.masteries.map((entry) => [entry.skillCode, entry]));
  const candidates: AdaptiveNextStep[] = [];

  if (input.dueNow > 0) {
    candidates.push(buildReviewDueStep(input));
  }

  const bestPathStepBySkill = new Map<string, AdaptiveNextStep>();
  for (const item of input.pathItems) {
    const step = buildPathStep(
      item,
      masteryBySkill.get(item.sourceSkillCode) ?? null,
      input.dueSkillCounts[item.sourceSkillCode] ?? 0,
    );
    const existing = bestPathStepBySkill.get(item.sourceSkillCode);
    if (!existing || compareSteps(step, existing) < 0) {
      bestPathStepBySkill.set(item.sourceSkillCode, step);
    }
  }
  candidates.push(...bestPathStepBySkill.values());

  const coveredSkills = new Set(bestPathStepBySkill.keys());
  const weakSkillSteps = input.masteries
    .filter((entry) => !coveredSkills.has(entry.skillCode) && isWeakMastery(entry))
    .map((entry) => buildWeakSkillStep(entry, input.dueSkillCounts[entry.skillCode] ?? 0))
    .sort(compareSteps)
    .slice(0, ADAPTIVE_SEQUENCING.maxWeakSkillSteps);
  candidates.push(...weakSkillSteps);

  return candidates
    .sort(compareSteps)
    .slice(0, limit)
    .map((step, index) => ({ ...step, rank: index + 1 }));
}

export function countDueSkills(cards: Array<{ skillCodes: string[] }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    for (const code of new Set(card.skillCodes)) {
      const normalized = code.trim();
      if (!normalized) continue;
      counts[normalized] = (counts[normalized] ?? 0) + 1;
    }
  }
  return counts;
}

export function isWeakMastery(entry: SequencingMastery): boolean {
  return (
    entry.mastery < ADAPTIVE_SEQUENCING.weakMasteryThreshold &&
    entry.attempts >= ADAPTIVE_SEQUENCING.minAttemptsForWeakSkill
  );
}

function buildReviewDueStep(input: SequencingInput): AdaptiveNextStep {
  const { base, perCard, maxCards } = ADAPTIVE_SEQUENCING.reviewDue;
  const cardPart = Math.min(input.dueNow, maxCards) * perCard;
  const topDueSkills = Object.entries(input.dueSkillCounts)
    .sort(
      ([leftCode, left], [rightCode, right]) => right - left || leftCode.localeCompare(rightCode),
    )
    .slice(0, ADAPTIVE_SEQUENCING.topDueSkillCount)
    .map(([code]) => code);

  return {
    id: 'review-due',
    kind: 'REVIEW_DUE',
    rank: 0,
    score: round(base + cardPart),
    reasonCode: 'srs_cards_due',
    nextAction: 'review_srs',
    summary: `${input.dueNow} review cards are due now (${input.dueToday} due today)`,
    href: '/practice?tab=review',
    skillCode: null,
    courseId: null,
    pathItemId: null,
    status: null,
    signals: {
      ...emptySignals(),
      dueNow: input.dueNow,
      dueToday: input.dueToday,
      topDueSkills,
    },
    scoreBreakdown: { base, dueCards: round(cardPart) },
  };
}

function buildPathStep(
  item: SequencingPathItem,
  mastery: SequencingMastery | null,
  dueForSkill: number,
): AdaptiveNextStep {
  const config = ADAPTIVE_SEQUENCING.adaptivePath;
  const reason = toRecord(item.reason);
  const attempted = readNumber(reason.attempted);
  const incorrect = readNumber(reason.incorrect);
  const priorityPart = Math.min(Math.max(item.priority, 0), config.maxPriority);
  const masteryGap = mastery
    ? Math.round((1 - clamp01(mastery.mastery)) * config.masteryGapWeight)
    : config.unknownMasteryGap;
  const srsPart = srsBoost(dueForSkill);
  const inProgressPart =
    item.status === AdaptiveLearningPathItemStatus.IN_PROGRESS ? config.inProgressBonus : 0;
  const masteryPercent = mastery ? toPercent(mastery.mastery) : null;
  const missSummary =
    attempted !== null && incorrect !== null
      ? `Learner missed ${incorrect} of ${attempted} recent items for ${item.sourceSkillCode}`
      : `Learner needs more practice for ${item.sourceSkillCode}`;

  return {
    id: `path-${item.id}`,
    kind: 'ADAPTIVE_PATH',
    rank: 0,
    score: round(config.base + priorityPart + masteryGap + srsPart + inProgressPart),
    reasonCode: 'weak_skill_practice_misses',
    nextAction: 'practice_similar_questions',
    summary:
      masteryPercent === null
        ? missSummary
        : `${missSummary}; current mastery is ${masteryPercent}%`,
    href: `/practice/adaptive/${encodeURIComponent(item.id)}`,
    skillCode: item.sourceSkillCode,
    courseId: item.courseId,
    pathItemId: item.id,
    status: item.status,
    signals: {
      ...emptySignals(),
      dueForSkill,
      mastery: masteryPercent,
      attempts: mastery?.attempts ?? null,
      attempted,
      incorrect,
      priority: item.priority,
      questionCount: item.questionIds.length,
    },
    scoreBreakdown: {
      base: config.base,
      priority: priorityPart,
      masteryGap,
      srsDue: srsPart,
      inProgress: inProgressPart,
    },
  };
}

function buildWeakSkillStep(entry: SequencingMastery, dueForSkill: number): AdaptiveNextStep {
  const config = ADAPTIVE_SEQUENCING.weakSkill;
  const threshold = ADAPTIVE_SEQUENCING.weakMasteryThreshold;
  const masteryGap = Math.round(
    ((threshold - clamp01(entry.mastery)) / threshold) * config.masteryGapWeight,
  );
  const srsPart = srsBoost(dueForSkill);
  const masteryPercent = toPercent(entry.mastery);

  return {
    id: `weak-skill-${entry.skillCode}`,
    kind: 'WEAK_SKILL',
    rank: 0,
    score: round(config.base + masteryGap + srsPart),
    reasonCode: 'low_skill_mastery',
    nextAction: 'practice_weak_skill',
    summary: `Mastery for ${entry.skillCode} is ${masteryPercent}% after ${entry.attempts} attempts`,
    href: `/practice?skill=${encodeURIComponent(entry.skillCode)}`,
    skillCode: entry.skillCode,
    courseId: null,
    pathItemId: null,
    status: null,
    signals: {
      ...emptySignals(),
      dueForSkill,
      mastery: masteryPercent,
      attempts: entry.attempts,
    },
    scoreBreakdown: { base: config.base, masteryGap, srsDue: srsPart },
  };
}

function srsBoost(dueForSkill: number) {
  const { perCard, maxCards } = ADAPTIVE_SEQUENCING.srsBoost;
  return Math.min(Math.max(dueForSkill, 0), maxCards) * perCard;
}

function compareSteps(left: AdaptiveNextStep, right: AdaptiveNextStep): number {
  return (
    right.score - left.score ||
    KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
    (left.skillCode ?? '').localeCompare(right.skillCode ?? '') ||
    left.id.localeCompare(right.id)
  );
}

function normalizeLimit(value: number | undefined) {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return ADAPTIVE_SEQUENCING.maxSteps;
  }
  return Math.min(value, ADAPTIVE_SEQUENCING.maxLimit);
}

function emptySignals(): AdaptiveStepSignals {
  return {
    dueNow: null,
    dueToday: null,
    dueForSkill: null,
    topDueSkills: [],
    mastery: null,
    attempts: null,
    attempted: null,
    incorrect: null,
    priority: null,
    questionCount: null,
  };
}

function toPercent(value: number) {
  return Math.round(clamp01(value) * 100);
}

function clamp01(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
