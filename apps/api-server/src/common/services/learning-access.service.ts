import { Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@repo/database';
import { PrismaService } from './prisma.service';

export interface LearningAccessUser {
  id: string;
  role: Role;
}

@Injectable()
export class LearningAccessService {
  constructor(private readonly prisma: PrismaService) {}

  courseWhere(
    tenantId: string,
    user?: LearningAccessUser,
    courseId?: string,
  ): Prisma.CourseWhereInput {
    const where: Prisma.CourseWhereInput = {
      tenantId,
      deletedAt: null,
      isActive: true,
    };

    if (courseId) {
      where.id = courseId;
    }

    if (user?.role === Role.STUDENT) {
      where.enrollments = {
        some: {
          userId: user.id,
          tenantId,
          status: EnrollmentStatus.ACTIVE,
        },
      };
    }

    return where;
  }

  lessonWhere(
    tenantId: string,
    user?: LearningAccessUser,
    lessonId?: string,
  ): Prisma.LessonWhereInput {
    const where: Prisma.LessonWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (lessonId) {
      where.id = lessonId;
    }

    if (user?.role === Role.STUDENT) {
      where.course = this.courseWhere(tenantId, user);
    }

    return where;
  }

  async ensureCourseAccess(courseId: string, tenantId: string, user: LearningAccessUser) {
    const course = await this.prisma.course.findFirst({
      where: this.courseWhere(tenantId, user, courseId),
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }
  }
}
