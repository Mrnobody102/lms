import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AiDraftReviewStatus,
  AiGenerationJobStatus,
  PracticeQuestionType,
  QuestionReviewStatus,
} from '@repo/database';
import { describe, expect, it, vi } from 'vitest';
import { AiQuestionGenerationService } from './ai-question-generation.service';

function createAiServiceStub() {
  return {
    generatePracticeQuestions: vi.fn().mockResolvedValue([
      {
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Choose the greeting',
        options: ['Ni hao', 'Zai jian'],
        correctAnswer: 0,
        explanation: 'Ni hao is a greeting.',
        skillTags: ['VOCABULARY'],
      },
    ]),
  };
}

describe('AiQuestionGenerationService', () => {
  it('should create a completed generation job and pending drafts', async () => {
    const aiService = createAiServiceStub();
    const tx = {
      aiGeneratedQuestionDraft: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      aiQuestionGenerationJob: {
        update: vi.fn().mockResolvedValue({ id: 'job-1' }),
      },
    };
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      courseUnit: {
        findFirst: vi.fn(),
      },
      aiQuestionGenerationJob: {
        create: vi.fn().mockResolvedValue({ id: 'job-1' }),
        findFirst: vi.fn().mockResolvedValue({
          id: 'job-1',
          status: AiGenerationJobStatus.COMPLETED,
          drafts: [{ id: 'draft-1' }],
        }),
      },
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const service = new AiQuestionGenerationService(prisma as never, aiService as never);

    const result = await service.createJobAndGenerate('tenant-1', 'admin-1', {
      courseId: 'course-1',
      topic: 'Greetings',
      count: 1,
      questionType: PracticeQuestionType.MULTIPLE_CHOICE,
      skillTags: ['VOCABULARY'],
    });

    expect(prisma.course.findFirst).toHaveBeenCalledWith({
      where: { id: 'course-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true },
    });
    expect(prisma.aiQuestionGenerationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          requestedById: 'admin-1',
          courseId: 'course-1',
          status: AiGenerationJobStatus.RUNNING,
        }),
      }),
    );
    expect(tx.aiGeneratedQuestionDraft.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          tenantId: 'tenant-1',
          jobId: 'job-1',
          courseId: 'course-1',
          correctAnswer: 0,
          skillTags: ['VOCABULARY'],
        }),
      ],
    });
    expect(tx.aiQuestionGenerationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenantId: { id: 'job-1', tenantId: 'tenant-1' } },
        data: expect.objectContaining({ status: AiGenerationJobStatus.COMPLETED }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 'job-1' }));
  });

  it('should mark the job failed when provider output is malformed', async () => {
    const aiService = {
      generatePracticeQuestions: vi.fn().mockResolvedValue([
        {
          type: PracticeQuestionType.MULTIPLE_CHOICE,
          prompt: 'Bad question',
          options: ['A', 'B'],
          correctAnswer: 'A',
          skillTags: [],
        },
      ]),
    };
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      courseUnit: {
        findFirst: vi.fn(),
      },
      aiQuestionGenerationJob: {
        create: vi.fn().mockResolvedValue({ id: 'job-1' }),
        update: vi.fn().mockResolvedValue({ id: 'job-1' }),
      },
      $transaction: vi.fn(),
    };
    const service = new AiQuestionGenerationService(prisma as never, aiService as never);

    await expect(
      service.createJobAndGenerate('tenant-1', 'admin-1', {
        courseId: 'course-1',
        topic: 'Malformed',
        count: 1,
        questionType: PracticeQuestionType.MULTIPLE_CHOICE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.aiQuestionGenerationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenantId: { id: 'job-1', tenantId: 'tenant-1' } },
        data: expect.objectContaining({ status: AiGenerationJobStatus.FAILED }),
      }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should approve a pending draft into an approved practice question', async () => {
    const tx = {
      practiceQuestion: {
        create: vi.fn().mockResolvedValue({ id: 'question-1' }),
      },
      aiGeneratedQuestionDraft: {
        update: vi.fn().mockResolvedValue({ id: 'draft-1', approvedQuestionId: 'question-1' }),
      },
    };
    const prisma = {
      aiGeneratedQuestionDraft: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'draft-1',
          tenantId: 'tenant-1',
          courseId: 'course-1',
          unitId: null,
          type: PracticeQuestionType.MULTIPLE_CHOICE,
          prompt: 'Choose one',
          options: ['A', 'B'],
          correctAnswer: 0,
          explanation: 'A is correct',
          skillTags: ['GRAMMAR'],
          reviewStatus: AiDraftReviewStatus.PENDING_REVIEW,
        }),
      },
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const service = new AiQuestionGenerationService(
      prisma as never,
      createAiServiceStub() as never,
    );

    await service.approveDraft('tenant-1', 'draft-1', 'admin-1');

    expect(prisma.aiGeneratedQuestionDraft.findFirst).toHaveBeenCalledWith({
      where: { id: 'draft-1', tenantId: 'tenant-1' },
    });
    expect(tx.practiceQuestion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        courseId: 'course-1',
        aiGenerated: true,
        reviewStatus: QuestionReviewStatus.APPROVED,
      }),
    });
    expect(tx.aiGeneratedQuestionDraft.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenantId: { id: 'draft-1', tenantId: 'tenant-1' } },
        data: expect.objectContaining({
          reviewStatus: AiDraftReviewStatus.APPROVED,
          reviewedById: 'admin-1',
          approvedQuestionId: 'question-1',
        }),
      }),
    );
  });

  it('should reject cross-tenant draft access', async () => {
    const prisma = {
      aiGeneratedQuestionDraft: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new AiQuestionGenerationService(
      prisma as never,
      createAiServiceStub() as never,
    );

    await expect(service.approveDraft('tenant-2', 'draft-1', 'admin-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.aiGeneratedQuestionDraft.findFirst).toHaveBeenCalledWith({
      where: { id: 'draft-1', tenantId: 'tenant-2' },
    });
  });
});
