import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressStatus, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  /**
   * Update or create a progress record for a user and lesson.
   * Ensures the lesson belongs to the user's tenant.
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

    return this.prisma.userLessonProgress.upsert({
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

    const courseSummaries = courses.map((course) => {
      const completedLessons = course.lessons.filter(
        (lesson) => lesson.progress[0]?.status === ProgressStatus.COMPLETED,
      ).length;
      const totalLessons = course.lessons.length;
      const completionPercentage =
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
      let lastActivityAt: Date | null = null;

      for (const lesson of course.lessons) {
        const updatedAt = lesson.progress[0]?.updatedAt;
        if (updatedAt && (!lastActivityAt || updatedAt > lastActivityAt)) {
          lastActivityAt = updatedAt;
        }
      }

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
        completionPercentage,
        lastActivityAt,
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

    return {
      activeCourse: activeCourse ?? null,
      courses: courseSummaries,
      totals: {
        courses: courseSummaries.length,
        lessons: totalLessons,
        completedLessons,
        completionPercentage:
          totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      },
    };
  }
}
