import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AiDraftReviewStatus,
  AiGenerationJobStatus,
  Prisma,
  QuestionReviewStatus,
} from '@repo/database';
import { AiService } from '../ai/ai.service';
import { GeneratedPracticeQuestion } from '../ai/interfaces/ai-provider.interface';
import { PrismaService } from '../common/services/prisma.service';
import { normalizeQuestionPayload } from '../common/utils/answer-validation.util';
import { AiGenerationJobQueryDto } from './dto/ai-generation-job-query.dto';
import { CreateAiQuestionGenerationJobDto } from './dto/create-ai-question-generation-job.dto';
import { UpdateAiQuestionDraftDto } from './dto/update-ai-question-draft.dto';

const PRACTICE_AI_PROMPT_VERSION = 'practice-ai-v1';

@Injectable()
export class AiQuestionGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createJobAndGenerate(
    tenantId: string,
    requestedById: string,
    dto: CreateAiQuestionGenerationJobDto,
  ) {
    await this.ensureCourse(tenantId, dto.courseId);
    await this.ensureUnit(tenantId, dto.courseId, dto.unitId);

    const job = await this.prisma.aiQuestionGenerationJob.create({
      data: {
        tenantId,
        requestedById,
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

    try {
      const generated = await this.aiService.generatePracticeQuestions(tenantId, requestedById, {
        topic: dto.topic,
        context: dto.context,
        count: dto.count,
        questionType: dto.questionType,
        skillTags: dto.skillTags,
      });

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

      return this.getJob(tenantId, job.id);
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

  async listJobs(tenantId: string, query: AiGenerationJobQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AiQuestionGenerationJobWhereInput = {
      tenantId,
      status: query.status,
      courseId: query.courseId,
      unitId: query.unitId,
    };

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

  async getJob(tenantId: string, id: string) {
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

    return job;
  }

  async updateDraft(tenantId: string, id: string, dto: UpdateAiQuestionDraftDto) {
    const draft = await this.getDraft(tenantId, id);
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

  async approveDraft(tenantId: string, id: string, reviewedById: string) {
    const draft = await this.getDraft(tenantId, id);
    this.ensurePendingDraft(draft.reviewStatus);

    const normalized = normalizeQuestionPayload({
      type: draft.type,
      options: draft.options,
      correctAnswer: draft.correctAnswer,
    });

    return this.prisma.$transaction(async (tx) => {
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
          reviewedById,
          reviewedAt: new Date(),
          approvedQuestionId: question.id,
        },
      });
    });
  }

  async rejectDraft(tenantId: string, id: string, reviewedById: string, rejectionReason: string) {
    const draft = await this.getDraft(tenantId, id);
    this.ensurePendingDraft(draft.reviewStatus);

    return this.prisma.aiGeneratedQuestionDraft.update({
      where: { id_tenantId: { id, tenantId } },
      data: {
        reviewStatus: AiDraftReviewStatus.REJECTED,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });
  }

  async bulkApproveDrafts(tenantId: string, ids: string[], reviewedById: string) {
    const results = await Promise.allSettled(
      ids.map((id) => this.approveDraft(tenantId, id, reviewedById)),
    );

    return {
      approved: results.filter((result) => result.status === 'fulfilled').length,
      failed: results.filter((result) => result.status === 'rejected').length,
    };
  }

  async bulkRejectDrafts(
    tenantId: string,
    ids: string[],
    reviewedById: string,
    rejectionReason: string,
  ) {
    const result = await this.prisma.aiGeneratedQuestionDraft.updateMany({
      where: {
        id: { in: ids },
        tenantId,
        reviewStatus: AiDraftReviewStatus.PENDING_REVIEW,
      },
      data: {
        reviewStatus: AiDraftReviewStatus.REJECTED,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    return { rejected: result.count };
  }

  private async getDraft(tenantId: string, id: string) {
    const draft = await this.prisma.aiGeneratedQuestionDraft.findFirst({
      where: { id, tenantId },
    });

    if (!draft) {
      throw new NotFoundException(`AI generated question draft with ID ${id} not found`);
    }

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

  private async ensureCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found in this tenant`);
    }
  }

  private async ensureUnit(tenantId: string, courseId: string, unitId?: string) {
    if (!unitId) {
      return;
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
