import { Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, ProgressStatus, Role } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

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
      where: this.lessonAccessWhere(lessonId, tenantId, userId, role),
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
    await this.ensureCourseAccess(courseId, tenantId, userId, role);

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
        lesson: this.lessonAccessWhere(lessonId, tenantId, userId, role),
      },
    });

    if (!progress) {
      throw new NotFoundException(`Progress not found for lesson ${lessonId} and user ${userId}`);
    }

    return progress;
  }

  private async ensureCourseAccess(courseId: string, tenantId: string, userId: string, role: Role) {
    const course = await this.prisma.course.findFirst({
      where: this.courseAccessWhere(courseId, tenantId, userId, role),
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }
  }

  private courseAccessWhere(
    courseId: string,
    tenantId: string,
    userId: string,
    role: Role,
  ): Prisma.CourseWhereInput {
    const where: Prisma.CourseWhereInput = {
      id: courseId,
      tenantId,
      deletedAt: null,
      isActive: true,
    };

    if (role === Role.STUDENT) {
      where.enrollments = {
        some: {
          userId,
          tenantId,
          status: EnrollmentStatus.ACTIVE,
        },
      };
    }

    return where;
  }

  private lessonAccessWhere(
    lessonId: string,
    tenantId: string,
    userId: string,
    role: Role,
  ): Prisma.LessonWhereInput {
    const where: Prisma.LessonWhereInput = {
      id: lessonId,
      tenantId,
      deletedAt: null,
      course: {
        deletedAt: null,
        isActive: true,
      },
    };

    if (role === Role.STUDENT) {
      where.course = {
        deletedAt: null,
        isActive: true,
        enrollments: {
          some: {
            userId,
            tenantId,
            status: EnrollmentStatus.ACTIVE,
          },
        },
      };
    }

    return where;
  }
}
