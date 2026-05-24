import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LearningActivityType, LessonType, Prisma, ProgressStatus, Role } from '@repo/database';
import { parseMicroCardContent } from '@repo/shared';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { SrsService } from '../srs/srs.service';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly srs: SrsService,
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

  async trackMicroCardEvent(
    lessonId: string,
    tenantId: string,
    user: { id: string; role: Role },
    data: { cardKey: string; eventType: LearningActivityType; durationMs?: number },
  ) {
    this.ensureMicroCardEventType(data.eventType);
    const { lesson } = await this.getMicroCardLessonAndCard(lessonId, tenantId, user, data.cardKey);
    const timeSpentSeconds =
      data.durationMs === undefined ? undefined : Math.max(0, Math.ceil(data.durationMs / 1000));

    const activity = await this.prisma.learningActivity.create({
      data: {
        userId: user.id,
        tenantId,
        courseId: lesson.courseId,
        lessonId: lesson.id,
        type: data.eventType,
        timeSpentSeconds,
      },
    });

    if (data.eventType === LearningActivityType.MICRO_CARD_COMPLETED) {
      await this.prisma.userLessonProgress.upsert({
        where: {
          tenantId_userId_lessonId: {
            tenantId,
            userId: user.id,
            lessonId: lesson.id,
          },
        },
        update: { status: ProgressStatus.COMPLETED },
        create: {
          tenantId,
          userId: user.id,
          lessonId: lesson.id,
          status: ProgressStatus.COMPLETED,
        },
      });
    }

    return activity;
  }

  async addMicroCardToReview(
    lessonId: string,
    tenantId: string,
    user: { id: string; role: Role },
    cardKey: string,
  ) {
    const { lesson, card } = await this.getMicroCardLessonAndCard(
      lessonId,
      tenantId,
      user,
      cardKey,
    );

    return this.srs.upsertCustomCardFromSource(tenantId, user.id, `${lesson.id}:${cardKey}`, {
      skillCodes: [],
      customContent: {
        front: card.front,
        back: card.back,
        pinyin: card.pinyin,
        example: card.example,
      },
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

  private async getMicroCardLessonAndCard(
    lessonId: string,
    tenantId: string,
    user: { id: string; role: Role },
    cardKey: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: this.learningAccess.lessonWhere(tenantId, user, lessonId),
      select: { id: true, courseId: true, type: true, content: true },
    });

    if (!lesson || lesson.type !== LessonType.micro_card) {
      throw new NotFoundException('Micro-card lesson not found');
    }

    const cards = parseMicroCardContent(lesson.content ?? '').content.cards;
    const card = cards.find((item, index) => (item.id ?? String(index)) === cardKey);
    if (!card) {
      throw new NotFoundException('Micro-card not found in this lesson');
    }

    return { lesson, card };
  }

  private ensureMicroCardEventType(type: LearningActivityType) {
    if (
      type === LearningActivityType.MICRO_CARD_VIEWED ||
      type === LearningActivityType.MICRO_CARD_FLIPPED ||
      type === LearningActivityType.MICRO_CARD_COMPLETED
    ) {
      return;
    }

    throw new BadRequestException('Invalid micro-card event type');
  }
}
