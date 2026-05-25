import { describe, expect, it, vi } from 'vitest';
import { RiskFlagType, RiskSeverity } from '@repo/database';
import { RiskFlagService } from './risk-flag.service';

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function buildPrismaMock() {
  return {
    cohort: {
      findFirst: vi.fn(),
    },
    course: {
      findFirst: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn().mockResolvedValue([
        {
          userId: 'user-1',
          courseId: 'course-1',
          enrolledAt: daysAgo(30),
          user: {
            fullName: 'Alice',
            email: 'alice@example.com',
            cohortMemberships: [{ cohortId: 'cohort-1' }],
          },
          course: { title: 'IELTS Foundations' },
        },
      ]),
    },
    lesson: {
      groupBy: vi.fn().mockResolvedValue([{ courseId: 'course-1', _count: { id: 1 } }]),
    },
    userLessonProgress: {
      findMany: vi.fn().mockResolvedValue([{ userId: 'user-1', lesson: { courseId: 'course-1' } }]),
    },
    learningActivity: {
      findMany: vi
        .fn()
        .mockResolvedValue([{ userId: 'user-1', courseId: 'course-1', occurredAt: daysAgo(1) }]),
    },
    practiceAttempt: {
      groupBy: vi.fn().mockResolvedValue([
        {
          userId: 'user-1',
          courseId: 'course-1',
          _sum: { score: 140, totalPoints: 200 },
        },
      ]),
      findMany: vi.fn().mockResolvedValue([
        {
          userId: 'user-1',
          courseId: 'course-1',
          score: 90,
          totalPoints: 100,
          createdAt: daysAgo(20),
        },
        {
          userId: 'user-1',
          courseId: 'course-1',
          score: 50,
          totalPoints: 100,
          createdAt: daysAgo(3),
        },
      ]),
    },
    examAttempt: {
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([]),
    },
    reportingRiskRule: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    reviewCard: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    studentRiskSnapshot: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        studentRiskSnapshot: {
          createMany: vi.fn(),
          deleteMany: vi.fn(),
        },
      }),
    ),
  };
}

describe('RiskFlagService', () => {
  it('computes declining score risk with tenant-scoped report queries', async () => {
    const prisma = buildPrismaMock();
    const service = new RiskFlagService(prisma as never);

    const result = await service.listRiskFlags('tenant-1', {});

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      userId: 'user-1',
      courseId: 'course-1',
      flags: [RiskFlagType.DECLINING_SCORE],
      severity: RiskSeverity.LOW,
    });
    expect(result.data[0].reasons[0]).toMatchObject({
      flag: RiskFlagType.DECLINING_SCORE,
      value: 40,
      threshold: 15,
    });
    expect(prisma.courseEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1', courseId: undefined }),
      }),
    );
    expect(prisma.practiceAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    );
  });

  it('honors disabled tenant risk rules', async () => {
    const prisma = buildPrismaMock();
    prisma.reportingRiskRule.findMany = vi.fn().mockResolvedValue([
      {
        type: RiskFlagType.DECLINING_SCORE,
        severity: RiskSeverity.HIGH,
        config: { drop: 1 },
        isEnabled: false,
      },
    ]);
    const service = new RiskFlagService(prisma as never);

    const result = await service.listRiskFlags('tenant-1', {});

    expect(result.data).toEqual([]);
  });
});
