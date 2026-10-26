import { describe, expect, it, vi } from 'vitest';
import { AdaptiveLearningPathItemStatus, EnrollmentStatus, Role } from '@repo/database';
import { AdaptiveLearningService } from './adaptive-learning.service';

function createAccess() {
  return {
    courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', deletedAt: null }),
    reviewCardWhere: vi.fn(async (tenantId: string, userId: string) => ({ tenantId, userId })),
  };
}

function createPrisma(overrides: Record<string, unknown> = {}) {
  return {
    adaptiveLearningPathItem: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'path-1',
          courseId: 'course-1',
          sourceSkillCode: 'PAST_TENSE',
          questionIds: ['q1', 'q2'],
          status: AdaptiveLearningPathItemStatus.PENDING,
          priority: 22,
          reason: { source: 'practice-attempt', attempted: 3, incorrect: 2 },
        },
      ]),
    },
    skillMastery: {
      findMany: vi.fn().mockResolvedValue([
        { skillCode: 'PAST_TENSE', mastery: 0.3, attempts: 5 },
        { skillCode: 'VOCAB', mastery: 0.5, attempts: 4 },
      ]),
    },
    reviewCard: {
      count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(5),
      findMany: vi.fn().mockResolvedValue([{ skillCodes: ['VOCAB'] }, { skillCodes: ['VOCAB'] }]),
    },
    courseEnrollment: {
      count: vi.fn().mockResolvedValue(1),
    },
    ...overrides,
  };
}

describe('AdaptiveLearningService.getNextSteps', () => {
  it('sequences SRS due cards, adaptive path items, and weak skills for the current student', async () => {
    const prisma = createPrisma();
    const service = new AdaptiveLearningService(prisma as never, createAccess() as never);

    const result = await service.getNextSteps('tenant-1', { id: 'user-1', role: Role.STUDENT }, {});

    expect(result.learnerId).toBe('user-1');
    expect(result.signals).toEqual({
      dueNow: 2,
      dueToday: 5,
      pendingPathItems: 1,
      trackedSkillCount: 2,
      weakSkillCount: 2,
      weakMasteryThreshold: 60,
    });
    expect(result.steps.map((step) => [step.rank, step.kind, step.skillCode])).toEqual([
      [1, 'REVIEW_DUE', null],
      [2, 'ADAPTIVE_PATH', 'PAST_TENSE'],
      [3, 'WEAK_SKILL', 'VOCAB'],
    ]);

    for (const call of [
      prisma.adaptiveLearningPathItem.findMany,
      prisma.skillMastery.findMany,
      prisma.reviewCard.findMany,
    ]) {
      expect(call).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1' }),
        }),
      );
    }
    expect(prisma.adaptiveLearningPathItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: [
              AdaptiveLearningPathItemStatus.PENDING,
              AdaptiveLearningPathItemStatus.IN_PROGRESS,
            ],
          },
        }),
      }),
    );
    expect(prisma.courseEnrollment.count).not.toHaveBeenCalled();
  });

  it('ignores userId overrides from students and requires it for admins', async () => {
    const prisma = createPrisma();
    const service = new AdaptiveLearningService(prisma as never, createAccess() as never);

    await service.getNextSteps(
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      { userId: 'someone-else' },
    );
    expect(prisma.skillMastery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', userId: 'user-1' } }),
    );

    await expect(
      service.getNextSteps('tenant-1', { id: 'admin-1', role: Role.ADMIN }, {}),
    ).rejects.toThrow('userId is required');
  });

  it('blocks instructors from learners outside their assigned courses', async () => {
    const prisma = createPrisma({ courseEnrollment: { count: vi.fn().mockResolvedValue(0) } });
    const courseWhere = { tenantId: 'tenant-1', instructorAssignments: { some: {} } };
    const learningAccess = { ...createAccess(), courseWhere: vi.fn().mockReturnValue(courseWhere) };
    const service = new AdaptiveLearningService(prisma as never, learningAccess as never);

    await expect(
      service.getNextSteps(
        'tenant-1',
        { id: 'instructor-1', role: Role.INSTRUCTOR },
        { userId: 'student-1' },
      ),
    ).rejects.toThrow('Instructors can only view learners in assigned courses');

    expect(prisma.courseEnrollment.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        userId: 'student-1',
        status: EnrollmentStatus.ACTIVE,
        course: courseWhere,
      },
    });
    expect(prisma.skillMastery.findMany).not.toHaveBeenCalled();
  });

  it('scopes instructor path items to assigned courses once the learner is shared', async () => {
    const prisma = createPrisma();
    const courseWhere = { tenantId: 'tenant-1', instructorAssignments: { some: {} } };
    const learningAccess = {
      ...createAccess(),
      courseWhere: vi.fn().mockReturnValue(courseWhere),
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new AdaptiveLearningService(prisma as never, learningAccess as never);

    const result = await service.getNextSteps(
      'tenant-1',
      { id: 'instructor-1', role: Role.INSTRUCTOR },
      { userId: 'student-1', courseId: 'course-1', limit: 2 },
    );

    expect(learningAccess.ensureCourseAccess).toHaveBeenCalledWith('course-1', 'tenant-1', {
      id: 'instructor-1',
      role: Role.INSTRUCTOR,
    });
    expect(prisma.adaptiveLearningPathItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'student-1',
          courseId: 'course-1',
          course: courseWhere,
        }),
      }),
    );
    expect(result.courseId).toBe('course-1');
    expect(result.steps).toHaveLength(2);
  });
});
