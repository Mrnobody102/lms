import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { Prisma, LessonType, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async create(data: {
    title: string;
    type?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    quiz?: Prisma.JsonValue;
    order?: number;
    unitId?: string | null;
    courseId: string;
    tenantId: string;
  }) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(data.tenantId, undefined, data.courseId, {
        includeInactive: true,
      }),
    });
    if (!course)
      throw new NotFoundException(`Course with ID ${data.courseId} not found in this tenant`);

    const unitId = await this.resolveLessonUnit(data.courseId, data.tenantId, data.unitId);

    return this.prisma.lesson.create({
      data: {
        title: data.title,
        type: (data.type as LessonType) || 'text',
        content: data.content,
        videoUrl: data.videoUrl,
        duration: data.duration ?? 10,
        quiz: this.toNullableJsonInput(data.quiz),
        order: data.order ?? 0,
        courseId: data.courseId,
        unitId,
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
    await this.learningAccess.ensureCourseAccess(courseId, tenantId, user);

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
    const where = this.learningAccess.lessonWhere(tenantId, user, id);

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
      unitId?: string | null;
    },
  ) {
    const lesson = await this.findOne(id, tenantId);
    const unitId =
      data.unitId === undefined
        ? undefined
        : await this.resolveLessonUnit(lesson.courseId, tenantId, data.unitId);

    const updateData: Prisma.LessonUncheckedUpdateInput = {
      ...data,
      unitId,
      quiz: this.toNullableJsonInput(data.quiz),
    };

    return this.prisma.lesson.update({
      where: { id_tenantId: { id, tenantId } },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string) {
    // Ensure lesson exists and belongs to tenant
    await this.findOne(id, tenantId);

    return this.prisma.lesson.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  private async resolveLessonUnit(
    courseId: string,
    tenantId: string,
    unitId: string | null | undefined,
  ) {
    if (unitId === null) {
      return null;
    }

    if (unitId) {
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

      return unit.id;
    }

    const defaultUnit = await this.prisma.courseUnit.findFirst({
      where: {
        courseId,
        tenantId,
        deletedAt: null,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });

    return defaultUnit?.id ?? null;
  }

  private toNullableJsonInput(value: Prisma.JsonValue | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}
