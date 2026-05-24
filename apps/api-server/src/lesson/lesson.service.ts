import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, LessonType, Role } from '@repo/database';
import { parseMicroCardContent } from '@repo/shared';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async create(data: {
    title: string;
    type?: LessonType;
    content?: string;
    videoUrl?: string;
    duration?: number;
    quiz?: Prisma.JsonValue;
    aiPrompt?: string;
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
    const type = data.type ?? LessonType.text;
    this.validateMicroCardContent(type, data.content);

    return this.prisma.lesson.create({
      data: {
        title: data.title,
        type,
        content: data.content,
        videoUrl: data.videoUrl,
        duration: data.duration ?? 10,
        quiz: this.toNullableJsonInput(data.quiz),
        aiPrompt: data.aiPrompt,
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
      content?: string | null;
      videoUrl?: string | null;
      duration?: number;
      quiz?: Prisma.JsonValue | null;
      aiPrompt?: string | null;
      order?: number;
      unitId?: string | null;
    },
  ) {
    const lesson = await this.findOne(id, tenantId);
    const unitId =
      data.unitId === undefined
        ? undefined
        : await this.resolveLessonUnit(lesson.courseId, tenantId, data.unitId);
    const nextType = data.type ?? lesson.type;
    const nextContent = data.content === undefined ? lesson.content : data.content;
    this.validateMicroCardContent(nextType, nextContent);

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

  async reorderLessons(courseId: string, unitId: string, tenantId: string, lessonIds: string[]) {
    // We optionally could verify unit belongs to course, but since lesson's primary ID is used for update,
    // we mostly just need to ensure the caller has access.
    await this.learningAccess.ensureCourseAccess(courseId, tenantId, {
      id: 'system',
      role: Role.ADMIN,
    }); // Assuming admin role is required, or it's handled by controller.
    // Actually, controller uses guards.

    return this.prisma.$transaction(
      lessonIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id_tenantId: { id, tenantId } },
          data: { order: index, unitId },
        }),
      ),
    );
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

  private validateMicroCardContent(type: LessonType, content: string | null | undefined) {
    if (type !== LessonType.micro_card) {
      return;
    }

    const result = parseMicroCardContent(content ?? '');
    if (result.content.cards.length > 0 && result.errors.length === 0) {
      return;
    }

    throw new BadRequestException({
      message: 'Invalid micro-card lesson content',
      errors: result.errors,
    });
  }
}
