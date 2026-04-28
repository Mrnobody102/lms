import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

type EnrollmentLearnerStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async create(data: {
    title: string;
    tenantId: string;
    slug?: string;
    description?: string;
    totalDuration?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          totalDuration: data.totalDuration,
          tenantId: data.tenantId,
        },
      });

      await tx.courseUnit.create({
        data: {
          title: 'General',
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
    data: { title?: string; slug?: string; description?: string; totalDuration?: number },
  ) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    return this.prisma.course.update({
      where: { id_tenantId: { id, tenantId } },
      data,
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

  async enrollStudent(courseId: string, tenantId: string, userId: string) {
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

    return this.prisma.courseEnrollment.upsert({
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
  }

  async unenrollStudent(courseId: string, tenantId: string, userId: string) {
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

    return this.prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.REVOKED,
        unenrolledAt: new Date(),
      },
    });
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
}
