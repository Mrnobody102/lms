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
            priority: 22,
            reason: {
              source: 'practice-attempt',
              attempted: 3,
              incorrect: 2,
            },
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
    expect(result[0].recommendation).toEqual({
      reasonCode: 'weak_skill_practice_misses',
      source: 'practice-attempt',
      summary: 'Learner missed 2 of 3 recent items for PAST_TENSE',
      nextAction: 'practice_similar_questions',
      signals: {
        attempted: 3,
        incorrect: 2,
        priority: 22,
        questionCount: 2,
        sourceSkillCode: 'PAST_TENSE',
      },
    });
    expect(prisma.practiceQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reviewStatus: QuestionReviewStatus.APPROVED,
        }),
      }),
    );
  });

  it('limits instructor adaptive path lookups to assigned courses even without a course filter', async () => {
    const prisma = {
      adaptiveLearningPathItem: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      practiceQuestion: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({
        tenantId: 'tenant-1',
        deletedAt: null,
        isActive: true,
        instructorAssignments: {
          some: {
            instructorId: 'instructor-1',
            tenantId: 'tenant-1',
          },
        },
      }),
    };
    const service = new AdaptiveLearningService(prisma as never, learningAccess as never);

    await service.listPath(
      'tenant-1',
      { id: 'instructor-1', role: Role.INSTRUCTOR },
      { userId: 'student-1' },
    );

    expect(learningAccess.courseWhere).toHaveBeenCalledWith(
      'tenant-1',
      { id: 'instructor-1', role: Role.INSTRUCTOR },
      undefined,
    );
    expect(prisma.adaptiveLearningPathItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'student-1',
          course: expect.objectContaining({
            instructorAssignments: {
              some: {
                instructorId: 'instructor-1',
                tenantId: 'tenant-1',
              },
            },
          }),
        }),
      }),
    );
  });

  it('prevents instructors from updating adaptive path items outside assigned courses', async () => {
    const prisma = {
      adaptiveLearningPathItem: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({
        tenantId: 'tenant-1',
        deletedAt: null,
        isActive: true,
        instructorAssignments: {
          some: {
            instructorId: 'instructor-1',
            tenantId: 'tenant-1',
          },
        },
      }),
    };
    const service = new AdaptiveLearningService(prisma as never, learningAccess as never);

    await expect(
      service.updateStatus(
        'tenant-1',
        { id: 'instructor-1', role: Role.INSTRUCTOR },
        'path-1',
        AdaptiveLearningPathItemStatus.COMPLETED,
      ),
    ).rejects.toThrow('Adaptive learning path item not found');

    expect(prisma.adaptiveLearningPathItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'path-1',
          tenantId: 'tenant-1',
          course: expect.objectContaining({
            instructorAssignments: {
              some: {
                instructorId: 'instructor-1',
                tenantId: 'tenant-1',
              },
            },
          }),
        }),
      }),
    );
    expect(prisma.adaptiveLearningPathItem.update).not.toHaveBeenCalled();
  });
});
