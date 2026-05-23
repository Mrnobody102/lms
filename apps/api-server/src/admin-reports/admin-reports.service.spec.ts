import { describe, expect, it, vi } from 'vitest';
import { LearningActivityType } from '@repo/database';
import { AdminReportsService } from './admin-reports.service';

function buildPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    program: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
    },
    level: {
      findFirst: vi.fn(),
    },
    course: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
    },
    cohort: {
      findFirst: vi.fn().mockResolvedValue({ id: 'cohort-1' }),
    },
    courseUnit: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    courseEnrollment: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    lesson: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    userLessonProgress: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    practiceAttempt: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    examAttempt: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    practiceAnswer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    examAnswer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    learningActivity: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    ...overrides,
  };
}

describe('AdminReportsService', () => {
  describe('getProgramsRollup', () => {
    it('aggregates per-program metrics and surfaces unassigned bucket', async () => {
      const prisma = buildPrismaMock();
      prisma.program.findMany = vi.fn().mockResolvedValue([
        {
          id: 'prog-1',
          title: 'HSK',
          _count: { levels: 2 },
          levels: [
            {
              id: 'lvl-1',
              courses: [{ id: 'course-1' }, { id: 'course-2' }],
            },
            {
              id: 'lvl-2',
              courses: [],
            },
          ],
        },
      ]);
      prisma.course.findMany = vi.fn().mockResolvedValue([{ id: 'course-orphan' }]);
      prisma.practiceAttempt.groupBy = vi.fn().mockResolvedValue([
        { courseId: 'course-1', _sum: { score: 8, totalPoints: 10 }, _count: { id: 2 } },
        { courseId: 'course-2', _sum: { score: 2, totalPoints: 10 }, _count: { id: 1 } },
      ]);
      prisma.examAttempt.groupBy = vi
        .fn()
        .mockResolvedValue([
          { courseId: 'course-1', _sum: { score: 6, totalPoints: 10 }, _count: { id: 1 } },
        ]);
      prisma.courseEnrollment.groupBy = vi.fn().mockResolvedValue([
        { courseId: 'course-1', _count: { id: 5 } },
        { courseId: 'course-orphan', _count: { id: 1 } },
      ]);
      prisma.lesson.groupBy = vi.fn().mockResolvedValue([
        { courseId: 'course-1', _count: { id: 4 } },
        { courseId: 'course-orphan', _count: { id: 2 } },
      ]);
      prisma.userLessonProgress.findMany = vi.fn().mockResolvedValue([
        { userId: 'u1', lesson: { courseId: 'course-1' } },
        { userId: 'u1', lesson: { courseId: 'course-1' } },
      ]);

      const service = new AdminReportsService(prisma as never);
      const result = await service.getProgramsRollup('tenant-1');

      expect(result.programs).toHaveLength(1);
      expect(result.programs[0]).toMatchObject({
        id: 'prog-1',
        title: 'HSK',
        levelCount: 2,
        courseCount: 2,
        enrollmentCount: 5,
        lessonCount: 4,
        practiceAccuracy: 50,
        examAccuracy: 60,
      });
      expect(result.unassigned).toMatchObject({
        title: 'Unassigned',
        courseCount: 1,
        enrollmentCount: 1,
      });
      expect(prisma.program.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1', deletedAt: null }),
        }),
      );
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1', levelId: null }),
        }),
      );
    });

    it('applies cohort membership filters to rollup metrics', async () => {
      const prisma = buildPrismaMock();
      prisma.program.findMany = vi.fn().mockResolvedValue([
        {
          id: 'prog-1',
          title: 'HSK',
          _count: { levels: 1 },
          levels: [{ id: 'lvl-1', courses: [{ id: 'course-1' }] }],
        },
      ]);

      const service = new AdminReportsService(prisma as never);
      await service.getProgramsRollup('tenant-1', { cohortId: 'cohort-1' });

      expect(prisma.cohort.findFirst).toHaveBeenCalledWith({
        where: { id: 'cohort-1', tenantId: 'tenant-1' },
        select: { id: true },
      });
      expect(prisma.courseEnrollment.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: {
              cohortMemberships: {
                some: { tenantId: 'tenant-1', cohortId: 'cohort-1' },
              },
            },
          }),
        }),
      );
      expect(prisma.practiceAttempt.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: {
              cohortMemberships: {
                some: { tenantId: 'tenant-1', cohortId: 'cohort-1' },
              },
            },
          }),
        }),
      );
    });
  });

  describe('getLevelDetail', () => {
    it('returns 404 when level missing', async () => {
      const prisma = buildPrismaMock();
      prisma.level.findFirst = vi.fn().mockResolvedValue(null);
      const service = new AdminReportsService(prisma as never);
      await expect(service.getLevelDetail('tenant-1', 'lvl-x')).rejects.toThrow();
    });

    it('rolls up per-course metrics and asserts tenant scoping', async () => {
      const prisma = buildPrismaMock();
      prisma.level.findFirst = vi.fn().mockResolvedValue({
        id: 'lvl-1',
        title: 'HSK 1',
        order: 1,
        program: { id: 'prog-1', title: 'HSK' },
        courses: [
          { id: 'course-1', title: 'Course A' },
          { id: 'course-2', title: 'Course B' },
        ],
      });
      prisma.practiceAttempt.groupBy = vi
        .fn()
        .mockResolvedValue([
          { courseId: 'course-1', _sum: { score: 5, totalPoints: 10 }, _count: { id: 1 } },
        ]);
      prisma.courseEnrollment.groupBy = vi
        .fn()
        .mockResolvedValue([{ courseId: 'course-1', _count: { id: 3 } }]);
      prisma.lesson.groupBy = vi
        .fn()
        .mockResolvedValue([{ courseId: 'course-1', _count: { id: 2 } }]);
      prisma.userLessonProgress.findMany = vi.fn().mockResolvedValue([]);

      const service = new AdminReportsService(prisma as never);
      const result = await service.getLevelDetail('tenant-1', 'lvl-1');

      expect(result.level.id).toBe('lvl-1');
      expect(result.courses).toHaveLength(2);
      expect(result.courses[0]).toMatchObject({
        courseId: 'course-1',
        enrollmentCount: 3,
        lessonCount: 2,
        practiceAccuracy: 50,
      });
      expect(prisma.level.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'lvl-1',
            tenantId: 'tenant-1',
            program: expect.objectContaining({ tenantId: 'tenant-1' }),
          }),
        }),
      );
    });
  });

  describe('getCourseStudents', () => {
    it('combines progress, activity, practice and exam aggregates', async () => {
      const prisma = buildPrismaMock();
      prisma.course.findFirst = vi.fn().mockResolvedValue({
        id: 'course-1',
        title: 'Course A',
        lessons: [{ id: 'l1' }, { id: 'l2' }],
        enrollments: [
          {
            id: 'e1',
            userId: 'u1',
            enrolledAt: new Date('2026-04-01'),
            user: { id: 'u1', email: 'a@b.com', fullName: 'Alice', isActive: true },
          },
        ],
      });
      prisma.userLessonProgress.findMany = vi.fn().mockResolvedValue([{ userId: 'u1' }]);
      prisma.learningActivity.findMany = vi
        .fn()
        .mockResolvedValue([{ userId: 'u1', occurredAt: new Date('2026-05-10') }]);
      prisma.practiceAttempt.groupBy = vi
        .fn()
        .mockResolvedValue([
          { userId: 'u1', _sum: { score: 7, totalPoints: 10 }, _count: { id: 2 } },
        ]);
      prisma.examAttempt.groupBy = vi
        .fn()
        .mockResolvedValue([
          { userId: 'u1', _sum: { score: 4, totalPoints: 5 }, _count: { id: 1 } },
        ]);

      const service = new AdminReportsService(prisma as never);
      const result = await service.getCourseStudents('tenant-1', 'course-1');

      expect(result.students).toHaveLength(1);
      expect(result.students[0]).toMatchObject({
        userId: 'u1',
        completedLessons: 1,
        totalLessons: 2,
        completionPercentage: 50,
        practiceAccuracy: 70,
        examAccuracy: 80,
        practiceAttempts: 2,
      });
      expect(result.students[0].lastActivityAt).toEqual(new Date('2026-05-10'));
    });
  });

  describe('getSkillsAccuracy', () => {
    it('buckets by skill across practice + exam answers', async () => {
      const prisma = buildPrismaMock();
      prisma.practiceAnswer.findMany = vi.fn().mockResolvedValue([
        {
          isCorrect: true,
          question: { unitId: 'u1', skillTags: ['vocab'], unit: { title: 'Unit 1' } },
        },
        {
          isCorrect: false,
          question: { unitId: 'u1', skillTags: ['vocab', 'reading'], unit: { title: 'Unit 1' } },
        },
      ]);
      prisma.examAnswer.findMany = vi.fn().mockResolvedValue([
        {
          isCorrect: true,
          question: {
            skillTags: ['reading'],
            section: { exam: { unitId: 'u2', unit: { title: 'Unit 2' } } },
          },
        },
      ]);

      const service = new AdminReportsService(prisma as never);
      const result = await service.getSkillsAccuracy('tenant-1');

      const vocab = result.accuracyBySkill.find((s) => s.skill === 'vocab');
      const reading = result.accuracyBySkill.find((s) => s.skill === 'reading');
      expect(vocab).toMatchObject({ accuracy: 50, totalQuestions: 2 });
      expect(reading).toMatchObject({ accuracy: 50, totalQuestions: 2 });
      expect(result.accuracyByUnit).toHaveLength(2);
    });

    it('rejects cohort filters outside the tenant before querying answers', async () => {
      const prisma = buildPrismaMock();
      prisma.cohort.findFirst = vi.fn().mockResolvedValue(null);

      const service = new AdminReportsService(prisma as never);
      await expect(service.getSkillsAccuracy('tenant-1', { cohortId: 'cohort-x' })).rejects.toThrow(
        'Cohort not found in this tenant',
      );
      expect(prisma.practiceAnswer.findMany).not.toHaveBeenCalled();
      expect(prisma.examAnswer.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getActivityTrend', () => {
    it('returns the requested trend window and filters by cohort membership', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-23T12:00:00Z'));

      try {
        const prisma = buildPrismaMock();
        prisma.learningActivity.findMany = vi.fn().mockResolvedValue([
          {
            occurredAt: new Date('2026-05-22T08:00:00Z'),
            type: LearningActivityType.LESSON_OPENED,
          },
          {
            occurredAt: new Date('2026-05-23T09:00:00Z'),
            type: LearningActivityType.LESSON_COMPLETED,
          },
        ]);

        const service = new AdminReportsService(prisma as never);
        const result = await service.getActivityTrend('tenant-1', {
          cohortId: 'cohort-1',
          days: 3,
        });

        expect(result.trend).toEqual([
          { date: '2026-05-21', opened: 0, completed: 0 },
          { date: '2026-05-22', opened: 1, completed: 0 },
          { date: '2026-05-23', opened: 0, completed: 1 },
        ]);
        expect(prisma.learningActivity.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              occurredAt: { gte: new Date('2026-05-21T00:00:00Z') },
              user: {
                cohortMemberships: {
                  some: { tenantId: 'tenant-1', cohortId: 'cohort-1' },
                },
              },
            }),
          }),
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('getCourseUnits', () => {
    it('returns units with lesson count and accuracy', async () => {
      const prisma = buildPrismaMock();
      prisma.course.findFirst = vi.fn().mockResolvedValue({ id: 'c1', title: 'Course' });
      prisma.courseUnit.findMany = vi.fn().mockResolvedValue([
        { id: 'u1', title: 'Unit 1', order: 0, _count: { lessons: 3 } },
        { id: 'u2', title: 'Unit 2', order: 1, _count: { lessons: 2 } },
      ]);
      prisma.practiceAnswer.findMany = vi.fn().mockResolvedValue([
        {
          isCorrect: true,
          question: { unitId: 'u1', skillTags: [], unit: { title: 'Unit 1' } },
        },
      ]);

      const service = new AdminReportsService(prisma as never);
      const result = await service.getCourseUnits('tenant-1', 'c1');

      expect(result.units).toHaveLength(2);
      expect(result.units[0]).toMatchObject({
        id: 'u1',
        lessonCount: 3,
        accuracy: 100,
        totalQuestions: 1,
      });
      expect(result.units[1]).toMatchObject({ id: 'u2', accuracy: 0, totalQuestions: 0 });
    });
  });
});
