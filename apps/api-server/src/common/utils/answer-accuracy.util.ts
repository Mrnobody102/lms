export interface AnswerAccuracyInput {
  isCorrect: boolean;
  unitId: string | null;
  unitTitle: string | null;
  skillTags: string[];
}

export interface UnitAccuracyEntry {
  id: string;
  title: string;
  accuracy: number;
  totalQuestions: number;
}

export interface SkillAccuracyEntry {
  skill: string;
  accuracy: number;
  totalQuestions: number;
}

export interface AccuracyReport {
  accuracyByUnit: UnitAccuracyEntry[];
  accuracyBySkill: SkillAccuracyEntry[];
}

/**
 * Aggregate answer correctness into per-unit and per-skill accuracy rollups.
 * Used by both the student progress performance report and the admin reports module.
 */
export function buildAnswerAccuracy(answers: Iterable<AnswerAccuracyInput>): AccuracyReport {
  const unitStats: Record<string, { title: string; correct: number; total: number }> = {};
  const skillStats: Record<string, { correct: number; total: number }> = {};

  for (const answer of answers) {
    if (answer.unitId) {
      if (!unitStats[answer.unitId]) {
        unitStats[answer.unitId] = {
          title: answer.unitTitle || 'Unknown Unit',
          correct: 0,
          total: 0,
        };
      }
      unitStats[answer.unitId].total += 1;
      if (answer.isCorrect) {
        unitStats[answer.unitId].correct += 1;
      }
    }

    for (const tag of answer.skillTags) {
      if (!skillStats[tag]) {
        skillStats[tag] = { correct: 0, total: 0 };
      }
      skillStats[tag].total += 1;
      if (answer.isCorrect) {
        skillStats[tag].correct += 1;
      }
    }
  }

  const accuracyByUnit = Object.entries(unitStats).map(([id, stats]) => ({
    id,
    title: stats.title,
    accuracy: stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100),
    totalQuestions: stats.total,
  }));

  const accuracyBySkill = Object.entries(skillStats).map(([skill, stats]) => ({
    skill,
    accuracy: stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100),
    totalQuestions: stats.total,
  }));

  return { accuracyByUnit, accuracyBySkill };
}
