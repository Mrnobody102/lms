import { describe, expect, it, vi } from 'vitest';
import { AdaptiveLearningPathItemStatus, QuestionReviewStatus, Role } from '@repo/database';
import { AdaptiveLearningService } from './adaptive-learning.service';

describe('AdaptiveLearningService', () => {
  it('creates a pending adaptive path item when a learner misses multiple questions in one skill', async () => {
    const prisma = {
      adaptiveLearningPathItem: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'path-1' }),
      },
      practiceQuestion: {
        findMany: vi.fn().mockResolvedValue([{ id: 'q3' }, { id: 'q4' }, { id: 'q5' }]),
      },
    };
    const service = new AdaptiveLearningService(prisma as never, {} as never);

    const result = await service.createRecommendationsFromPracticeAttempt({
      tenantId: 'tenant-1',
      userId: 'user-1',
      courseId: 'course-1',
      attemptId: 'attempt-1',
      results: [
        { questionId: 'q1', isCorrect: false, skillTags: ['PAST_TENSE'] },
        { questionId: 'q2', isCorrect: false, skillTags: ['PAST_TENSE'] },
        { questionId: 'q6', isCorrect: true, skillTags: ['VOCAB'] },
      ],
    });

    expect(result.created).toBe(1);
    expect(prisma.practiceQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          courseId: 'course-1',
          reviewStatus: QuestionReviewStatus.APPROVED,
          skillTags: { has: 'PAST_TENSE' },
          id: { notIn: ['q1', 'q2', 'q6'] },
        }),
      }),
    );
    expect(prisma.adaptiveLearningPathItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceSkillCode: 'PAST_TENSE',
          sourceAttemptId: 'attempt-1',
          questionIds: ['q3', 'q4', 'q5'],
          priority: 22,
        }),
      }),
    );
  });

  it('returns student-safe question payloads for adaptive path items', async () => {
    const prisma = {
      adaptiveLearningPathItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'path-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            courseId: 'course-1',
            sourceSkillCode: 'PAST_TENSE',
            questionIds: ['q2', 'q1'],
            status: AdaptiveLearningPathItemStatus.PENDING,
          },
        ]),
      },
      practiceQuestion: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'q1', prompt: 'First', options: null, skillTags: ['PAST_TENSE'] },
          { id: 'q2', prompt: 'Second', options: null, skillTags: ['PAST_TENSE'] },
        ]),
      },
    };
    const service = new AdaptiveLearningService(prisma as never, {} as never);

    const result = await service.listPath('tenant-1', { id: 'user-1', role: Role.STUDENT }, {});

    expect(result[0].questions.map((question) => question.id)).toEqual(['q2', 'q1']);
    expect(result[0].questions[0]).not.toHaveProperty('correctAnswer');
  });
});
