import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningActivityType, ProgressStatus, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { buildActivityCalendar } from '../common/utils/activity-calendar.util';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  /**
   * Update or create a progress record for a user and lesson.
   * Ensures the lesson belongs to the user's tenant.
   *
   * Idempotent: only creates a LESSON_COMPLETED activity the first time a lesson
   * transitions to COMPLETED. Subsequent calls with COMPLETED status are no-ops
   * for the activity log, preventing duplicate records when auto-completion
   * (e.g. video 85% threshold) races with the manual "Mark Complete" button.
   */
  async updateProgress(
    userId: string,
    lessonId: string,
    status: ProgressStatus,
    tenantId: string,
    role: Role,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: this.learningAccess.lessonWhere(tenantId, { id: userId, role }, lessonId),
    });
    if (!lesson) throw new NotFoundException(`Lesson not found in this tenant`);

    // Check existing status before upsert so we can detect a real COMPLETED transition.
    const existing = await this.prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { status: true },
    });
    const wasAlreadyCompleted = existing?.status === ProgressStatus.COMPLETED;

    const progress = await this.prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        lessonId,
        tenantId,
        status,
      },
    });

    // Only log the completion activity when the lesson wasn't already completed.
    if (status === ProgressStatus.COMPLETED && !wasAlreadyCompleted) {
      await this.prisma.learningActivity.create({
        data: {
          userId,
          tenantId,
          courseId: lesson.courseId,
          lessonId,
          type: LearningActivityType.LESSON_COMPLETED,
        },
      });
    }

    return progress;
  }

  async recordActivity(
    userId: string,
    lessonId: string,
    type: LearningActivityType,
    tenantId: string,
    role: Role,
    timeSpentSeconds?: number,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: this.learningAccess.lessonWhere(tenantId, { id: userId, role }, lessonId),
      select: {
        id: true,
        courseId: true,
      },
    });
    if (!lesson) throw new NotFoundException(`Lesson not found in this tenant`);

    return this.prisma.learningActivity.create({
      data: {
        userId,
        tenantId,
        courseId: lesson.courseId,
        lessonId: lesson.id,
        type,
        timeSpentSeconds,
      },
    });
  }

  /**
   * Get all progress records for a user within a specific course.
   */
  async getProgress(userId: string, courseId: string, tenantId: string, role: Role) {
    await this.learningAccess.ensureCourseAccess(courseId, tenantId, { id: userId, role });

    return this.prisma.userLessonProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
          tenantId,
          deletedAt: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Get a single progress record for a user and lesson.
   */
  async getLessonProgress(userId: string, lessonId: string, tenantId: string, role: Role) {
    const progress = await this.prisma.userLessonProgress.findFirst({
      where: {
        userId,
        lessonId,
        lesson: this.learningAccess.lessonWhere(tenantId, { id: userId, role }, lessonId),
      },
    });

    if (!progress) {
      throw new NotFoundException(`Progress not found for lesson ${lessonId} and user ${userId}`);
    }

    return progress;
  }

  async getSummary(userId: string, tenantId: string, role: Role) {
    const courses = await this.prisma.course.findMany({
      where: this.learningAccess.courseWhere(tenantId, { id: userId, role }),
      select: {
        id: true,
        title: true,
        totalDuration: true,
        createdAt: true,
        lessons: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            courseId: true,
            order: true,
            duration: true,
            progress: {
              where: { userId, tenantId },
              select: {
                status: true,
                updatedAt: true,
              },
              orderBy: { updatedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const courseIds = courses.map((course) => course.id);
    const activities =
      courseIds.length === 0
        ? []
        : await this.prisma.learningActivity.findMany({
            where: {
              userId,
              tenantId,
              courseId: { in: courseIds },
            },
            select: {
              courseId: true,
              lessonId: true,
              type: true,
              occurredAt: true,
              timeSpentSeconds: true,
            },
            orderBy: { occurredAt: 'desc' },
          });

    const courseSummaries = courses.map((course) => {
      const courseActivities = activities.filter((activity) => activity.courseId === course.id);
      const activitySessions = courseActivities.filter(
        (activity) => activity.type === LearningActivityType.LESSON_OPENED,
      ).length;
      const completedLessons = course.lessons.filter(
        (lesson) => lesson.progress[0]?.status === ProgressStatus.COMPLETED,
      ).length;
      const totalLessons = course.lessons.length;
      const completionPercentage =
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
      const latestActivity = courseActivities[0];
      const lastAccessedLesson = latestActivity
        ? (course.lessons.find((lesson) => lesson.id === latestActivity.lessonId) ?? null)
        : null;

      const continueLesson =
        course.lessons.find((lesson) => lesson.progress[0]?.status !== ProgressStatus.COMPLETED) ??
        null;

      return {
        course: {
          id: course.id,
          title: course.title,
          totalDuration: course.totalDuration,
        },
        totalLessons,
        completedLessons,
        activitySessions,
        completionPercentage,
        lastActivityAt: latestActivity?.occurredAt ?? null,
        lastAccessedLesson: lastAccessedLesson
          ? {
              id: lastAccessedLesson.id,
              title: lastAccessedLesson.title,
              courseId: lastAccessedLesson.courseId,
              duration: lastAccessedLesson.duration,
            }
          : null,
        continueLesson: continueLesson
          ? {
              id: continueLesson.id,
              title: continueLesson.title,
              courseId: continueLesson.courseId,
              duration: continueLesson.duration,
            }
          : null,
      };
    });

    const activeCourse = courseSummaries
      .filter((course) => course.continueLesson)
      .sort((a, b) => {
        const aTime = a.lastActivityAt?.getTime() ?? 0;
        const bTime = b.lastActivityAt?.getTime() ?? 0;
        return bTime - aTime;
      })[0];

    const totalLessons = courseSummaries.reduce((sum, course) => sum + course.totalLessons, 0);
    const completedLessons = courseSummaries.reduce(
      (sum, course) => sum + course.completedLessons,
      0,
    );
    const activitySessions = courseSummaries.reduce(
      (sum, course) => sum + course.activitySessions,
      0,
    );
    const currentStreak = this.calculateCurrentStreak(
      activities.map((activity) => activity.occurredAt),
    );
    const activityCalendar = buildActivityCalendar(activities, 14);

    return {
      activeCourse: activeCourse ?? null,
      courses: courseSummaries,
      activityCalendar,
      totals: {
        courses: courseSummaries.length,
        lessons: totalLessons,
        completedLessons,
        activitySessions,
        currentStreak,
        completionPercentage:
          totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      },
    };
  }

  private calculateCurrentStreak(activityDates: Date[]) {
    const distinctDays = new Set(activityDates.map((date) => date.toISOString().slice(0, 10)));
    if (distinctDays.size === 0) {
      return 0;
    }

    let streak = 0;
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);

    while (distinctDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streak;
  }

  async getPerformanceReport(userId: string, tenantId: string, role: Role, courseId?: string) {
    if (courseId) {
      await this.learningAccess.ensureCourseAccess(courseId, tenantId, { id: userId, role });
    }

    const practiceAnswers = await this.prisma.practiceAnswer.findMany({
      where: {
        tenantId,
        attempt: {
          userId,
          courseId,
          status: 'SUBMITTED',
        },
      },
      include: {
        question: {
          select: {
            unitId: true,
            skillTags: true,
            unit: { select: { title: true } },
          },
        },
      },
    });

    const examAnswers = await this.prisma.examAnswer.findMany({
      where: {
        tenantId,
        attempt: {
          userId,
          courseId,
          status: 'SUBMITTED',
        },
      },
      include: {
        question: {
          select: {
            skillTags: true,
            section: {
              include: {
                exam: {
                  select: {
                    unitId: true,
                    unit: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const unitStats: Record<string, { title: string; correct: number; total: number }> = {};
    const skillStats: Record<string, { correct: number; total: number }> = {};

    const process = (
      isCorrect: boolean,
      unitId: string | null,
      unitTitle: string | null,
      skillTags: string[],
    ) => {
      if (unitId) {
        if (!unitStats[unitId]) {
          unitStats[unitId] = { title: unitTitle || 'Unknown Unit', correct: 0, total: 0 };
        }
        unitStats[unitId].total += 1;
        if (isCorrect) unitStats[unitId].correct += 1;
      }

      skillTags.forEach((tag) => {
        if (!skillStats[tag]) {
          skillStats[tag] = { correct: 0, total: 0 };
        }
        skillStats[tag].total += 1;
        if (isCorrect) skillStats[tag].correct += 1;
      });
    };

    practiceAnswers.forEach((a) => {
      process(a.isCorrect, a.question.unitId, a.question.unit?.title || null, a.question.skillTags);
    });

    examAnswers.forEach((a) => {
      process(
        a.isCorrect,
        a.question.section.exam.unitId,
        a.question.section.exam.unit?.title || null,
        a.question.skillTags,
      );
    });

    return {
      accuracyByUnit: Object.entries(unitStats).map(([id, stats]) => ({
        id,
        title: stats.title,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        totalQuestions: stats.total,
      })),
      accuracyBySkill: Object.entries(skillStats).map(([skill, stats]) => ({
        skill,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        totalQuestions: stats.total,
      })),
    };
  }
}
