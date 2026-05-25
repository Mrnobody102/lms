import { describe, expect, it, vi } from 'vitest';
import { PracticeQuestionType, Role } from '@repo/database';
import { PracticeService } from './practice.service';

function createSkillMasteryStub() {
  return {
    applyAnswerEvents: vi.fn().mockResolvedValue(undefined),
    getStudentMastery: vi.fn().mockResolvedValue([]),
  };
}

function createSrsStub() {
  return {
    upsertCardsForAnswers: vi.fn().mockResolvedValue(undefined),
    getQueue: vi.fn().mockResolvedValue([]),
    submitReview: vi.fn(),
    getDueSummary: vi.fn().mockResolvedValue({ dueNow: 0, dueToday: 0, total: 0 }),
  };
}

function createMediaStub() {
  return {
    validateAudioAsset: vi.fn().mockResolvedValue({ id: 'asset-1', status: 'READY' }),
    createPresignedUrl: vi.fn(),
    markUploadComplete: vi.fn(),
  };
}

function createAiServiceStub() {
  return {
    generatePracticeQuestions: vi.fn().mockResolvedValue([]),
    explainAnswer: vi.fn().mockResolvedValue('explanation'),
  };
}

describe('PracticeService', () => {
  it('should create an exercise set with ordered questions after validating course ownership', async () => {
    const tx = {
      practiceExerciseSet: {
        create: vi.fn().mockResolvedValue({ id: 'set-1' }),
        findFirstOrThrow: vi.fn().mockResolvedValue({
          id: 'set-1',
          title: 'Vocabulary practice',
          questions: [],
        }),
      },
      practiceExerciseSetQuestion: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      practiceQuestion: {
        findMany: vi.fn().mockResolvedValue([{ id: 'question-1' }, { id: 'question-2' }]),
      },
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    await expect(
      service.createExerciseSet('tenant-1', {
        courseId: 'course-1',
        title: 'Vocabulary practice',
        questionIds: ['question-1', 'question-2'],
        isPublished: true,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'set-1' }));

    expect(tx.practiceExerciseSetQuestion.createMany).toHaveBeenCalledWith({
      data: [
        {
          tenantId: 'tenant-1',
          exerciseSetId: 'set-1',
          questionId: 'question-1',
          order: 0,
        },
        {
          tenantId: 'tenant-1',
          exerciseSetId: 'set-1',
          questionId: 'question-2',
          order: 1,
        },
      ],
    });
  });

  it('should score submitted answers and persist an attempt snapshot', async () => {
    const exerciseSet = {
      id: 'set-1',
      tenantId: 'tenant-1',
      courseId: 'course-1',
      questions: [
        {
          question: {
            id: 'question-1',
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: 'Choose one',
            options: ['A', 'B'],
            correctAnswer: 1,
            explanation: 'Option 2 is correct',
          },
        },
        {
          question: {
            id: 'question-2',
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Fill blank',
            correctAnswer: 'ni hao',
            explanation: null,
          },
        },
      ],
    };
    const prisma = {
      practiceExerciseSet: {
        findFirst: vi.fn().mockResolvedValue(exerciseSet),
      },
      practiceAttempt: {
        create: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          score: 2,
          totalPoints: 2,
          answers: [],
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    const result = await service.submitAttempt(
      'set-1',
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      [
        { questionId: 'question-1', answer: 1 },
        { questionId: 'question-2', answer: ' Ni Hao ' },
      ],
    );

    expect(result.result).toEqual(
      expect.objectContaining({
        score: 2,
        totalPoints: 2,
        percentage: 100,
      }),
    );
    expect(learningAccess.ensureCourseAccess).toHaveBeenCalledWith('course-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });
    expect(prisma.practiceAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          courseId: 'course-1',
          score: 2,
          totalPoints: 2,
        }),
      }),
    );
  });

  it('should attach aiFeedback for AI-evaluated answers', async () => {
    const exerciseSet = {
      id: 'set-1',
      tenantId: 'tenant-1',
      courseId: 'course-1',
      questions: [
        {
          question: {
            id: 'question-1',
            type: PracticeQuestionType.AI_EVALUATED_TEXT,
            prompt: 'Write a greeting',
            correctAnswer: 'ni hao',
            explanation: null,
          },
        },
      ],
    };
    const prisma = {
      practiceExerciseSet: {
        findFirst: vi.fn().mockResolvedValue(exerciseSet),
      },
      practiceAttempt: {
        create: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          score: 1,
          totalPoints: 1,
          answers: [],
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    const result = await service.submitAttempt(
      'set-1',
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      [{ questionId: 'question-1', answer: 'Ni Hao' }],
    );

    expect(result.result.answers[0]).toEqual(
      expect.objectContaining({
        aiFeedback: expect.objectContaining({
          status: 'AUTO_REVIEWED',
          mode: PracticeQuestionType.AI_EVALUATED_TEXT,
          matched: true,
          transcript: 'Ni Hao',
        }),
      }),
    );
    expect(prisma.practiceAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          answers: expect.objectContaining({
            create: [
              expect.objectContaining({
                aiFeedback: expect.objectContaining({
                  status: 'AUTO_REVIEWED',
                  mode: PracticeQuestionType.AI_EVALUATED_TEXT,
                  matched: true,
                  transcript: 'Ni Hao',
                }),
              }),
            ],
          }),
        }),
      }),
    );
  });

  it('should reject unsupported practice answer shapes before persisting attempts', async () => {
    const prisma = {
      practiceExerciseSet: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'set-1',
          tenantId: 'tenant-1',
          courseId: 'course-1',
          questions: [
            {
              question: {
                id: 'question-1',
                type: PracticeQuestionType.MULTIPLE_CHOICE,
                prompt: 'Choose one',
                options: ['A', 'B'],
                correctAnswer: 1,
                explanation: null,
              },
            },
          ],
        }),
      },
      practiceAttempt: {
        create: vi.fn(),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    await expect(
      service.submitAttempt('set-1', 'tenant-1', { id: 'user-1', role: Role.STUDENT }, [
        { questionId: 'question-1', answer: '1' },
      ]),
    ).rejects.toThrow('Multiple-choice answers must be integer option indexes');

    expect(prisma.practiceAttempt.create).not.toHaveBeenCalled();
  });

  it('should hide correct answers and explanations from student exercise set reads', async () => {
    const prisma = {
      practiceExerciseSet: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'set-1',
          courseId: 'course-1',
          questions: [
            {
              question: {
                id: 'question-1',
                prompt: 'Choose one',
                correctAnswer: 1,
                explanation: 'Option 2 is correct',
              },
            },
          ],
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    const result = await service.getExerciseSet('set-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });

    expect(result.questions[0].question).not.toHaveProperty('correctAnswer');
    expect(result.questions[0].question).not.toHaveProperty('explanation');
  });

  it('should filter approved practice questions by any selected skill tag', async () => {
    const prisma = {
      practiceQuestion: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn(),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    await service.listQuestions('tenant-1', {
      courseId: 'course-1',
      skill: 'VOCABULARY,GRAMMAR,VOCABULARY',
    });

    expect(prisma.practiceQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          courseId: 'course-1',
          skillTags: { hasSome: ['VOCABULARY', 'GRAMMAR'] },
          reviewStatus: 'APPROVED',
          deletedAt: null,
        }),
      }),
    );
  });

  it('should filter visible exercise sets by any selected skill tag', async () => {
    const prisma = {
      practiceExerciseSet: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', userId: 'user-1' }),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    await service.listExerciseSets(
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      { skill: 'VOCABULARY,GRAMMAR' },
    );

    expect(prisma.practiceExerciseSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          isPublished: true,
          course: { tenantId: 'tenant-1', userId: 'user-1' },
          questions: {
            some: {
              question: {
                tenantId: 'tenant-1',
                skillTags: { hasSome: ['VOCABULARY', 'GRAMMAR'] },
              },
            },
          },
        }),
      }),
    );
  });

  it('should list recent practice attempts for the current student', async () => {
    const prisma = {
      practiceAttempt: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'attempt-1',
            userId: 'user-1',
            courseId: 'course-1',
            score: 2,
            totalPoints: 3,
            submittedAt: new Date(),
            exerciseSet: {
              id: 'set-1',
              title: 'Vocabulary',
              course: { id: 'course-1', title: 'IELTS Foundations' },
              unit: { id: 'unit-1', title: 'Unit 1' },
            },
            answers: [
              {
                aiFeedback: {
                  status: 'AUTO_REVIEWED',
                },
                question: {
                  type: PracticeQuestionType.AI_EVALUATED_TEXT,
                },
              },
              {
                aiFeedback: {
                  status: 'PENDING_REVIEW',
                },
                question: {
                  type: PracticeQuestionType.AI_EVALUATED_AUDIO,
                },
              },
              {
                aiFeedback: null,
                question: {
                  type: PracticeQuestionType.MULTIPLE_CHOICE,
                },
              },
            ],
          },
        ]),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', userId: 'user-1' }),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    const result = await service.listAttempts('tenant-1', { id: 'user-1', role: Role.STUDENT }, {});

    expect(prisma.practiceAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1' }),
        take: 10,
        include: expect.objectContaining({
          answers: expect.any(Object),
        }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].exerciseSet.title).toBe('Vocabulary');
    expect(result[0]).toEqual(
      expect.objectContaining({
        stats: {
          answeredCount: 3,
          aiAnsweredCount: 2,
          aiReviewedCount: 1,
          aiPendingCount: 1,
        },
      }),
    );
    expect(result[0]).not.toHaveProperty('answers');
  });

  it('should return a practice attempt review with answers and question metadata', async () => {
    const prisma = {
      practiceAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          courseId: 'course-1',
          score: 1,
          totalPoints: 2,
          answers: [
            {
              aiFeedback: {
                status: 'AUTO_REVIEWED',
                mode: PracticeQuestionType.AI_EVALUATED_TEXT,
                matched: true,
                transcript: 'Ni Hao',
              },
              question: {
                id: 'question-1',
                type: PracticeQuestionType.AI_EVALUATED_TEXT,
                prompt: 'Choose one',
                correctAnswer: 1,
                explanation: 'Option 2 is correct',
              },
            },
          ],
          exerciseSet: {
            id: 'set-1',
            title: 'Vocabulary',
            description: 'Basics',
            course: { id: 'course-1', title: 'IELTS Foundations' },
            unit: { id: 'unit-1', title: 'Unit 1' },
          },
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    const result = await service.getAttempt('attempt-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });

    expect(learningAccess.ensureCourseAccess).toHaveBeenCalledWith('course-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });
    expect(result.exerciseSet.title).toBe('Vocabulary');
    expect(result.answers[0].question.explanation).toBe('Option 2 is correct');
    expect(result.answers[0].aiFeedback).toEqual({
      status: 'AUTO_REVIEWED',
      mode: PracticeQuestionType.AI_EVALUATED_TEXT,
      matched: true,
      transcript: 'Ni Hao',
    });
    expect(result.stats).toEqual({
      answeredCount: 1,
      aiAnsweredCount: 1,
      aiReviewedCount: 1,
      aiPendingCount: 0,
    });
  });

  it('should update a practice question without breaking tenant scoping', async () => {
    const prisma = {
      practiceQuestion: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'question-1',
          courseId: 'course-1',
          type: PracticeQuestionType.MULTIPLE_CHOICE,
          prompt: 'Old prompt',
          options: ['A', 'B'],
          correctAnswer: 1,
          explanation: 'Old explanation',
          skillTags: ['old'],
        }),
        update: vi.fn().mockResolvedValue({
          id: 'question-1',
          prompt: 'New prompt',
        }),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn(),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    await service.updateQuestion('question-1', 'tenant-1', {
      prompt: 'New prompt',
      correctAnswer: 0,
      skillTags: ['grammar'],
    });

    expect(prisma.practiceQuestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenantId: { id: 'question-1', tenantId: 'tenant-1' } },
        data: expect.objectContaining({
          prompt: 'New prompt',
          correctAnswer: 0,
          skillTags: ['grammar'],
        }),
      }),
    );
  });

  it('should soft delete practice questions and unlink them from exercise sets', async () => {
    const tx = {
      practiceExerciseSetQuestion: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      practiceQuestion: {
        update: vi.fn().mockResolvedValue({ id: 'question-1' }),
      },
    };
    const prisma = {
      practiceQuestion: {
        findFirst: vi.fn().mockResolvedValue({ id: 'question-1' }),
      },
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const learningAccess = {
      courseWhere: vi.fn(),
    };
    const service = new PracticeService(
      prisma as never,
      learningAccess as never,
      createSkillMasteryStub() as never,
      createSrsStub() as never,
      createMediaStub() as never,
      createAiServiceStub() as never,
    );

    await service.removeQuestion('question-1', 'tenant-1');

    expect(tx.practiceExerciseSetQuestion.deleteMany).toHaveBeenCalledWith({
      where: { questionId: 'question-1', tenantId: 'tenant-1' },
    });
    expect(tx.practiceQuestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenantId: { id: 'question-1', tenantId: 'tenant-1' } },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      }),
    );
  });
});
