import api from './api';

export type AdaptiveStepKind = 'REVIEW_DUE' | 'ADAPTIVE_PATH' | 'WEAK_SKILL';

export type AdaptiveReasonCode =
  | 'srs_cards_due'
  | 'weak_skill_practice_misses'
  | 'low_skill_mastery';

export type AdaptiveNextAction =
  | 'review_srs'
  | 'practice_similar_questions'
  | 'practice_weak_skill';

export type AdaptivePathItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface AdaptiveStepSignals {
  dueNow: number | null;
  dueToday: number | null;
  dueForSkill: number | null;
  topDueSkills: string[];
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
  status: AdaptivePathItemStatus | null;
  signals: AdaptiveStepSignals;
  scoreBreakdown: Record<string, number>;
}

export interface AdaptiveNextStepsResponse {
  learnerId: string;
  courseId: string | null;
  generatedAt: string;
  steps: AdaptiveNextStep[];
  signals: {
    dueNow: number;
    dueToday: number;
    pendingPathItems: number;
    trackedSkillCount: number;
    weakSkillCount: number;
    weakMasteryThreshold: number;
  };
}

export interface AdaptiveNextStepsParams {
  courseId?: string;
  limit?: number;
}

export type AdaptivePathStatusUpdate = Extract<
  AdaptivePathItemStatus,
  'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
>;

export const adaptiveApi = {
  startPractice(id: string) {
    return api
      .post(`/adaptive-learning/path/${id}/start`)
      .then((response) => response.data as { exerciseSetId: string });
  },
  getNextSteps(params?: AdaptiveNextStepsParams) {
    return api
      .get('/adaptive-learning/next-steps', { params })
      .then((response) => response.data as AdaptiveNextStepsResponse);
  },
  updatePathItemStatus(id: string, status: AdaptivePathStatusUpdate) {
    return api
      .patch(`/adaptive-learning/path/${id}/status`, { status })
      .then((response) => response.data as { id: string; status: AdaptivePathItemStatus });
  },
};
