import { describe, expect, it } from 'vitest';
import { PracticeQuestionType } from '@repo/database';
import { AiEvaluationService } from './ai-evaluation.service';

describe('AiEvaluationService', () => {
  it('should auto-review AI text answers against a reference answer', () => {
    const service = new AiEvaluationService();

    expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: ' Ni Hao ',
        correctAnswer: 'ni hao',
      }),
    ).toEqual({
      status: 'AUTO_REVIEWED',
      mode: PracticeQuestionType.AI_EVALUATED_TEXT,
      matched: true,
      transcript: ' Ni Hao ',
    });
  });

  it('should leave answers pending when no usable reference answer exists', () => {
    const service = new AiEvaluationService();

    expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_AUDIO,
        answer: 'spoken transcript',
        correctAnswer: null,
      }),
    ).toEqual({
      status: 'PENDING_REVIEW',
      mode: PracticeQuestionType.AI_EVALUATED_AUDIO,
      matched: false,
      transcript: 'spoken transcript',
    });
  });
});
