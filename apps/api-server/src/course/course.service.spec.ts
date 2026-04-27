import { describe, expect, it, vi } from 'vitest';
import { EnrollmentStatus, ProgressStatus } from '@repo/database';
import { CourseService } from './course.service';

describe('CourseService', () => {
  it('should create a unit after validating the course tenant scope', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'HSK 1 Basics',
        }),
      },
      courseUnit: {
        create: vi.fn().mockResolvedValue({
          id: 'unit-1',
          title: 'Unit 1',
          courseId: 'course-1',
          tenantId: 'tenant-1',
        }),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };
    const service = new CourseService(prisma as never, learningAccess as never);

    await expect(
      service.createUnit('course-1', 'tenant-1', { title: 'Unit 1', order: 1 }),
    ).resolves.toEqual(expect.objectContaining({ id: 'unit-1' }));
    expect(prisma.courseUnit.create).toHaveBeenCalledWith({
      data: {
        title: 'Unit 1',
        description: undefined,
        order: 1,
        courseId: 'course-1',
        tenantId: 'tenant-1',
      },
    });
  });

  it('should soft-delete a unit and keep its lessons as ungrouped', async () => {
    const prisma = {
      courseUnit: {
        findFirst: vi.fn().mockResolvedValue({ id: 'unit-1' }),
      },
      $transaction: vi.fn(
        async (
          callback: (tx: {
            lesson: { updateMany: ReturnType<typeof vi.fn> };
            courseUnit: { update: ReturnType<typeof vi.fn> };
          }) => Promise<unknown>,
        ) => {
          return callback({
            lesson: {
              updateMany: vi.fn().mockResolvedValue({ count: 2 }),
            },
            courseUnit: {
              update: vi.fn().mockResolvedValue({
                id: 'unit-1',
                deletedAt: new Date('2026-04-27T00:00:00.000Z'),
              }),
            },
          });
        },
      ),
    };
    const service = new CourseService(prisma as never, {} as never);

    await expect(service.removeUnit('course-1', 'unit-1', 'tenant-1')).resolves.toEqual(
      expect.objectContaining({ id: 'unit-1' }),
    );
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('should aggregate enrollment progress report per learner', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'HSK 1 Basics',
          lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
          enrollments: [
            {
              id: 'enrollment-1',
              userId: 'user-1',
              status: EnrollmentStatus.ACTIVE,
              enrolledAt: new Date('2026-04-22T00:00:00.000Z'),
              user: {
                id: 'user-1',
                email: 'student1@example.com',
                fullName: 'Student One',
                isActive: true,
              },
            },
            {
              id: 'enrollment-2',
              userId: 'user-2',
              status: EnrollmentStatus.ACTIVE,
              enrolledAt: new Date('2026-04-23T00:00:00.000Z'),
              user: {
                id: 'user-2',
                email: 'student2@example.com',
                fullName: 'Student Two',
                isActive: true,
              },
            },
          ],
        }),
      },
      userLessonProgress: {
        findMany: vi.fn().mockResolvedValue([
          {
            userId: 'user-1',
            lessonId: 'lesson-1',
            status: ProgressStatus.COMPLETED,
            updatedAt: new Date('2026-04-24T10:00:00.000Z'),
          },
          {
            userId: 'user-1',
            lessonId: 'lesson-2',
            status: ProgressStatus.COMPLETED,
            updatedAt: new Date('2026-04-24T11:00:00.000Z'),
          },
        ]),
      },
      learningActivity: {
        findMany: vi.fn().mockResolvedValue([
          {
            userId: 'user-1',
            type: 'LESSON_OPENED',
            occurredAt: new Date('2026-04-24T11:00:00.000Z'),
            timeSpentSeconds: 300,
          },
          {
            userId: 'user-2',
            type: 'LESSON_OPENED',
            occurredAt: new Date('2026-04-24T09:00:00.000Z'),
            timeSpentSeconds: 120,
          },
        ]),
      },
    };

    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };

    const service = new CourseService(prisma as never, learningAccess as never);

    const result = await service.getEnrollmentReport('course-1', 'tenant-1');

    expect(result.course).toEqual({
      id: 'course-1',
      title: 'HSK 1 Basics',
    });
    expect(result.totals).toEqual(
      expect.objectContaining({
        enrolledStudents: 2,
        completedStudents: 1,
        inProgressStudents: 1,
        notStartedStudents: 0,
        totalLessons: 2,
        completedLessons: 2,
        activitySessions: 2,
        totalTimeSpentSeconds: 420,
        averageCompletionPercentage: 50,
        completionRate: 50,
      }),
    );
    expect(result.students).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        completionPercentage: 100,
        status: 'COMPLETED',
        activitySessions: 1,
      }),
      expect.objectContaining({
        userId: 'user-2',
        completionPercentage: 0,
        status: 'IN_PROGRESS',
        activitySessions: 1,
      }),
    ]);
  });
});
