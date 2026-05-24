import { describe, expect, it, vi } from 'vitest';
import { CohortComparisonService } from './cohort-comparison.service';

function buildPrismaMock() {
  return {
    cohort: {
      findMany: vi.fn().mockResolvedValue([{ id: 'cohort-1', name: 'Morning Cohort' }]),
    },
    course: {
      findFirst: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn().mockResolvedValue([
        { userId: 'user-1', courseId: 'course-1' },
        { userId: 'user-2', courseId: 'course-2' },
      ]),
    },
    lesson: {
      groupBy: vi.fn().mockResolvedValue([
        { courseId: 'course-1', _count: { id: 1 } },
        { courseId: 'course-2', _count: { id: 1 } },
      ]),
    },
    userLessonProgress: {
      findMany: vi.fn().mockResolvedValue([{ userId: 'user-1', lesson: { courseId: 'course-1' } }]),
    },
    learningActivity: {
      count: vi.fn().mockResolvedValue(0),
    },
    practiceAttempt: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { score: null, totalPoints: null } }),
    },
    examAttempt: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { score: null, totalPoints: null } }),
    },
    skillMastery: {
      aggregate: vi.fn().mockResolvedValue({ _avg: { mastery: null } }),
    },
    reviewCard: {
      count: vi.fn().mockResolvedValue(0),
    },
  };
}

describe('CohortComparisonService', () => {
  it('computes completion against the learner course enrollments, not every selected course', async () => {
    const prisma = buildPrismaMock();
    const service = new CohortComparisonService(prisma as never);

    const result = await service.getComparison('tenant-1', { cohortIds: ['cohort-1'] });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      cohortId: 'cohort-1',
      learnerCount: 2,
      completionRate: 50,
    });
    expect(prisma.userLessonProgress.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    );
  });
});
