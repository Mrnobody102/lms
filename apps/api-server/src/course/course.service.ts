import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  CourseActivityCompletionPolicy,
  CourseActivityProgressStatus,
  CourseActivityType,
  CourseInstructorRole,
  EnrollmentStatus,
  ExamAttemptStatus,
  Prisma,
  ProgressStatus,
  Role,
} from '@repo/database';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import type { CourseStatusFilter } from './dto/course-query.dto';

type EnrollmentLearnerStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

const DEFAULT_COURSE_UNIT_TITLE = 'General';
const MAX_BULK_ENROLLMENT_SIZE = 100;

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

interface EnrollmentNotificationTarget {
  id: string;
  email: string;
  fullName: string | null;
}

interface CourseTimelineUser {
  id: string;
  role: Role;
}

interface CourseActivityTargetPayload {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  questionCount?: number;
  sectionCount?: number;
  attemptCount?: number;
  href: string;
}

interface CourseActivityProgressPayload {
  status: CourseActivityProgressStatus;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
  scorePercent: number | null;
}

interface CourseTimelineActivity {
  id: string;
  type: CourseActivityType;
  targetId: string;
  courseId: string;
  unitId: string | null;
  order: number;
  isRequired: boolean;
  isPublished: boolean;
  estimatedMinutes: number;
  availableFrom: Date | null;
  dueAt: Date | null;
  completionPolicy: CourseActivityCompletionPolicy;
  progress: CourseActivityProgressPayload | null;
  target: CourseActivityTargetPayload;
}

interface CourseTimelineUnit {
  id: string;
  title: string;
  description: string | null;
  order: number;
  activities: CourseTimelineActivity[];
}

interface LegacyActivitySource {
  id: string;
  type: CourseActivityType;
  targetId: string;
  courseId: string;
  unitId: string | null;
  order: number;
  isRequired: boolean;
  isPublished: boolean;
  estimatedMinutes: number;
  availableFrom: Date | null;
  dueAt: Date | null;
  completionPolicy: CourseActivityCompletionPolicy;
  progress?: CourseActivityProgressPayload | null;
}

