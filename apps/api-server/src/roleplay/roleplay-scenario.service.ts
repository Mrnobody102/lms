import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, RoleplayMode } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { CreateRoleplayScenarioDto } from './dto/create-roleplay-scenario.dto';
import { RoleplayScenarioQueryDto } from './dto/roleplay-scenario-query.dto';
import { UpdateRoleplayScenarioDto } from './dto/update-roleplay-scenario.dto';

interface ScenarioActor {
  id: string;
  role: Role;
}

@Injectable()
export class RoleplayScenarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async create(tenantId: string, user: ScenarioActor, dto: CreateRoleplayScenarioDto) {
    await this.learningAccess.ensureAuthoringCourseAccess(dto.courseId, tenantId, user);
    await this.ensureCourse(tenantId, dto.courseId);
    await this.ensureUnit(tenantId, dto.courseId, dto.unitId);

    return this.prisma.roleplayScenario.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        unitId: dto.unitId,
        title: dto.title,
        description: dto.description,
        targetLanguage: dto.targetLanguage ?? 'en-US',
        level: dto.level,
        skillTags: dto.skillTags ?? [],
        mode: dto.mode ?? RoleplayMode.TEXT,
        systemPrompt: dto.systemPrompt,
        openingMessage: dto.openingMessage,
        rubric: this.toNullableJsonInput(dto.rubric),
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async list(tenantId: string, user: ScenarioActor, query: RoleplayScenarioQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.RoleplayScenarioWhereInput = {
      tenantId,
      deletedAt: null,
      courseId: query.courseId,
      unitId: query.unitId,
      mode: query.mode,
      isPublished: query.isPublished,
    };

    // Instructors only see scenarios attached to courses they are assigned to.
    if (user.role === Role.INSTRUCTOR) {
      where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
    }

    const [data, total] = await Promise.all([
      this.prisma.roleplayScenario.findMany({
        where,
        include: {
          course: { select: { id: true, title: true } },
          unit: { select: { id: true, title: true } },
          _count: { select: { sessions: true } },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.roleplayScenario.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async get(tenantId: string, id: string, user?: ScenarioActor) {
    const scenario = await this.prisma.roleplayScenario.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        course: { select: { id: true, title: true } },
        unit: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });

    if (!scenario) {
      throw new NotFoundException(`Roleplay scenario with ID ${id} not found`);
    }

    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(scenario.courseId, tenantId, user);
    }

    return scenario;
  }

  async update(tenantId: string, id: string, user: ScenarioActor, dto: UpdateRoleplayScenarioDto) {
    const scenario = await this.get(tenantId, id, user);
    const courseId = dto.courseId ?? scenario.courseId;
    // When moving the scenario to a different course, the instructor must also
    // be assigned to the destination course.
    await this.learningAccess.ensureAuthoringCourseAccess(courseId, tenantId, user);
    await this.ensureCourse(tenantId, courseId);
    await this.ensureUnit(
      tenantId,
      courseId,
      dto.unitId === undefined ? scenario.unitId : dto.unitId,
    );

    return this.prisma.roleplayScenario.update({
      where: { id_tenantId: { id, tenantId } },
      data: {
        courseId: dto.courseId,
        unitId: dto.unitId,
        title: dto.title,
        description: dto.description,
        targetLanguage: dto.targetLanguage,
        level: dto.level,
        skillTags: dto.skillTags,
        mode: dto.mode,
        systemPrompt: dto.systemPrompt,
        openingMessage: dto.openingMessage,
        rubric: this.toNullableJsonInput(dto.rubric),
        isPublished: dto.isPublished,
      },
    });
  }

  async softDelete(tenantId: string, id: string, user: ScenarioActor) {
    await this.get(tenantId, id, user);
    return this.prisma.roleplayScenario.update({
      where: { id_tenantId: { id, tenantId } },
      data: {
        deletedAt: new Date(),
        isPublished: false,
      },
    });
  }

  async setPublished(tenantId: string, id: string, isPublished: boolean, user: ScenarioActor) {
    await this.get(tenantId, id, user);
    return this.prisma.roleplayScenario.update({
      where: { id_tenantId: { id, tenantId } },
      data: { isPublished },
    });
  }

  async getAvailable(
    tenantId: string,
    user: { id: string; role: Role },
    query: RoleplayScenarioQueryDto,
  ) {
    const courseAccessWhere = query.courseId
      ? { course: this.learningAccess.courseWhere(tenantId, user, query.courseId) }
      : {
          OR: [{ courseId: null }, { course: this.learningAccess.courseWhere(tenantId, user) }],
        };

    const scenarios = await this.prisma.roleplayScenario.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isPublished: true,
        unitId: query.unitId,
        mode: query.mode,
        ...courseAccessWhere,
      },
      include: {
        course: { select: { id: true, title: true } },
        unit: { select: { id: true, title: true } },
      },
      orderBy: [{ course: { title: 'asc' } }, { title: 'asc' }],
    });

    return { data: scenarios };
  }

  async getPublishedForStudent(tenantId: string, user: { id: string; role: Role }, id: string) {
    const scenario = await this.prisma.roleplayScenario.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        isPublished: true,
        OR: [{ courseId: null }, { course: this.learningAccess.courseWhere(tenantId, user) }],
      },
    });

    if (!scenario) {
      throw new NotFoundException(`Roleplay scenario with ID ${id} not found`);
    }

    return scenario;
  }

  private async ensureCourse(tenantId: string, courseId?: string | null) {
    if (!courseId) {
      return;
    }

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }
  }

  private async ensureUnit(tenantId: string, courseId?: string | null, unitId?: string | null) {
    if (!unitId) {
      return;
    }

    if (!courseId) {
      throw new BadRequestException('unitId requires courseId');
    }

    const unit = await this.prisma.courseUnit.findFirst({
      where: { id: unitId, courseId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found in this course`);
    }
  }

  private toNullableJsonInput(value: Record<string, unknown> | undefined) {
    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonObject;
  }
}
