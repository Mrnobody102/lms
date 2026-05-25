import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { EnrollmentStatus, ProgressStatus, Role } from '@repo/database';
import { AuditAction, AuditStatus } from '../common/services/audit-log.service';
import { CourseService } from './course.service';

function createAuditLogStub() {
  return { log: vi.fn().mockResolvedValue(undefined) };
}

describe('CourseService', () => {
  it('should create a unit after validating the course tenant scope', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'IELTS Foundations',
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
    const service = new CourseService(
      prisma as never,
      learningAccess as never,
      createAuditLogStub() as never,
    );

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
    const service = new CourseService(prisma as never, {} as never, createAuditLogStub() as never);

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
          title: 'IELTS Foundations',
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

    const service = new CourseService(
      prisma as never,
      learningAccess as never,
      createAuditLogStub() as never,
    );

    const result = await service.getEnrollmentReport('course-1', 'tenant-1');

    expect(result.course).toEqual({
      id: 'course-1',
      title: 'IELTS Foundations',
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

  it('should bulk enroll active students in one transaction', async () => {
    const upsertEnrollment = vi.fn(
      (args: {
        where: { tenantId_userId_courseId: { tenantId: string; userId: string; courseId: string } };
      }) =>
        Promise.resolve({
          id: `enrollment-${args.where.tenantId_userId_courseId.userId}`,
          userId: args.where.tenantId_userId_courseId.userId,
        }),
    );
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'IELTS Foundations',
        }),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]),
      },
      $transaction: vi.fn(
        async (
          callback: (tx: {
            courseEnrollment: { upsert: typeof upsertEnrollment };
          }) => Promise<unknown>,
        ) => callback({ courseEnrollment: { upsert: upsertEnrollment } }),
      ),
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };
    const auditLog = createAuditLogStub();
    const service = new CourseService(prisma as never, learningAccess as never, auditLog as never);

    const result = await service.bulkEnrollStudents(
      'course-1',
      'tenant-1',
      ['user-1', 'user-2', 'user-1'],
      { actorId: 'admin-1', ipAddress: '10.0.0.1', userAgent: 'jest-ua' },
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['user-1', 'user-2'] },
        tenantId: 'tenant-1',
        role: Role.STUDENT,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });
    expect(upsertEnrollment).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      courseId: 'course-1',
      requestedCount: 3,
      uniqueCount: 2,
      processedCount: 2,
      skippedCount: 0,
      duplicateCount: 1,
      processedUserIds: ['user-1', 'user-2'],
      skippedUserIds: [],
    });
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        tenantId: 'tenant-1',
        action: AuditAction.ENROLLMENT_BULK_ENROLL,
        status: AuditStatus.SUCCESS,
        ipAddress: '10.0.0.1',
        userAgent: 'jest-ua',
        metadata: expect.objectContaining({
          courseId: 'course-1',
          requestedCount: 3,
          processedCount: 2,
          duplicateCount: 1,
        }),
      }),
    );
  });

  it('should reject bulk enroll batches above the service limit', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn(),
      },
    };
    const service = new CourseService(prisma as never, {} as never, createAuditLogStub() as never);
    const userIds = Array.from({ length: 101 }, (_, index) => `user-${index + 1}`);

    await expect(
      service.bulkEnrollStudents('course-1', 'tenant-1', userIds),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.course.findFirst).not.toHaveBeenCalled();
  });

  it('should bulk unenroll only active enrollments and report skipped students', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'IELTS Foundations',
        }),
      },
      courseEnrollment: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'enrollment-1',
            userId: 'user-1',
          },
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };
    const auditLog = createAuditLogStub();
    const service = new CourseService(prisma as never, learningAccess as never, auditLog as never);

    const result = await service.bulkUnenrollStudents(
      'course-1',
      'tenant-1',
      ['user-1', 'user-2', 'user-1'],
      { actorId: 'admin-1', ipAddress: '10.0.0.1', userAgent: 'jest-ua' },
    );

    expect(prisma.courseEnrollment.findMany).toHaveBeenCalledWith({
      where: {
        courseId: 'course-1',
        userId: { in: ['user-1', 'user-2'] },
        tenantId: 'tenant-1',
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        id: true,
        userId: true,
      },
    });
    expect(prisma.courseEnrollment.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['enrollment-1'] },
        tenantId: 'tenant-1',
      },
      data: {
        status: EnrollmentStatus.REVOKED,
        unenrolledAt: expect.any(Date) as Date,
      },
    });
    expect(result).toEqual({
      courseId: 'course-1',
      requestedCount: 3,
      uniqueCount: 2,
      processedCount: 1,
      skippedCount: 1,
      duplicateCount: 1,
      processedUserIds: ['user-1'],
      skippedUserIds: ['user-2'],
    });
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        tenantId: 'tenant-1',
        action: AuditAction.ENROLLMENT_BULK_UNENROLL,
        status: AuditStatus.SUCCESS,
        ipAddress: '10.0.0.1',
        userAgent: 'jest-ua',
        metadata: expect.objectContaining({
          courseId: 'course-1',
          requestedCount: 3,
          processedCount: 1,
          skippedCount: 1,
          duplicateCount: 1,
          processedUserIds: ['user-1'],
          skippedUserIds: ['user-2'],
        }),
      }),
    );
  });

  it('should reject bulk unenroll batches above the service limit', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn(),
      },
    };
    const service = new CourseService(prisma as never, {} as never, createAuditLogStub() as never);
    const userIds = Array.from({ length: 101 }, (_, index) => `user-${index + 1}`);

    await expect(
      service.bulkUnenrollStudents('course-1', 'tenant-1', userIds),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.course.findFirst).not.toHaveBeenCalled();
  });

  it('should reorder units using bulk transactions', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      courseUnit: {
        findMany: vi.fn().mockResolvedValue([{ id: 'unit-1' }, { id: 'unit-2' }]),
        update: vi.fn().mockResolvedValue({ id: 'unit-1', order: 0 }),
      },
      $transaction: vi.fn(async (arg: unknown) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        if (typeof arg === 'function') {
          return (arg as (client: typeof prisma) => unknown)(prisma);
        }
        return arg;
      }),
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };
    const service = new CourseService(
      prisma as never,
      learningAccess as never,
      createAuditLogStub() as never,
    );

    await expect(
      service.reorderUnits('course-1', 'tenant-1', ['unit-2', 'unit-1']),
    ).resolves.toBeDefined();

    expect(prisma.courseUnit.update).toHaveBeenCalledTimes(2);
  });
});