export interface EnrollmentAuditContext {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface CourseAccessUser {
  id: string;
  role: Role;
}

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly auditLog: AuditLogService,
    @Optional() private readonly notificationService?: NotificationService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async create(data: {
    title: string;
    tenantId: string;
    slug?: string;
    description?: string;
    totalDuration?: number;
    coverImageUrl?: string;
    subject?: string;
    languageCode?: string;
    proficiencyLevel?: string;
    aiSettings?: Record<string, unknown>;
    levelId?: string;
    isActive?: boolean;
  }) {
    await this.ensureLevelBelongsToTenant(data.tenantId, data.levelId);

    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          totalDuration: data.totalDuration,
          coverImageUrl: data.coverImageUrl,
          subject: data.subject,
          languageCode: data.languageCode,
          proficiencyLevel: data.proficiencyLevel,
          aiSettings: this.toJsonInput(data.aiSettings),
          levelId: data.levelId,
          tenantId: data.tenantId,
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
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
    options: { page?: number; limit?: number; search?: string; status?: CourseStatusFilter } = {},
  ) {
    const { page = 1, limit = 10, search, status = 'all' } = options;
    const skip = (page - 1) * limit;

    const where = this.learningAccess.courseWhere(tenantId, user, undefined, {
      includeInactive: user.role !== Role.STUDENT,
    });
    if (search) {
      Object.assign(where, { title: { contains: search, mode: 'insensitive' as const } });
    }
    if (user.role !== Role.STUDENT && status !== 'all') {
      Object.assign(where, { isActive: status === 'published' });
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
      include.instructorAssignments = {
        where: { tenantId },
        include: {
          instructor: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      };
    }

    const course = await this.prisma.course.findFirst({
      where,
      include,
    });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found in this tenant`);
    return course;
  }

  async getActivities(courseId: string, tenantId: string, user: CourseTimelineUser) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(
        tenantId,
        user,
        courseId,
        user.role !== Role.STUDENT ? { includeInactive: true } : {},
      ),
      select: {
        id: true,
        title: true,
        totalDuration: true,
        units: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }

    const where: Prisma.CourseActivityWhereInput = {
      tenantId,
      courseId,
      deletedAt: null,
    };

    const storedActivities = await this.prisma.courseActivity.findMany({
      where,
      include: {
        progress: {
          where: { tenantId, userId: user.id },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const visibleStoredActivities =
      user.role === Role.STUDENT
        ? storedActivities.filter((activity) => activity.isPublished)
        : storedActivities;
    const activitySources =
      storedActivities.length > 0
        ? visibleStoredActivities.map((activity): LegacyActivitySource => {
            const progress = activity.progress[0] ?? null;
            return {
              id: activity.id,
              type: activity.type,
              targetId: activity.targetId,
              courseId: activity.courseId,
              unitId: activity.unitId,
              order: activity.order,
              isRequired: activity.isRequired,
              isPublished: activity.isPublished,
              estimatedMinutes: activity.estimatedMinutes,
              availableFrom: activity.availableFrom,
              dueAt: activity.dueAt,
              completionPolicy: activity.completionPolicy,
              progress: progress
                ? {
                    status: progress.status,
                    completedAt: progress.completedAt,
                    lastAccessedAt: progress.lastAccessedAt,
                    scorePercent: progress.scorePercent,
                  }
                : null,
            };
          })
        : await this.buildLegacyActivitySources(courseId, tenantId, user);

    const targets = await this.getActivityTargets(tenantId, activitySources, user);
    const inferredProgress = await this.getInferredActivityProgress(
      tenantId,
      user,
      activitySources,
    );
    const activities = activitySources
      .map((activity) => {
        const target = targets.get(this.activityKey(activity.type, activity.targetId));
        if (!target) {
          return null;
        }

        return {
          ...activity,
          progress:
            activity.progress ??
            inferredProgress.get(this.activityKey(activity.type, activity.targetId)) ??
            null,
          target,
        };
      })
      .filter((activity): activity is CourseTimelineActivity => activity !== null)
      .sort((a, b) => a.order - b.order);

    const units: CourseTimelineUnit[] = course.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      order: unit.order,
      activities: activities.filter((activity) => activity.unitId === unit.id),
    }));

    return {
      course: {
        id: course.id,
        title: course.title,
        totalDuration: course.totalDuration,
      },
      units,
      ungroupedActivities: activities.filter((activity) => !activity.unitId),
    };
  }

  async createUnit(
    courseId: string,
    tenantId: string,
    data: { title: string; description?: string; order?: number },
    user?: CourseAccessUser,
  ) {
    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(courseId, tenantId, user);
    } else {
      await this.findOne(courseId, tenantId, undefined, { includeInactive: true });
    }

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
    user?: CourseAccessUser,
  ) {
    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(courseId, tenantId, user);
    }
    await this.ensureUnit(courseId, unitId, tenantId);

    return this.prisma.courseUnit.update({
      where: { id_tenantId: { id: unitId, tenantId } },
      data,
    });
  }

  async removeUnit(courseId: string, unitId: string, tenantId: string, user?: CourseAccessUser) {
    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(courseId, tenantId, user);
    }
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

  async reorderUnits(
    courseId: string,
    tenantId: string,
    unitIds: string[],
    user?: CourseAccessUser,
  ) {
    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(courseId, tenantId, user);
    } else {
      await this.findOne(courseId, tenantId, undefined, { includeInactive: true });
    }
    const uniqueUnitIds = [...new Set(unitIds)];
    if (uniqueUnitIds.length !== unitIds.length) {
      throw new BadRequestException('Unit IDs must be unique');
    }
    const matchingUnits = await this.prisma.courseUnit.findMany({
      where: {
        tenantId,
        courseId,
        id: { in: uniqueUnitIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (matchingUnits.length !== uniqueUnitIds.length) {
      throw new BadRequestException('All units must belong to the target course');
    }

    return this.prisma.$transaction(
      uniqueUnitIds.map((id, index) =>
        this.prisma.courseUnit.update({
          where: { id_tenantId: { id, tenantId } },
          data: { order: index },
        }),
      ),
    );
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      title?: string;
      slug?: string;
      description?: string;
      totalDuration?: number;
      coverImageUrl?: string | null;
      subject?: string | null;
      languageCode?: string | null;
      proficiencyLevel?: string | null;
      aiSettings?: Record<string, unknown>;
      levelId?: string;
      isActive?: boolean;
    },
  ) {
    await this.ensureLevelBelongsToTenant(tenantId, data.levelId);

    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    const updateData: Prisma.CourseUncheckedUpdateInput = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      totalDuration: data.totalDuration,
      coverImageUrl: data.coverImageUrl,
      subject: data.subject,
      languageCode: data.languageCode,
      proficiencyLevel: data.proficiencyLevel,
      levelId: data.levelId,
      aiSettings: this.toJsonInput(data.aiSettings),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    return this.prisma.course.update({
      where: { id_tenantId: { id, tenantId } },
      data: updateData,
    });
  }

  private async ensureLevelBelongsToTenant(tenantId: string, levelId?: string) {
    if (!levelId) {
      return;
    }

    const level = await this.prisma.level.findFirst({
      where: {
        id: levelId,
        tenantId,
        deletedAt: null,
        isActive: true,
        program: {
          tenantId,
          deletedAt: null,
          isActive: true,
        },
      },
      select: { id: true },
    });

    if (!level) {
      throw new BadRequestException('Selected level is not available for this tenant');
    }
  }

  async remove(id: string, tenantId: string) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    return this.prisma.course.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  async setActive(id: string, tenantId: string, isActive: boolean) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    return this.prisma.course.update({
      where: { id_tenantId: { id, tenantId } },
      data: { isActive },
    });
  }

  async listInstructors(courseId: string, tenantId: string) {
    await this.findOne(courseId, tenantId, undefined, { includeInactive: true });

    return this.prisma.courseInstructorAssignment.findMany({
      where: { courseId, tenantId },
      include: {
        instructor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async assignInstructor(
    courseId: string,
    tenantId: string,
    instructorId: string,
    assignedById?: string,
    role: CourseInstructorRole = CourseInstructorRole.OWNER,
  ) {
    await this.findOne(courseId, tenantId, undefined, { includeInactive: true });

    const instructor = await this.prisma.user.findFirst({
      where: {
        id: instructorId,
        tenantId,
        role: Role.INSTRUCTOR,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    if (!instructor) {
      throw new BadRequestException('Active instructor not found in this tenant');
    }

    return this.prisma.courseInstructorAssignment.upsert({
      where: {
        tenantId_courseId_instructorId: {
          tenantId,
          courseId,
          instructorId,
        },
      },
      update: {
        assignedById,
        role,
      },
      create: {
        tenantId,
        courseId,
        instructorId,
        assignedById,
        role,
      },
      include: {
        instructor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    });
  }

  async removeInstructor(courseId: string, tenantId: string, instructorId: string) {
    await this.findOne(courseId, tenantId, undefined, { includeInactive: true });

    const assignment = await this.prisma.courseInstructorAssignment.findUnique({
      where: {
        tenantId_courseId_instructorId: {
          tenantId,
          courseId,
          instructorId,
        },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new NotFoundException('Instructor assignment not found in this tenant');
    }

    await this.prisma.courseInstructorAssignment.delete({
      where: { tenantId_courseId_instructorId: { tenantId, courseId, instructorId } },
    });

    return { success: true };
  }

  async enrollStudent(
    courseId: string,
    tenantId: string,
    userId: string,
    audit?: EnrollmentAuditContext,
  ) {
    const course = await this.findOne(courseId, tenantId);

    const student = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        role: Role.STUDENT,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
    });

    if (!student) {
      throw new BadRequestException('Active student not found in this tenant');
    }

    const existingActiveEnrollment = await this.prisma.courseEnrollment.findFirst({
      where: {
        courseId,
        userId,
        tenantId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    const enrollment = await this.prisma.courseEnrollment.upsert({
      where: {
        tenantId_userId_courseId: {
          tenantId,
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

    if (!existingActiveEnrollment) {
      await this.notifyCourseEnrollment(tenantId, course.id, course.title, [student]);
    }

    return enrollment;
  }

  async bulkEnrollStudents(
    courseId: string,
    tenantId: string,
    userIds: string[],
    audit?: EnrollmentAuditContext,
  ): Promise<BulkEnrollmentResult> {
    this.assertBulkEnrollmentSize(userIds);
    const course = await this.findOne(courseId, tenantId);

    const uniqueUserIds = this.uniqueIds(userIds);
    const students = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
        tenantId,
        role: Role.STUDENT,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
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

    const existingActiveEnrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        userId: { in: uniqueUserIds },
        tenantId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { userId: true },
    });
    const existingActiveUserIds = new Set(
      existingActiveEnrollments.map((enrollment) => enrollment.userId),
    );
    const notificationTargets = students.filter(
      (student) => !existingActiveUserIds.has(student.id),
    );

    const enrolledAt = new Date();
    await this.prisma.$transaction((tx) =>
      Promise.all(
        uniqueUserIds.map((userId) =>
          tx.courseEnrollment.upsert({
            where: {
              tenantId_userId_courseId: {
                tenantId,
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

    await this.notifyCourseEnrollment(tenantId, course.id, course.title, notificationTargets);

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
      where: { id_tenantId: { id: enrollment.id, tenantId } },
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

    await this.notifyCourseRevoked(tenantId, courseId, userId);

    return updated;
  }

  async bulkUnenrollStudents(
    courseId: string,
    tenantId: string,
    userIds: string[],
    audit?: EnrollmentAuditContext,
  ): Promise<BulkEnrollmentResult> {
    this.assertBulkEnrollmentSize(userIds);
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

    await this.notifyCourseRevokedForUsers(tenantId, courseId, processedUserIds);

    return result;
  }

  private async notifyCourseEnrollment(
    tenantId: string,
    courseId: string,
    courseTitle: string,
    users: EnrollmentNotificationTarget[],
  ) {
    if (users.length === 0) {
      return;
    }

    await Promise.all(
      users.map(async (user) => {
        try {
          await this.notificationService?.createNotification(
            tenantId,
            user.id,
            'Khóa học đã được kích hoạt',
            `Bạn đã có quyền truy cập khóa học "${courseTitle}".`,
            'SUCCESS',
            `/courses/${courseId}`,
          );
        } catch (error) {
          this.logger.error(`Failed to create enrollment notification for user ${user.id}`, error);
        }

        const emailTask = this.mailService?.sendCourseEnrollmentEmail({
          email: user.email,
          fullName: user.fullName,
          courseTitle,
          courseUrl: this.buildStudentCourseUrl(courseId),
          locale: 'vi',
        });
        emailTask?.catch((error: unknown) => {
          this.logger.error(`Failed to send course enrollment email to ${user.email}`, error);
        });
      }),
    );
  }

  private async notifyCourseRevoked(tenantId: string, courseId: string, userId: string) {
    try {
      await this.notificationService?.createNotification(
        tenantId,
        userId,
        'Quyền truy cập khóa học đã thay đổi',
        'Bạn đã được gỡ khỏi một khóa học. Nếu có thắc mắc, vui lòng liên hệ quản trị viên.',
        'WARNING',
        `/courses/${courseId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create course revocation notification for user ${userId}`,
        error,
      );
    }
  }

  private async notifyCourseRevokedForUsers(tenantId: string, courseId: string, userIds: string[]) {
    await Promise.all(
      userIds.map((userId) => this.notifyCourseRevoked(tenantId, courseId, userId)),
    );
  }

  private buildStudentCourseUrl(courseId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_STUDENT_URL?.replace(/\/$/, '');
    return baseUrl ? `${baseUrl}/vi/courses/${courseId}` : `/courses/${courseId}`;
  }

  async getEnrollmentReport(courseId: string, tenantId: string, user?: CourseAccessUser) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(tenantId, user, courseId, {
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

  private async buildLegacyActivitySources(
    courseId: string,
    tenantId: string,
    user: CourseTimelineUser,
  ): Promise<LegacyActivitySource[]> {
    const [lessons, practiceSets, exams, roleplays] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          tenantId,
          courseId,
          deletedAt: null,
        },
        select: {
          id: true,
          type: true,
          courseId: true,
          unitId: true,
          order: true,
          duration: true,
          practiceExerciseSetId: true,
          examId: true,
          progress: {
            where: { tenantId, userId: user.id },
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { status: true, updatedAt: true },
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.practiceExerciseSet.findMany({
        where: {
          tenantId,
          courseId,
          deletedAt: null,
          ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
        },
        select: {
          id: true,
          courseId: true,
          unitId: true,
          isPublished: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.exam.findMany({
        where: {
          tenantId,
          courseId,
          deletedAt: null,
          ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
        },
        select: {
          id: true,
          courseId: true,
          unitId: true,
          durationMinutes: true,
          isPublished: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.roleplayScenario.findMany({
        where: {
          tenantId,
          courseId,
          deletedAt: null,
          ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
        },
        select: {
          id: true,
          courseId: true,
          unitId: true,
          isPublished: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const sources = lessons.map((lesson): LegacyActivitySource => {
      const lessonProgress = lesson.progress[0];
      const type =
        lesson.type === 'practice' && lesson.practiceExerciseSetId
          ? CourseActivityType.PRACTICE
          : lesson.type === 'exam' && lesson.examId
            ? CourseActivityType.EXAM
            : CourseActivityType.LESSON;
      const targetId =
        type === CourseActivityType.PRACTICE
          ? lesson.practiceExerciseSetId!
          : type === CourseActivityType.EXAM
            ? lesson.examId!
            : lesson.id;

      return {
        id: `legacy-${lesson.id}`,
        type,
        targetId,
        courseId: lesson.courseId,
        unitId: lesson.unitId,
        order: lesson.order,
        isRequired: true,
        isPublished: true,
        estimatedMinutes: lesson.duration,
        availableFrom: null,
        dueAt: null,
        completionPolicy:
          type === CourseActivityType.PRACTICE
            ? CourseActivityCompletionPolicy.PRACTICE_SUBMITTED
            : type === CourseActivityType.EXAM
              ? CourseActivityCompletionPolicy.EXAM_SUBMITTED
              : CourseActivityCompletionPolicy.LESSON_COMPLETED,
        progress: lessonProgress
          ? {
              status:
                lessonProgress.status === ProgressStatus.COMPLETED
                  ? CourseActivityProgressStatus.COMPLETED
                  : CourseActivityProgressStatus.IN_PROGRESS,
              completedAt:
                lessonProgress.status === ProgressStatus.COMPLETED
                  ? lessonProgress.updatedAt
                  : null,
              lastAccessedAt: lessonProgress.updatedAt,
              scorePercent: null,
            }
          : null,
      };
    });

    const referencedPracticeIds = new Set(
      sources
        .filter((activity) => activity.type === CourseActivityType.PRACTICE)
        .map((activity) => activity.targetId),
    );
    const referencedExamIds = new Set(
      sources
        .filter((activity) => activity.type === CourseActivityType.EXAM)
        .map((activity) => activity.targetId),
    );

    practiceSets.forEach((set, index) => {
      if (referencedPracticeIds.has(set.id)) {
        return;
      }
      sources.push({
        id: `legacy-practice-${set.id}`,
        type: CourseActivityType.PRACTICE,
        targetId: set.id,
        courseId: set.courseId ?? courseId,
        unitId: set.unitId,
        order: 100000 + index,
        isRequired: true,
        isPublished: set.isPublished,
        estimatedMinutes: 10,
        availableFrom: null,
        dueAt: null,
        completionPolicy: CourseActivityCompletionPolicy.PRACTICE_SUBMITTED,
      });
    });

    exams.forEach((exam, index) => {
      if (referencedExamIds.has(exam.id)) {
        return;
      }
      sources.push({
        id: `legacy-exam-${exam.id}`,
        type: CourseActivityType.EXAM,
        targetId: exam.id,
        courseId: exam.courseId ?? courseId,
        unitId: exam.unitId,
        order: 200000 + index,
        isRequired: true,
        isPublished: exam.isPublished,
        estimatedMinutes: exam.durationMinutes,
        availableFrom: null,
        dueAt: null,
        completionPolicy: CourseActivityCompletionPolicy.EXAM_SUBMITTED,
      });
    });

    roleplays.forEach((scenario, index) => {
      sources.push({
        id: `legacy-roleplay-${scenario.id}`,
        type: CourseActivityType.ROLEPLAY,
        targetId: scenario.id,
        courseId: scenario.courseId ?? courseId,
        unitId: scenario.unitId,
        order: 300000 + index,
        isRequired: true,
        isPublished: scenario.isPublished,
        estimatedMinutes: 10,
        availableFrom: null,
        dueAt: null,
        completionPolicy: CourseActivityCompletionPolicy.ROLEPLAY_COMPLETED,
      });
    });

    return sources;
  }

  private async getActivityTargets(
    tenantId: string,
    activities: LegacyActivitySource[],
    user: CourseTimelineUser,
  ) {
    const idsByType = new Map<CourseActivityType, string[]>();
    for (const activity of activities) {
      idsByType.set(activity.type, [...(idsByType.get(activity.type) ?? []), activity.targetId]);
    }

    const [lessons, practiceSets, exams, roleplays] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          tenantId,
          id: { in: this.uniqueIds(idsByType.get(CourseActivityType.LESSON) ?? []) },
          deletedAt: null,
        },
        select: { id: true, title: true, duration: true },
      }),
      this.prisma.practiceExerciseSet.findMany({
        where: {
          tenantId,
          id: { in: this.uniqueIds(idsByType.get(CourseActivityType.PRACTICE) ?? []) },
          deletedAt: null,
          ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
        },
        select: {
          id: true,
          title: true,
          description: true,
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      this.prisma.exam.findMany({
        where: {
          tenantId,
          id: { in: this.uniqueIds(idsByType.get(CourseActivityType.EXAM) ?? []) },
          deletedAt: null,
          ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
        },
        select: {
          id: true,
          title: true,
          description: true,
          durationMinutes: true,
          _count: { select: { sections: true, attempts: true } },
        },
      }),
      this.prisma.roleplayScenario.findMany({
        where: {
          tenantId,
          id: { in: this.uniqueIds(idsByType.get(CourseActivityType.ROLEPLAY) ?? []) },
          deletedAt: null,
          ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
        },
        select: { id: true, title: true, description: true },
      }),
    ]);

    const targets = new Map<string, CourseActivityTargetPayload>();
    lessons.forEach((lesson) => {
      targets.set(this.activityKey(CourseActivityType.LESSON, lesson.id), {
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.duration,
        href: `/lessons/${lesson.id}`,
      });
    });
    practiceSets.forEach((set) => {
      targets.set(this.activityKey(CourseActivityType.PRACTICE, set.id), {
        id: set.id,
        title: set.title,
        description: set.description,
        questionCount: set._count.questions,
        attemptCount: set._count.attempts,
        href: `/practice/${set.id}`,
      });
    });
    exams.forEach((exam) => {
      targets.set(this.activityKey(CourseActivityType.EXAM, exam.id), {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        sectionCount: exam._count.sections,
        attemptCount: exam._count.attempts,
        href: `/exams/${exam.id}`,
      });
    });
    roleplays.forEach((scenario) => {
      targets.set(this.activityKey(CourseActivityType.ROLEPLAY, scenario.id), {
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        href: `/roleplay/${scenario.id}`,
      });
    });

    return targets;
  }

  private async getInferredActivityProgress(
    tenantId: string,
    user: CourseTimelineUser,
    activities: LegacyActivitySource[],
  ) {
    const progress = new Map<string, CourseActivityProgressPayload>();
    const practiceIds = this.uniqueIds(
      activities
        .filter((activity) => activity.type === CourseActivityType.PRACTICE)
        .map((activity) => activity.targetId),
    );
    const examIds = this.uniqueIds(
      activities
        .filter((activity) => activity.type === CourseActivityType.EXAM)
        .map((activity) => activity.targetId),
    );

    const [practiceAttempts, examAttempts] = await Promise.all([
      practiceIds.length === 0
        ? Promise.resolve([])
        : this.prisma.practiceAttempt.findMany({
            where: {
              tenantId,
              userId: user.id,
              exerciseSetId: { in: practiceIds },
            },
            select: {
              exerciseSetId: true,
              score: true,
              totalPoints: true,
              submittedAt: true,
            },
            orderBy: { submittedAt: 'desc' },
          }),
      examIds.length === 0
        ? Promise.resolve([])
        : this.prisma.examAttempt.findMany({
            where: {
              tenantId,
              userId: user.id,
              examId: { in: examIds },
            },
            select: {
              examId: true,
              status: true,
              score: true,
              totalPoints: true,
              startedAt: true,
              submittedAt: true,
            },
            orderBy: { startedAt: 'desc' },
          }),
    ]);

    for (const attempt of practiceAttempts) {
      const key = this.activityKey(CourseActivityType.PRACTICE, attempt.exerciseSetId);
      if (progress.has(key)) {
        continue;
      }
      progress.set(key, {
        status: CourseActivityProgressStatus.COMPLETED,
        completedAt: attempt.submittedAt,
        lastAccessedAt: attempt.submittedAt,
        scorePercent: this.toScorePercent(attempt.score, attempt.totalPoints),
      });
    }

    for (const attempt of examAttempts) {
      const key = this.activityKey(CourseActivityType.EXAM, attempt.examId);
      if (progress.has(key)) {
        continue;
      }
      progress.set(key, {
        status:
          attempt.status === ExamAttemptStatus.SUBMITTED
            ? CourseActivityProgressStatus.COMPLETED
            : CourseActivityProgressStatus.IN_PROGRESS,
        completedAt: attempt.submittedAt,
        lastAccessedAt: attempt.submittedAt ?? attempt.startedAt,
        scorePercent:
          attempt.status === ExamAttemptStatus.SUBMITTED
            ? this.toScorePercent(attempt.score, attempt.totalPoints)
            : null,
      });
    }

    return progress;
  }

  private activityKey(type: CourseActivityType, targetId: string) {
    return `${type}:${targetId}`;
  }

  private toScorePercent(score: number, totalPoints: number) {
    return totalPoints <= 0 ? 0 : Math.round((score / totalPoints) * 100);
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

  private assertBulkEnrollmentSize(userIds: string[]) {
    if (userIds.length <= MAX_BULK_ENROLLMENT_SIZE) {
      return;
    }

    throw new BadRequestException({
      message: `Bulk enrollment is limited to ${MAX_BULK_ENROLLMENT_SIZE} students per request`,
      maxItems: MAX_BULK_ENROLLMENT_SIZE,
      requestedCount: userIds.length,
    });
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
