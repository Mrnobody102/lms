import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningActivityType, ProgressStatus, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { buildActivityCalendar } from '../common/utils/activity-calendar.util';
import { buildAnswerAccuracy } from '../common/utils/answer-accuracy.util';
import { SrsService } from '../srs/srs.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly srs: SrsService,
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
      where: { tenantId_userId_lessonId: { tenantId, userId, lessonId } },
      select: { status: true },
    });
    const wasAlreadyCompleted = existing?.status === ProgressStatus.COMPLETED;

    const progress = await this.prisma.userLessonProgress.upsert({
      where: {
        tenantId_userId_lessonId: {
          tenantId,
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
      await this.updateUserStreak(userId, tenantId);
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

    const activity = await this.prisma.learningActivity.create({
      data: {
        userId,
        tenantId,
        courseId: lesson.courseId,
        lessonId: lesson.id,
        type,
        timeSpentSeconds,
      },
    });

    // Update User Streak
    await this.updateUserStreak(userId, tenantId);

    return activity;
  }

  private async updateUserStreak(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id_tenantId: { id: userId, tenantId } },
      select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
    });

    if (!user) return;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) {
      lastActive.setUTCHours(0, 0, 0, 0);
    }

    if (lastActive && lastActive.getTime() === today.getTime()) {
      // Already active today, no need to update streak
      return;
    }

    let newCurrentStreak = user.currentStreak;

    if (!lastActive || lastActive.getTime() === yesterday.getTime()) {
      // Active yesterday or first time, increment streak
      newCurrentStreak += 1;
    } else if (lastActive.getTime() < yesterday.getTime()) {
      // Missed a day or more, reset streak
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(user.longestStreak, newCurrentStreak);

    await this.prisma.user.update({
      where: { id_tenantId: { id: userId, tenantId } },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: new Date(),
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
    const srsDue = await this.safeGetDueSummary(tenantId, userId);

    return {
      activeCourse: activeCourse ?? null,
      courses: courseSummaries,
      activityCalendar,
      srsDue,
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

    const unitAnswers: Array<{
      isCorrect: boolean;
      unitId: string | null;
      unitTitle: string | null;
      skillTags: string[];
    }> = [];

    practiceAnswers.forEach((a) => {
      unitAnswers.push({
        isCorrect: a.isCorrect,
        unitId: a.question.unitId,
        unitTitle: a.question.unit?.title || null,
        skillTags: a.question.skillTags,
      });
    });

    examAnswers.forEach((a) => {
      unitAnswers.push({
        isCorrect: a.isCorrect,
        unitId: a.question.section.exam.unitId,
        unitTitle: a.question.section.exam.unit?.title || null,
        skillTags: a.question.skillTags,
      });
    });

    return buildAnswerAccuracy(unitAnswers);
  }

  private async safeGetDueSummary(tenantId: string, userId: string) {
    try {
      return await this.srs.getDueSummary(tenantId, userId);
    } catch {
      return { dueNow: 0, dueToday: 0, total: 0 };
    }
  }

  async getCourseMetrics(userId: string, tenantId: string, role: Role) {
    const courses = await this.prisma.course.findMany({
      where: this.learningAccess.courseWhere(tenantId, { id: userId, role }),
      select: {
        id: true,
        title: true,
        lessons: {
          where: { deletedAt: null },
          select: {
            id: true,
            progress: {
              where: { userId, tenantId },
              select: { status: true },
              take: 1,
            },
          },
        },
      },
    });

    const metrics = await Promise.all(
      courses.map(async (course) => {
        // Calculate completion
        const totalLessons = course.lessons.length;
        const completedLessons = course.lessons.filter(
          (lesson) => lesson.progress[0]?.status === ProgressStatus.COMPLETED,
        ).length;
        const completionPercentage =
          totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

        // Get time spent
        const activities = await this.prisma.learningActivity.findMany({
          where: { userId, tenantId, courseId: course.id },
          select: { timeSpentSeconds: true },
        });
        const timeSpentSeconds = activities.reduce(
          (sum, act) => sum + (act.timeSpentSeconds || 0),
          0,
        );
        const timeSpentMinutes = Math.round(timeSpentSeconds / 60);

        // Get mastery (accuracy)
        const perf = await this.getPerformanceReport(userId, tenantId, role, course.id);
        const accuracy =
          perf.accuracyByUnit.length > 0
            ? Math.round(
                perf.accuracyByUnit.reduce((sum, u) => sum + u.accuracy, 0) /
                  perf.accuracyByUnit.length,
              )
            : 0;

        return {
          courseId: course.id,
          courseName: course.title,
          completionPercentage,
          timeSpentMinutes,
          mastery: accuracy,
        };
      }),
    );

    return metrics;
  }
}
