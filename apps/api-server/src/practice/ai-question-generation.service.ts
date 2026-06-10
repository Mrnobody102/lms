import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AiDraftReviewStatus,
  AiGenerationJobStatus,
  Prisma,
  QuestionReviewStatus,
  Role,
} from '@repo/database';
import { AI_PROMPT_VERSIONS } from '../ai/ai-governance.constants';
import { AiService } from '../ai/ai.service';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { GeneratedPracticeQuestion } from '../ai/interfaces/ai-provider.interface';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { normalizeQuestionPayload } from '../common/utils/answer-validation.util';
import { AiGenerationJobQueryDto } from './dto/ai-generation-job-query.dto';
import { CreateAiQuestionGenerationJobDto } from './dto/create-ai-question-generation-job.dto';
import { UpdateAiQuestionDraftDto } from './dto/update-ai-question-draft.dto';

const PRACTICE_AI_PROMPT_VERSION = AI_PROMPT_VERSIONS.practiceGenerate;

interface PracticeAiActor {
  id: string;
  role: Role;
}

@Injectable()
export class AiQuestionGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly learningAccess: LearningAccessService,
    private readonly auditLog: AuditLogService,
  ) {}

  async createJobAndGenerate(
    tenantId: string,
    user: PracticeAiActor,
    dto: CreateAiQuestionGenerationJobDto,
  ) {
    await this.learningAccess.ensureAuthoringCourseAccess(dto.courseId, tenantId, user);
    await this.ensureCourse(tenantId, dto.courseId);
    await this.ensureUnit(tenantId, dto.courseId, dto.unitId);

    const job = await this.prisma.aiQuestionGenerationJob.create({
      data: {
        tenantId,
        requestedById: user.id,
        courseId: dto.courseId,
        unitId: dto.unitId,
        topic: dto.topic,
        context: dto.context,
        questionType: dto.questionType,
        requestedCount: dto.count,
        skillTags: dto.skillTags ?? [],
        sourceReason: dto.sourceReason,
        promptVersion: PRACTICE_AI_PROMPT_VERSION,
        status: AiGenerationJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      action: AuditAction.AI_GENERATION_JOB_CREATE,
      status: AuditStatus.SUCCESS,
      metadata: {
        jobId: job.id,
        courseId: dto.courseId,
        unitId: dto.unitId,
        questionType: dto.questionType,
        requestedCount: dto.count,
        promptVersion: PRACTICE_AI_PROMPT_VERSION,
      },
    });

    try {
      const generated = await this.aiService.generatePracticeQuestions(
        tenantId,
        user.id,
        user.role,
        {
          topic: dto.topic,
          context: dto.context,
          count: dto.count,
          questionType: dto.questionType,
          skillTags: dto.skillTags,
        },
        job.id,
      );

      if (generated.length === 0) {
        throw new BadRequestException('AI provider returned no practice questions');
      }

      const draftData = generated.map((question) =>
        this.toDraftCreateInput(tenantId, job.id, dto, question),
      );

      await this.prisma.$transaction(async (tx) => {
        if (draftData.length > 0) {
          await tx.aiGeneratedQuestionDraft.createMany({ data: draftData });
        }

        await tx.aiQuestionGenerationJob.update({
          where: { id_tenantId: { id: job.id, tenantId } },
          data: {
            status: AiGenerationJobStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      });

      return this.getJob(tenantId, job.id, user);
    } catch (error) {
      await this.prisma.aiQuestionGenerationJob.update({
        where: { id_tenantId: { id: job.id, tenantId } },
        data: {
          status: AiGenerationJobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'AI generation failed',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async listJobs(tenantId: string, user: PracticeAiActor, query: AiGenerationJobQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AiQuestionGenerationJobWhereInput = {
      tenantId,
      status: query.status,
      courseId: query.courseId,
      unitId: query.unitId,
    };

    // Instructors only see generation jobs for courses they are assigned to.
    if (user.role === Role.INSTRUCTOR) {
      where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
    }

    const [data, total] = await Promise.all([
      this.prisma.aiQuestionGenerationJob.findMany({
        where,
        include: {
          course: { select: { id: true, title: true } },
          unit: { select: { id: true, title: true } },
          _count: { select: { drafts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiQuestionGenerationJob.count({ where }),
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

  async getJob(tenantId: string, id: string, user: PracticeAiActor) {
    const job = await this.prisma.aiQuestionGenerationJob.findFirst({
      where: { id, tenantId },
      include: {
        course: { select: { id: true, title: true } },
        unit: { select: { id: true, title: true } },
        drafts: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!job) {
      throw new NotFoundException(`AI generation job with ID ${id} not found`);
    }

    await this.learningAccess.ensureAuthoringCourseAccess(job.courseId, tenantId, user);

    return job;
  }

  async updateDraft(
    tenantId: string,
    id: string,
    user: PracticeAiActor,
    dto: UpdateAiQuestionDraftDto,
  ) {
    const draft = await this.getDraft(tenantId, id, user);
    this.ensurePendingDraft(draft.reviewStatus);

    const normalized = normalizeQuestionPayload({
      type: dto.type ?? draft.type,
      options: dto.options === undefined ? draft.options : dto.options,
      correctAnswer: dto.correctAnswer === undefined ? draft.correctAnswer : dto.correctAnswer,
    });

    return this.prisma.aiGeneratedQuestionDraft.update({
      where: { id_tenantId: { id, tenantId } },
      data: {
        type: dto.type ?? draft.type,
        prompt: dto.prompt ?? draft.prompt,
        options:
          normalized.options === undefined
            ? Prisma.DbNull
            : (normalized.options as Prisma.InputJsonValue),
        correctAnswer: normalized.correctAnswer as Prisma.InputJsonValue,
        explanation: dto.explanation === undefined ? draft.explanation : dto.explanation,
        skillTags: dto.skillTags ?? draft.skillTags,
        difficulty: dto.difficulty === undefined ? draft.difficulty : dto.difficulty,
        validationIssues: Prisma.DbNull,
      },
    });
  }

  async approveDraft(tenantId: string, id: string, user: PracticeAiActor) {
    const draft = await this.getDraft(tenantId, id, user);
    this.ensurePendingDraft(draft.reviewStatus);

    const normalized = normalizeQuestionPayload({
      type: draft.type,
      options: draft.options,
      correctAnswer: draft.correctAnswer,
    });

    const approved = await this.prisma.$transaction(async (tx) => {
      const question = await tx.practiceQuestion.create({
        data: {
          tenantId,
          courseId: draft.courseId,
          unitId: draft.unitId,
          type: draft.type,
          prompt: draft.prompt,
          options:
            normalized.options === undefined
              ? undefined
              : (normalized.options as Prisma.InputJsonValue),
          correctAnswer: normalized.correctAnswer as Prisma.InputJsonValue,
          explanation: draft.explanation,
          skillTags: draft.skillTags,
          aiGenerated: true,
          reviewStatus: QuestionReviewStatus.APPROVED,
        },
      });

      return tx.aiGeneratedQuestionDraft.update({
        where: { id_tenantId: { id, tenantId } },
        data: {
          reviewStatus: AiDraftReviewStatus.APPROVED,
          reviewedById: user.id,
          reviewedAt: new Date(),
          approvedQuestionId: question.id,
        },
      });
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      action: AuditAction.AI_DRAFT_APPROVE,
      status: AuditStatus.SUCCESS,
      metadata: {
        draftId: id,
        approvedQuestionId: approved.approvedQuestionId,
      },
    });

    return approved;
  }

  async rejectDraft(tenantId: string, id: string, user: PracticeAiActor, rejectionReason: string) {
    const draft = await this.getDraft(tenantId, id, user);
    this.ensurePendingDraft(draft.reviewStatus);

    const rejected = await this.prisma.aiGeneratedQuestionDraft.update({
      where: { id_tenantId: { id, tenantId } },
      data: {
        reviewStatus: AiDraftReviewStatus.REJECTED,
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      action: AuditAction.AI_DRAFT_REJECT,
      status: AuditStatus.SUCCESS,
      metadata: {
        draftId: id,
        rejectionReason,
      },
    });

    return rejected;
  }

  async bulkApproveDrafts(tenantId: string, ids: string[], user: PracticeAiActor) {
    const results = await Promise.allSettled(
      ids.map((id) => this.approveDraft(tenantId, id, user)),
    );

    return {
      approved: results.filter((result) => result.status === 'fulfilled').length,
      failed: results.filter((result) => result.status === 'rejected').length,
    };
  }

  async bulkRejectDrafts(
    tenantId: string,
    ids: string[],
    user: PracticeAiActor,
    rejectionReason: string,
  ) {
    // Instructors may only reject drafts within their assigned courses; reuse
    // the per-draft access gate so the bulk path can't widen their scope.
    if (user.role === Role.INSTRUCTOR) {
      const results = await Promise.allSettled(
        ids.map((id) => this.rejectDraft(tenantId, id, user, rejectionReason)),
      );
      return { rejected: results.filter((result) => result.status === 'fulfilled').length };
    }

    const result = await this.prisma.aiGeneratedQuestionDraft.updateMany({
      where: {
        id: { in: ids },
        tenantId,
        reviewStatus: AiDraftReviewStatus.PENDING_REVIEW,
      },
      data: {
        reviewStatus: AiDraftReviewStatus.REJECTED,
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    return { rejected: result.count };
  }

  private async getDraft(tenantId: string, id: string, user: PracticeAiActor) {
    const draft = await this.prisma.aiGeneratedQuestionDraft.findFirst({
      where: { id, tenantId },
    });

    if (!draft) {
      throw new NotFoundException(`AI generated question draft with ID ${id} not found`);
    }

    await this.learningAccess.ensureAuthoringCourseAccess(draft.courseId, tenantId, user);

    return draft;
  }

  private toDraftCreateInput(
    tenantId: string,
    jobId: string,
    dto: CreateAiQuestionGenerationJobDto,
    question: GeneratedPracticeQuestion,
  ): Prisma.AiGeneratedQuestionDraftCreateManyInput {
    const normalized = normalizeQuestionPayload({
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer,
    });

    return {
      tenantId,
      jobId,
      courseId: dto.courseId,
      unitId: dto.unitId,
      type: question.type,
      prompt: question.prompt,
      options:
        normalized.options === undefined
          ? undefined
          : (normalized.options as Prisma.InputJsonValue),
      correctAnswer: normalized.correctAnswer as Prisma.InputJsonValue,
      explanation: question.explanation,
      skillTags: question.skillTags ?? [],
      rawProviderPayload: this.toJsonInput(question),
    };
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

  private ensurePendingDraft(status: AiDraftReviewStatus) {
    if (status === AiDraftReviewStatus.PENDING_REVIEW) {
      return;
    }

    throw new BadRequestException(`Only pending AI question drafts can be reviewed or edited`);
  }

  private toJsonInput(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
