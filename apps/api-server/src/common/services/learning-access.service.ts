import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@repo/database';
import { PrismaService } from './prisma.service';

export interface LearningAccessUser {
  id: string;
  role: Role;
}

interface CourseWhereOptions {
  includeInactive?: boolean;
}

@Injectable()
export class LearningAccessService {
  constructor(private readonly prisma: PrismaService) {}

  courseWhere(
    tenantId: string,
    user?: LearningAccessUser,
    courseId?: string,
    options: CourseWhereOptions = {},
  ): Prisma.CourseWhereInput {
    const where: Prisma.CourseWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (!options.includeInactive) {
      where.isActive = true;
    }

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

    if (user?.role === Role.INSTRUCTOR) {
      where.instructorAssignments = {
        some: {
          instructorId: user.id,
          tenantId,
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

    if (user?.role === Role.STUDENT || user?.role === Role.INSTRUCTOR) {
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

  /**
   * Authoring gate for instructors. Content that targets a specific course must
   * belong to a course the instructor is assigned to; tenant-wide content
   * (courseId = null) is reserved for ADMIN/SUPER_ADMIN. ADMIN/SUPER_ADMIN pass
   * through (still tenant-scoped by the caller).
   */
  async ensureAuthoringCourseAccess(
    courseId: string | null | undefined,
    tenantId: string,
    user: LearningAccessUser,
  ) {
    if (user.role !== Role.INSTRUCTOR) {
      return;
    }

    if (!courseId) {
      throw new ForbiddenException(
        'Instructors can only manage content within their assigned courses',
      );
    }

    await this.ensureCourseAccess(courseId, tenantId, user);
  }
}
