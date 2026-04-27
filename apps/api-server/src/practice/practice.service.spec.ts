import { describe, expect, it, vi } from 'vitest';
import { PracticeQuestionType, Role } from '@repo/database';
import { PracticeService } from './practice.service';

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
    const service = new PracticeService(prisma as never, learningAccess as never);

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
    const service = new PracticeService(prisma as never, learningAccess as never);

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
});
