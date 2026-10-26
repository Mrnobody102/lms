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
      source: 'fallback',
      fallbackReason: 'provider_disabled',
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
      source: 'fallback',
      fallbackReason: 'provider_disabled',
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
      getRuntimeConfig: vi.fn().mockReturnValue({ enabled: true }),
    };
    const service = new AiEvaluationService(aiGateway as never);

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'Hello',
        courseTitle: 'IELTS Foundations',
      }),
    ).resolves.toEqual({
      status: 'AUTO_REVIEWED',
      mode: PracticeQuestionType.AI_EVALUATED_TEXT,
      matched: true,
      transcript: 'Gateway transcript',
      source: 'ai',
      summary: 'Gateway summary',
      confidence: 0.91,
      provider: 'gateway',
      model: 'test-model',
    });
  });

  it('should not consume AI quota when provider evaluation is disabled', async () => {
    const aiGateway = {
      evaluatePracticeAnswer: vi.fn(),
      getRuntimeConfig: vi.fn().mockReturnValue({ enabled: false }),
    };
    const aiGovernance = {
      reserve: vi.fn(),
      recordResult: vi.fn(),
    };
    const service = new AiEvaluationService(aiGateway as never, aiGovernance as never);

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'Hello',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).resolves.toEqual({
      status: 'AUTO_REVIEWED',
      mode: PracticeQuestionType.AI_EVALUATED_TEXT,
      matched: true,
      transcript: 'Hello',
      source: 'fallback',
      fallbackReason: 'provider_disabled',
    });

    expect(aiGovernance.reserve).not.toHaveBeenCalled();
    expect(aiGateway.evaluatePracticeAnswer).not.toHaveBeenCalled();
  });

  it('should fall back deterministically when governance denies the request', async () => {
    const aiGateway = {
      evaluatePracticeAnswer: vi.fn(),
      getRuntimeConfig: vi.fn().mockReturnValue({ enabled: true }),
    };
    const aiGovernance = {
      reserve: vi.fn().mockRejectedValue(new Error('quota exceeded')),
      recordResult: vi.fn(),
    };
    const service = new AiEvaluationService(aiGateway as never, aiGovernance as never);

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'hello',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).resolves.toMatchObject({
      status: 'AUTO_REVIEWED',
      matched: true,
      source: 'fallback',
      fallbackReason: 'governance_denied',
    });

    expect(aiGateway.evaluatePracticeAnswer).not.toHaveBeenCalled();
    expect(aiGovernance.recordResult).not.toHaveBeenCalled();
  });

  it('should record provider failures and mark the fallback as provider unavailable', async () => {
    const aiGateway = {
      evaluatePracticeAnswer: vi.fn().mockRejectedValue(new Error('timeout')),
      getRuntimeConfig: vi.fn().mockReturnValue({ enabled: true }),
    };
    const reservation = { ledgerId: 'ledger-1' };
    const aiGovernance = {
      reserve: vi.fn().mockResolvedValue(reservation),
      recordResult: vi.fn().mockResolvedValue(undefined),
    };
    const service = new AiEvaluationService(aiGateway as never, aiGovernance as never);

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_AUDIO,
        answer: 'spoken',
        correctAnswer: null,
        role: 'STUDENT',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).resolves.toMatchObject({
      status: 'PENDING_REVIEW',
      matched: false,
      source: 'fallback',
      fallbackReason: 'provider_unavailable',
    });

    expect(aiGovernance.recordResult).toHaveBeenCalledWith(reservation, 'FAILURE');
  });
});
