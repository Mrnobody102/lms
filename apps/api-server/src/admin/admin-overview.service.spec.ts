import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EnrollmentStatus,
  ExamAttemptStatus,
  LearningActivityType,
  PracticeAttemptStatus,
  ProgressStatus,
} from '@repo/database';
import { AdminOverviewService } from './admin-overview.service';

describe('AdminOverviewService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should build tenant overview from real aggregates', async () => {
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    const prisma = {
      user: {
        count: vi.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(4).mockResolvedValueOnce(2),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'student1@example.com',
            fullName: 'Student One',
            isActive: true,
            createdAt: new Date('2026-04-26T09:00:00.000Z'),
            enrollments: [{ course: { title: 'HSK 1' } }],
          },
        ]),
      },
      course: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn().mockResolvedValue([
          { id: 'course-1', lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }] },
          { id: 'course-2', lessons: [{ id: 'lesson-3' }] },
        ]),
      },
      courseEnrollment: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([
          { userId: 'user-1', courseId: 'course-1' },
          { userId: 'user-2', courseId: 'course-2' },
        ]),
      },
      learningActivity: {
        count: vi.fn().mockResolvedValue(18),
        findMany: vi.fn().mockResolvedValue([
          {
            type: LearningActivityType.LESSON_OPENED,
            occurredAt: today,
            timeSpentSeconds: 300,
          },
          {
            type: LearningActivityType.LESSON_COMPLETED,
            occurredAt: today,
            timeSpentSeconds: null,
          },
        ]),
      },
      practiceAttempt: {
        aggregate: vi.fn().mockResolvedValue({
          _count: { id: 2 },
          _sum: { score: 8, totalPoints: 10 },
        }),
      },
      examAttempt: {
        aggregate: vi.fn().mockResolvedValue({
          _count: { id: 1 },
          _sum: { score: 7, totalPoints: 10 },
        }),
      },
      userLessonProgress: {
        findMany: vi.fn().mockResolvedValue([
          {
            userId: 'user-1',
            lesson: {
              courseId: 'course-1',
            },
            status: ProgressStatus.COMPLETED,
          },
          {
            userId: 'user-1',
            lesson: {
              courseId: 'course-1',
            },
            status: ProgressStatus.COMPLETED,
          },
        ]),
      },
    };

    const service = new AdminOverviewService(prisma as never);

    const result = await service.getOverview({ tenantId: 'tenant-1' });

    expect(result.totals).toEqual({
      totalStudents: 12,
      newStudents7d: 4,
      inactiveStudents: 2,
      activeCourses: 3,
      activeEnrollments: 2,
      trackedSessions: 18,
      completionRate: 50,
    });
    expect(result.recentRegistrations).toEqual([
      expect.objectContaining({
        id: 'user-1',
        latestCourseTitle: 'HSK 1',
      }),
    ]);
    expect(result.reporting.practiceAccuracy).toEqual({
      attempts: 2,
      score: 8,
      totalPoints: 10,
      accuracy: 80,
    });
    expect(result.reporting.examAccuracy).toEqual({
      attempts: 1,
      score: 7,
      totalPoints: 10,
      accuracy: 70,
    });
    expect(result.reporting.activityCalendar).toHaveLength(7);
    expect(result.reporting.activityCalendar[result.reporting.activityCalendar.length - 1]).toEqual(
      expect.objectContaining({
        sessions: 1,
        completedLessons: 1,
        timeSpentSeconds: 300,
      }),
    );
    expect(prisma.courseEnrollment.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        status: EnrollmentStatus.ACTIVE,
      },
    });
    expect(prisma.practiceAttempt.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: PracticeAttemptStatus.SUBMITTED }),
      }),
    );
    expect(prisma.examAttempt.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: ExamAttemptStatus.SUBMITTED }),
      }),
    );
  });
});
