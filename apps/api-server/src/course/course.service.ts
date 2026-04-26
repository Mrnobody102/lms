import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

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
    return this.prisma.course.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        totalDuration: data.totalDuration,
        tenantId: data.tenantId,
      },
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
      lessons: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
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

  async update(
    id: string,
    tenantId: string,
    data: { title?: string; slug?: string; description?: string; totalDuration?: number },
  ) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure course exists and belongs to tenant
    await this.findOne(id, tenantId, undefined, { includeInactive: true });

    return this.prisma.course.update({
      where: { id },
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
}
