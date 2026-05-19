import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@repo/database';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

type EnrollmentLearnerStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

const DEFAULT_COURSE_UNIT_TITLE = 'General';

interface BulkEnrollmentResult {
  courseId: string;
  requestedCount: number;
  uniqueCount: number;
  processedCount: number;
  skippedCount: number;
  duplicateCount: number;
  processedUserIds: string[];
  skippedUserIds: string[];
}

export interface EnrollmentAuditContext {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(data: {
    title: string;
    tenantId: string;
    slug?: string;
    description?: string;
    totalDuration?: number;
    aiSettings?: Record<string, unknown>;
    levelId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          totalDuration: data.totalDuration,
          aiSettings: this.toJsonInput(data.aiSettings),
          levelId: data.levelId,
          tenantId: data.tenantId,
        },
      });

      await tx.courseUnit.create({
        data: {
          title: DEFAULT_COURSE_UNIT_TITLE,
          order: 0,
          courseId: course.id,
          tenantId: data.tenantId,
        },
      });

      return course;
    });
  }

  async findAll(
    tenantId: string,
    user: { id: string; role: Role },
    options: { page?: number; limit?: number; search?: string } = {},
  ) {
    const { page = 1, limit = 10, search } = options;
    const skip = (page - 1) * limit;

    const where = this.learningAccess.courseWhere(tenantId, user, undefined, {
      includeInactive: user.role !== Role.STUDENT,
    });
    if (search) {
      Object.assign(where, { title: { contains: search, mode: 'insensitive' as const } });
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          level: {
            include: {
              program: true,
            },
          },
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              lessons: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: string,
    tenantId: string,
    user?: { id: string; role: Role },
    options: { includeInactive?: boolean } = {},
  ) {
    const where = this.learningAccess.courseWhere(
      tenantId,
      user,
      id,
      options.includeInactive === undefined && user?.role !== Role.STUDENT
        ? { includeInactive: true }
        : options,
    );
    const include: Prisma.CourseInclude = {
      level: {
        include: {
          program: true,
        },
      },
      units: {
        where: { deletedAt: null },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
      lessons: {
        where: { deletedAt: null },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      },
    };

    if (user?.role !== Role.STUDENT) {
      include.enrollments = {
        where: { tenantId, status: EnrollmentStatus.ACTIVE },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              isActive: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      };
    }

    const course = await this.prisma.course.findFirst({
      where,
      include,
    });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found in this tenant`);
    return course;
  }

  async createUnit(
    courseId: string,
    tenantId: string,
    data: { title: string; description?: string; order?: number },
  ) {
    await this.findOne(courseId, tenantId, undefined, { includeInactive: true });

    return this.prisma.courseUnit.create({
      data: {
        title: data.title,
        description: data.description,
        order: data.order ?? 0,
        courseId,
        tenantId,
      },
    });
  }

  async updateUnit(
    courseId: string,
    unitId: string,
    tenantId: string,
    data: { title?: string; description?: string; order?: number },
  ) {
    await this.ensureUnit(courseId, unitId, tenantId);

    return this.prisma.courseUnit.update({
      where: { id_tenantId: { id: unitId, tenantId } },
      data,
    });
  }

  async removeUnit(courseId: string, unitId: string, tenantId: string) {
    await this.ensureUnit(courseId, unitId, tenantId);

    return this.prisma.$transaction(async (tx) => {
      await tx.lesson.updateMany({
        where: {
          courseId,
          tenantId,
          unitId,
          deletedAt: null,
        },
        data: { unitId: null },
      });

      return tx.courseUnit.update({
        where: { id_tenantId: { id: unitId, tenantId } },
        data: { deletedAt: new Date() },
      });
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      title?: string;
      slug?: string;
      description?: string;
      totalDuration?: number;
      aiSettings?: Record<string, unknown>;
      levelId?: string;
    },
  ) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    const updateData: Prisma.CourseUncheckedUpdateInput = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      totalDuration: data.totalDuration,
      levelId: data.levelId,
      aiSettings: this.toJsonInput(data.aiSettings),
    };

    return this.prisma.course.update({
      where: { id_tenantId: { id, tenantId } },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    return this.prisma.course.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  async enrollStudent(
    courseId: string,
    tenantId: string,
    userId: string,
    audit?: EnrollmentAuditContext,
  ) {
    await this.findOne(courseId, tenantId);

    const student = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        role: Role.STUDENT,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    if (!student) {
      throw new BadRequestException('Active student not found in this tenant');
    }

    const enrollment = await this.prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
        unenrolledAt: null,
        tenantId,
      },
      create: {
        userId,
        courseId,
        tenantId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (audit) {
      await this.auditLog.log({
        userId: audit.actorId,
        tenantId,
        action: AuditAction.ENROLLMENT_ENROLL,
        status: AuditStatus.SUCCESS,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        metadata: { courseId, targetUserId: userId },
      });
    }

    return enrollment;
  }

  async bulkEnrollStudents(
    courseId: string,
    tenantId: string,
    userIds: string[],
    audit?: EnrollmentAuditContext,
  ): Promise<BulkEnrollmentResult> {
    await this.findOne(courseId, tenantId);

    const uniqueUserIds = this.uniqueIds(userIds);
    const students = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
        tenantId,
        role: Role.STUDENT,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });
    const activeStudentIds = new Set(students.map((student) => student.id));
    const invalidUserIds = uniqueUserIds.filter((userId) => !activeStudentIds.has(userId));

    if (invalidUserIds.length > 0) {
      if (audit) {
        await this.auditLog.log({
          userId: audit.actorId,
          tenantId,
          action: AuditAction.ENROLLMENT_BULK_ENROLL,
          status: AuditStatus.FAILURE,
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
          metadata: {
            courseId,
            requestedCount: userIds.length,
            invalidUserIds,
            reason: 'INVALID_STUDENTS',
          },
        });
      }
      throw new BadRequestException({
        message: 'Some active students were not found in this tenant',
        invalidUserIds,
      });
    }

    const enrolledAt = new Date();
    await this.prisma.$transaction((tx) =>
      Promise.all(
        uniqueUserIds.map((userId) =>
          tx.courseEnrollment.upsert({
            where: {
              userId_courseId: {
                userId,
                courseId,
              },
            },
            update: {
              status: EnrollmentStatus.ACTIVE,
              enrolledAt,
              unenrolledAt: null,
              tenantId,
            },
            create: {
              userId,
              courseId,
              tenantId,
              status: EnrollmentStatus.ACTIVE,
              enrolledAt,
            },
          }),
        ),
      ),
    );

    const result = this.buildBulkEnrollmentResult(courseId, userIds, uniqueUserIds, []);

    if (audit) {
      await this.auditLog.log({
        userId: audit.actorId,
        tenantId,
        action: AuditAction.ENROLLMENT_BULK_ENROLL,
        status: AuditStatus.SUCCESS,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        metadata: {
          courseId,
          requestedCount: result.requestedCount,
          uniqueCount: result.uniqueCount,
          processedCount: result.processedCount,
          duplicateCount: result.duplicateCount,
          processedUserIds: result.processedUserIds,
        },
      });
    }

    return result;
  }

  async unenrollStudent(
    courseId: string,
    tenantId: string,
    userId: string,
    audit?: EnrollmentAuditContext,
  ) {
    await this.findOne(courseId, tenantId);

    const enrollment = await this.prisma.courseEnrollment.findFirst({
      where: {
        courseId,
        userId,
        tenantId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Active enrollment not found in this tenant');
    }

    const updated = await this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.REVOKED,
        unenrolledAt: new Date(),
      },
    });

    if (audit) {
      await this.auditLog.log({
        userId: audit.actorId,
        tenantId,
        action: AuditAction.ENROLLMENT_UNENROLL,
        status: AuditStatus.SUCCESS,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        metadata: { courseId, targetUserId: userId, enrollmentId: enrollment.id },
      });
    }

    return updated;
  }

  async bulkUnenrollStudents(
    courseId: string,
    tenantId: string,
    userIds: string[],
    audit?: EnrollmentAuditContext,
  ): Promise<BulkEnrollmentResult> {
    await this.findOne(courseId, tenantId);

    const uniqueUserIds = this.uniqueIds(userIds);
    const activeEnrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        userId: { in: uniqueUserIds },
        tenantId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        id: true,
        userId: true,
      },
    });
    const activeUserIds = new Set(activeEnrollments.map((enrollment) => enrollment.userId));
    const processedUserIds = uniqueUserIds.filter((userId) => activeUserIds.has(userId));
    const skippedUserIds = uniqueUserIds.filter((userId) => !activeUserIds.has(userId));

    if (activeEnrollments.length > 0) {
      await this.prisma.courseEnrollment.updateMany({
        where: {
          id: { in: activeEnrollments.map((enrollment) => enrollment.id) },
          tenantId,
        },
        data: {
          status: EnrollmentStatus.REVOKED,
          unenrolledAt: new Date(),
        },
      });
    }

    const result = this.buildBulkEnrollmentResult(
      courseId,
      userIds,
      processedUserIds,
      skippedUserIds,
    );

    if (audit) {
      await this.auditLog.log({
        userId: audit.actorId,
        tenantId,
        action: AuditAction.ENROLLMENT_BULK_UNENROLL,
        status: AuditStatus.SUCCESS,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        metadata: {
          courseId,
          requestedCount: result.requestedCount,
          uniqueCount: result.uniqueCount,
          processedCount: result.processedCount,
          skippedCount: result.skippedCount,
          duplicateCount: result.duplicateCount,
          processedUserIds: result.processedUserIds,
          skippedUserIds: result.skippedUserIds,
        },
      });
    }

    return result;
  }

  async getEnrollmentReport(courseId: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(tenantId, undefined, courseId, {
        includeInactive: true,
      }),
      select: {
        id: true,
        title: true,
        lessons: {
          where: { deletedAt: null },
          select: { id: true },
        },
        enrollments: {
          where: {
            tenantId,
            status: EnrollmentStatus.ACTIVE,
          },
          orderBy: { enrolledAt: 'desc' },
          select: {
            id: true,
            userId: true,
            status: true,
            enrolledAt: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }

    const lessonIds = course.lessons.map((lesson) => lesson.id);
    const learnerIds = course.enrollments.map((enrollment) => enrollment.userId);

    const [progressRecords, activityRecords] = await Promise.all([
      learnerIds.length === 0 || lessonIds.length === 0
        ? Promise.resolve([])
        : this.prisma.userLessonProgress.findMany({
            where: {
              tenantId,
              userId: { in: learnerIds },
              lessonId: { in: lessonIds },
            },
            select: {
              userId: true,
              lessonId: true,
              status: true,
              updatedAt: true,
            },
          }),
      learnerIds.length === 0
        ? Promise.resolve([])
        : this.prisma.learningActivity.findMany({
            where: {
              tenantId,
              courseId,
              userId: { in: learnerIds },
            },
            select: {
              userId: true,
              type: true,
              occurredAt: true,
              timeSpentSeconds: true,
            },
            orderBy: { occurredAt: 'desc' },
          }),
    ]);

    const progressByUser = new Map<
      string,
      Array<{
        completed: boolean;
        updatedAt: Date;
      }>
    >();
    for (const record of progressRecords) {
      const bucket = progressByUser.get(record.userId) ?? [];
      bucket.push({
        completed: record.status === 'COMPLETED',
        updatedAt: record.updatedAt,
      });
      progressByUser.set(record.userId, bucket);
    }

    const activityByUser = new Map<
      string,
      {
        lastActivityAt: Date | null;
        activitySessions: number;
        totalTimeSpentSeconds: number;
      }
    >();
    for (const record of activityRecords) {
      const current = activityByUser.get(record.userId) ?? {
        lastActivityAt: null,
        activitySessions: 0,
        totalTimeSpentSeconds: 0,
      };

      current.lastActivityAt ??= record.occurredAt;
      if (record.type === 'LESSON_OPENED') {
        current.activitySessions += 1;
      }
      current.totalTimeSpentSeconds += record.timeSpentSeconds ?? 0;

      activityByUser.set(record.userId, current);
    }

    const totalLessons = course.lessons.length;
    const students = course.enrollments.map((enrollment) => {
      const userProgress = progressByUser.get(enrollment.userId) ?? [];
      const userActivity = activityByUser.get(enrollment.userId) ?? {
        lastActivityAt: null,
        activitySessions: 0,
        totalTimeSpentSeconds: 0,
      };
      const completedLessons = userProgress.filter((record) => record.completed).length;
      const completionPercentage =
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
      const lastProgressAt = userProgress.reduce<Date | null>((latest, record) => {
        if (!latest || record.updatedAt > latest) {
          return record.updatedAt;
        }
        return latest;
      }, null);
      const lastActivityAt = userActivity.lastActivityAt ?? lastProgressAt;

      return {
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        fullName: enrollment.user.fullName,
        email: enrollment.user.email,
        isActive: enrollment.user.isActive,
        enrolledAt: enrollment.enrolledAt,
        totalLessons,
        completedLessons,
        completionPercentage,
        status: this.resolveLearnerStatus({
          totalLessons,
          completedLessons,
          hasActivity: Boolean(lastActivityAt),
        }),
        lastActivityAt,
        activitySessions: userActivity.activitySessions,
        totalTimeSpentSeconds: userActivity.totalTimeSpentSeconds,
      };
    });

    const totals = students.reduce(
      (acc, student) => {
        acc.enrolledStudents += 1;
        acc.completedLessons += student.completedLessons;
        acc.activitySessions += student.activitySessions;
        acc.totalTimeSpentSeconds += student.totalTimeSpentSeconds;
        acc.averageCompletionPercentage += student.completionPercentage;

        if (student.status === 'COMPLETED') {
          acc.completedStudents += 1;
        } else if (student.status === 'IN_PROGRESS') {
          acc.inProgressStudents += 1;
        } else {
          acc.notStartedStudents += 1;
        }

        return acc;
      },
      {
        enrolledStudents: 0,
        completedStudents: 0,
        inProgressStudents: 0,
        notStartedStudents: 0,
        totalLessons,
        completedLessons: 0,
        activitySessions: 0,
        totalTimeSpentSeconds: 0,
        averageCompletionPercentage: 0,
      },
    );

    return {
      course: {
        id: course.id,
        title: course.title,
      },
      totals: {
        ...totals,
        averageCompletionPercentage:
          totals.enrolledStudents === 0
            ? 0
            : Math.round(totals.averageCompletionPercentage / totals.enrolledStudents),
        completionRate:
          totals.enrolledStudents === 0
            ? 0
            : Math.round((totals.completedStudents / totals.enrolledStudents) * 100),
      },
      students,
    };
  }

  private resolveLearnerStatus({
    totalLessons,
    completedLessons,
    hasActivity,
  }: {
    totalLessons: number;
    completedLessons: number;
    hasActivity: boolean;
  }): EnrollmentLearnerStatus {
    if (totalLessons > 0 && completedLessons === totalLessons) {
      return 'COMPLETED';
    }

    if (completedLessons > 0 || hasActivity) {
      return 'IN_PROGRESS';
    }

    return 'NOT_STARTED';
  }

  private async ensureUnit(courseId: string, unitId: string, tenantId: string) {
    const unit = await this.prisma.courseUnit.findFirst({
      where: {
        id: unitId,
        courseId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found in this course`);
    }

    return unit;
  }

  private toJsonInput(value: Record<string, unknown> | undefined) {
    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }

  private uniqueIds(ids: string[]) {
    return [...new Set(ids)];
  }

  private buildBulkEnrollmentResult(
    courseId: string,
    requestedUserIds: string[],
    processedUserIds: string[],
    skippedUserIds: string[],
  ): BulkEnrollmentResult {
    const uniqueCount = this.uniqueIds(requestedUserIds).length;

    return {
      courseId,
      requestedCount: requestedUserIds.length,
      uniqueCount,
      processedCount: processedUserIds.length,
      skippedCount: skippedUserIds.length,
      duplicateCount: requestedUserIds.length - uniqueCount,
      processedUserIds,
      skippedUserIds,
    };
  }
}
