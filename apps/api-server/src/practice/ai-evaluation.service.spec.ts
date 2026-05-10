import { describe, expect, it, vi } from 'vitest';
import { PracticeQuestionType } from '@repo/database';
import { AiEvaluationService } from './ai-evaluation.service';

describe('AiEvaluationService', () => {
  it('should auto-review AI text answers against a reference answer', async () => {
    const service = new AiEvaluationService();

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: ' Ni Hao ',
        correctAnswer: 'ni hao',
      }),
    ).resolves.toEqual({
      status: 'AUTO_REVIEWED',
      mode: PracticeQuestionType.AI_EVALUATED_TEXT,
      matched: true,
      transcript: ' Ni Hao ',
    });
  });

  it('should leave answers pending when no usable reference answer exists', async () => {
    const service = new AiEvaluationService();

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_AUDIO,
        answer: 'spoken transcript',
        correctAnswer: null,
      }),
    ).resolves.toEqual({
      status: 'PENDING_REVIEW',
      mode: PracticeQuestionType.AI_EVALUATED_AUDIO,
      matched: false,
      transcript: 'spoken transcript',
    });
  });

  it('should merge gateway feedback when provider returns one', async () => {
    const aiGateway = {
      evaluatePracticeAnswer: vi.fn().mockResolvedValue({
        matched: true,
        transcript: 'Gateway transcript',
        summary: 'Gateway summary',
        confidence: 0.91,
        provider: 'gateway',
        model: 'test-model',
      }),
    };
    const service = new AiEvaluationService(aiGateway as never);

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'Hello',
        courseTitle: 'HSK 1',
      }),
    ).resolves.toEqual({
      status: 'AUTO_REVIEWED',
      mode: PracticeQuestionType.AI_EVALUATED_TEXT,
      matched: true,
      transcript: 'Gateway transcript',
      summary: 'Gateway summary',
      confidence: 0.91,
      provider: 'gateway',
      model: 'test-model',
    });
  });
});
