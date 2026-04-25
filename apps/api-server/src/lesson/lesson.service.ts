import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EnrollmentStatus, Prisma, LessonType, Role } from '@repo/database';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    type?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    quiz?: Prisma.JsonValue;
    order?: number;
    courseId: string;
    tenantId: string;
  }) {
    // Ensure course belongs to tenant
    const course = await this.prisma.course.findFirst({
      where: { id: data.courseId, tenantId: data.tenantId, deletedAt: null, isActive: true },
    });
    if (!course)
      throw new NotFoundException(`Course with ID ${data.courseId} not found in this tenant`);

    return this.prisma.lesson.create({
      data: {
        title: data.title,
        type: (data.type as LessonType) || 'text',
        content: data.content,
        videoUrl: data.videoUrl,
        duration: data.duration || 10,
        quiz: data.quiz ? data.quiz : undefined,
        order: data.order || 0,
        courseId: data.courseId,
        tenantId: data.tenantId,
      },
    });
  }

  async findAll(
    courseId: string,
    tenantId: string,
    user: { id: string; role: Role },
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    await this.ensureCourseAccess(courseId, tenantId, user);

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { courseId, tenantId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      this.prisma.lesson.count({ where: { courseId, tenantId, deletedAt: null } }),
    ]);

    return {
      data: lessons,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string, user?: { id: string; role: Role }) {
    const where: Prisma.LessonWhereInput = { id, tenantId, deletedAt: null };
    if (user?.role === Role.STUDENT) {
      where.course = {
        deletedAt: null,
        isActive: true,
        enrollments: {
          some: {
            userId: user.id,
            tenantId,
            status: EnrollmentStatus.ACTIVE,
          },
        },
      };
    }

    const lesson = await this.prisma.lesson.findFirst({ where });
    if (!lesson) throw new NotFoundException(`Lesson with ID ${id} not found in this tenant`);
    return lesson;
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      title?: string;
      type?: LessonType;
      content?: string;
      videoUrl?: string;
      duration?: number;
      quiz?: Prisma.JsonValue | null;
      order?: number;
    },
  ) {
    await this.findOne(id, tenantId);

    const updateData: Prisma.LessonUpdateInput = {
      ...data,
      quiz: data.quiz === null ? undefined : data.quiz,
    };

    return this.prisma.lesson.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure lesson exists and belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureCourseAccess(
    courseId: string,
    tenantId: string,
    user: { id: string; role: Role },
  ) {
    const where: Prisma.CourseWhereInput = {
      id: courseId,
      tenantId,
      deletedAt: null,
      isActive: true,
    };

    if (user.role === Role.STUDENT) {
      where.enrollments = {
        some: {
          userId: user.id,
          tenantId,
          status: EnrollmentStatus.ACTIVE,
        },
      };
    }

    const course = await this.prisma.course.findFirst({
      where,
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }
  }
}
