import { describe, expect, it, vi } from 'vitest';
import { ExamAttemptStatus, ExamQuestionType, Role } from '@repo/database';
import { ExamService } from './exam.service';

describe('ExamService', () => {
  it('should create an exam with ordered sections and questions after validating course ownership', async () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      exam: {
        create: vi.fn().mockResolvedValue({
          id: 'exam-1',
          title: 'Midterm test',
          sections: [],
        }),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'course-1' }),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    await expect(
      service.createExam('tenant-1', {
        courseId: 'course-1',
        title: 'Midterm test',
        durationMinutes: 45,
        isPublished: true,
        sections: [
          {
            title: 'Vocabulary',
            questions: [
              {
                type: ExamQuestionType.MULTIPLE_CHOICE,
                prompt: 'Choose one',
                options: ['A', 'B'],
                correctAnswer: 1,
                points: 2,
                skillTags: ['vocabulary'],
              },
            ],
          },
        ],
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'exam-1' }));

    expect(prisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          courseId: 'course-1',
          title: 'Midterm test',
          sections: {
            create: [
              expect.objectContaining({
                tenantId: 'tenant-1',
                title: 'Vocabulary',
                order: 0,
                questions: {
                  create: [
                    expect.objectContaining({
                      tenantId: 'tenant-1',
                      prompt: 'Choose one',
                      correctAnswer: 1,
                      points: 2,
                      order: 0,
                    }),
                  ],
                },
              }),
            ],
          },
        }),
      }),
    );
  });

  it('should submit a started attempt, grade answers, and persist answer snapshots', async () => {
    const exam = {
      id: 'exam-1',
      courseId: 'course-1',
      passingScore: 60,
      sections: [
        {
          questions: [
            {
              id: 'question-1',
              type: ExamQuestionType.MULTIPLE_CHOICE,
              prompt: 'Choose one',
              correctAnswer: 1,
              explanation: 'B is correct',
              points: 2,
            },
            {
              id: 'question-2',
              type: ExamQuestionType.FILL_BLANK,
              prompt: 'Fill blank',
              correctAnswer: 'ni hao',
              explanation: null,
              points: 3,
            },
          ],
        },
      ],
    };
    const prisma = {
      examAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          courseId: 'course-1',
          status: ExamAttemptStatus.STARTED,
          exam,
        }),
        update: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          score: 5,
          totalPoints: 5,
          answers: [],
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    const result = await service.submitAttempt(
      'attempt-1',
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      [
        { questionId: 'question-1', answer: 1 },
        { questionId: 'question-2', answer: ' Ni Hao ' },
      ],
    );

    expect(result.result).toEqual(
      expect.objectContaining({
        score: 5,
        totalPoints: 5,
        percentage: 100,
        passed: true,
      }),
    );
    expect(learningAccess.ensureCourseAccess).toHaveBeenCalledWith('course-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });
    expect(prisma.examAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({
          status: ExamAttemptStatus.SUBMITTED,
          score: 5,
          totalPoints: 5,
          answers: {
            create: [
              expect.objectContaining({
                tenantId: 'tenant-1',
                questionId: 'question-1',
                answer: 1,
                isCorrect: true,
                pointsAwarded: 2,
              }),
              expect.objectContaining({
                tenantId: 'tenant-1',
                questionId: 'question-2',
                answer: ' Ni Hao ',
                isCorrect: true,
                pointsAwarded: 3,
              }),
            ],
          },
        }),
      }),
    );
  });
});
