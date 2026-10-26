import { describe, expect, it } from 'vitest';
import { AdaptiveLearningPathItemStatus } from '@repo/database';
import { buildAdaptiveNextSteps, countDueSkills } from './adaptive-sequencing';

const pathItem = {
  id: 'path-1',
  courseId: 'course-1',
  sourceSkillCode: 'PAST_TENSE',
  questionIds: ['q1', 'q2', 'q3'],
  status: AdaptiveLearningPathItemStatus.PENDING,
  priority: 22,
  reason: { source: 'practice-attempt', attempted: 3, incorrect: 2 },
};

describe('buildAdaptiveNextSteps', () => {
  it('puts due SRS cards first and explains the ranking with score breakdowns', () => {
    const steps = buildAdaptiveNextSteps({
      pathItems: [pathItem],
      masteries: [
        { skillCode: 'PAST_TENSE', mastery: 0.35, attempts: 6 },
        { skillCode: 'VOCAB', mastery: 0.4, attempts: 5 },
        { skillCode: 'READING', mastery: 0.9, attempts: 10 },
      ],
      dueNow: 8,
      dueToday: 12,
      dueSkillCounts: { VOCAB: 6, PAST_TENSE: 1 },
    });

    expect(steps.map((step) => [step.rank, step.kind, step.skillCode])).toEqual([
      [1, 'REVIEW_DUE', null],
      [2, 'ADAPTIVE_PATH', 'PAST_TENSE'],
      [3, 'WEAK_SKILL', 'VOCAB'],
    ]);

    const [review, path, weak] = steps;
    expect(review).toMatchObject({
      reasonCode: 'srs_cards_due',
      nextAction: 'review_srs',
      href: '/practice?tab=review',
      score: 94,
      signals: expect.objectContaining({
        dueNow: 8,
        dueToday: 12,
        topDueSkills: ['VOCAB', 'PAST_TENSE'],
      }),
      scoreBreakdown: { base: 90, dueCards: 4 },
    });
    expect(path).toMatchObject({
      reasonCode: 'weak_skill_practice_misses',
      nextAction: 'practice_similar_questions',
      pathItemId: 'path-1',
      courseId: 'course-1',
      href: '/practice/adaptive/path-1',
      summary: 'Learner missed 2 of 3 recent items for PAST_TENSE; current mastery is 35%',
      score: 50 + 22 + 13 + 2,
      scoreBreakdown: { base: 50, priority: 22, masteryGap: 13, srsDue: 2, inProgress: 0 },
      signals: expect.objectContaining({
        attempted: 3,
        incorrect: 2,
        mastery: 35,
        attempts: 6,
        dueForSkill: 1,
        questionCount: 3,
      }),
    });
    expect(weak).toMatchObject({
      reasonCode: 'low_skill_mastery',
      nextAction: 'practice_weak_skill',
      href: '/practice?skill=VOCAB',
      summary: 'Mastery for VOCAB is 40% after 5 attempts',
      score: 40 + 10 + 10,
      scoreBreakdown: { base: 40, masteryGap: 10, srsDue: 10 },
    });
  });

  it('skips weak-skill steps for skills already covered by a path item and for untested skills', () => {
    const steps = buildAdaptiveNextSteps({
      pathItems: [pathItem],
      masteries: [
        { skillCode: 'PAST_TENSE', mastery: 0.2, attempts: 8 },
        { skillCode: 'NEW_SKILL', mastery: 0.1, attempts: 1 },
        { skillCode: 'STRONG', mastery: 0.8, attempts: 12 },
      ],
      dueNow: 0,
      dueToday: 0,
      dueSkillCounts: {},
    });

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ kind: 'ADAPTIVE_PATH', skillCode: 'PAST_TENSE', rank: 1 });
  });

  it('keeps one step per skill, prefers in-progress items, and is deterministic', () => {
    const input = {
      pathItems: [
        { ...pathItem, id: 'older', priority: 22 },
        {
          ...pathItem,
          id: 'in-progress',
          priority: 22,
          status: AdaptiveLearningPathItemStatus.IN_PROGRESS,
        },
        { ...pathItem, id: 'grammar', sourceSkillCode: 'GRAMMAR', priority: 31 },
      ],
      masteries: [],
      dueNow: 0,
      dueToday: 0,
      dueSkillCounts: {},
    };

    const first = buildAdaptiveNextSteps(input);
    const second = buildAdaptiveNextSteps({ ...input, pathItems: [...input.pathItems].reverse() });

    expect(first).toEqual(second);
    expect(first.map((step) => [step.rank, step.pathItemId, step.score, step.status])).toEqual([
      [1, 'grammar', 90, AdaptiveLearningPathItemStatus.PENDING],
      [2, 'in-progress', 87, AdaptiveLearningPathItemStatus.IN_PROGRESS],
    ]);
    expect(first[0].scoreBreakdown).toEqual({
      base: 50,
      priority: 30,
      masteryGap: 10,
      srsDue: 0,
      inProgress: 0,
    });
  });

  it('honours the limit and caps weak-skill steps', () => {
    const masteries = ['A', 'B', 'C', 'D', 'E'].map((code, index) => ({
      skillCode: code,
      mastery: 0.1 * (index + 1),
      attempts: 4,
    }));

    const capped = buildAdaptiveNextSteps({
      pathItems: [],
      masteries,
      dueNow: 3,
      dueToday: 3,
      dueSkillCounts: {},
    });
    expect(capped.map((step) => step.kind)).toEqual([
      'REVIEW_DUE',
      'WEAK_SKILL',
      'WEAK_SKILL',
      'WEAK_SKILL',
    ]);
    expect(capped.map((step) => step.skillCode)).toEqual([null, 'A', 'B', 'C']);

    const limited = buildAdaptiveNextSteps({
      pathItems: [],
      masteries,
      dueNow: 3,
      dueToday: 3,
      dueSkillCounts: {},
      limit: 2,
    });
    expect(limited.map((step) => step.rank)).toEqual([1, 2]);
  });
});

describe('countDueSkills', () => {
  it('counts each skill once per card and ignores blank codes', () => {
    expect(
      countDueSkills([
        { skillCodes: ['VOCAB', 'VOCAB', ' '] },
        { skillCodes: ['VOCAB', 'GRAMMAR'] },
        { skillCodes: [] },
      ]),
    ).toEqual({ VOCAB: 2, GRAMMAR: 1 });
  });
});
