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

  /** ReviewCard sources are polymorphic, so authorize them before paginating
   * or counting. Personal cards are never exposed to an instructor. */
  async reviewCardWhere(
    tenantId: string,
    userId: string,
    viewer?: LearningAccessUser,
    courseId?: string,
  ): Promise<Prisma.ReviewCardWhereInput> {
    const instructorId = viewer?.role === Role.INSTRUCTOR ? viewer.id : null;
    const scopedCourseId = courseId ?? null;
    const cards = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT r."id" FROM "ReviewCard" r
      LEFT JOIN "PracticeQuestion" p ON r."sourceType" = 'PRACTICE_QUESTION'
        AND p."id" = r."sourceId" AND p."tenantId" = r."tenantId"
      LEFT JOIN "ExamQuestion" q ON r."sourceType" = 'EXAM_QUESTION'
        AND q."id" = r."sourceId" AND q."tenantId" = r."tenantId"
      LEFT JOIN "ExamSection" s ON s."id" = q."sectionId" AND s."tenantId" = r."tenantId"
      LEFT JOIN "Exam" e ON e."id" = s."examId" AND e."tenantId" = r."tenantId"
      LEFT JOIN "Course" c ON c."id" = COALESCE(p."courseId", e."courseId") AND c."tenantId" = r."tenantId"
      WHERE r."tenantId" = ${tenantId} AND r."userId" = ${userId}
      AND (
        (r."sourceType" = 'CUSTOM' AND ${instructorId}::text IS NULL
          AND (${scopedCourseId}::text IS NULL OR r."customContent"->>'courseId' = ${scopedCourseId}))
        OR (
          ((p."id" IS NOT NULL AND p."deletedAt" IS NULL AND p."reviewStatus" = 'APPROVED'
            AND EXISTS (SELECT 1 FROM "PracticeExerciseSetQuestion" l
              JOIN "PracticeExerciseSet" x ON x."id" = l."exerciseSetId" AND x."tenantId" = l."tenantId"
              LEFT JOIN "AdaptiveLearningPathItem" ap ON ap."id" = x."adaptivePathItemId" AND ap."tenantId" = x."tenantId"
              WHERE l."tenantId" = ${tenantId} AND l."questionId" = p."id"
                AND x."isPublished" = true AND x."deletedAt" IS NULL
                AND (x."adaptivePathItemId" IS NULL OR ap."userId" = ${userId})))
            OR (e."id" IS NOT NULL AND e."deletedAt" IS NULL AND e."isPublished" = true))
          AND (${scopedCourseId}::text IS NULL OR COALESCE(p."courseId", e."courseId") = ${scopedCourseId})
          AND (
            (COALESCE(p."courseId", e."courseId") IS NULL AND ${instructorId}::text IS NULL)
            OR (c."isActive" = true AND c."deletedAt" IS NULL
              AND EXISTS (SELECT 1 FROM "CourseEnrollment" ce WHERE ce."tenantId" = ${tenantId}
                AND ce."courseId" = c."id" AND ce."userId" = ${userId} AND ce."status" = 'ACTIVE')
              AND (${instructorId}::text IS NULL OR EXISTS (
                SELECT 1 FROM "CourseInstructorAssignment" a WHERE a."tenantId" = ${tenantId}
                  AND a."courseId" = c."id" AND a."instructorId" = ${instructorId}
              ))
            )
          )
        )
      )
    `);
    return { tenantId, userId, id: { in: cards.map((card) => card.id) } };
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
