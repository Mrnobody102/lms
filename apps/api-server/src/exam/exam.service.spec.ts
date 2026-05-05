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
    const startedAt = new Date(Date.now() - 5 * 60_000);
    const exam = {
      id: 'exam-1',
      courseId: 'course-1',
      durationMinutes: 30,
      passingScore: 60,
      sections: [
        {
          questions: [
            {
              id: 'question-1',
              type: ExamQuestionType.MULTIPLE_CHOICE,
              prompt: 'Choose one',
              options: ['A', 'B'],
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
          startedAt,
          submittedAt: null,
          exam,
        }),
        update: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          score: 5,
          totalPoints: 5,
          startedAt,
          submittedAt: new Date(),
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
        where: { id_tenantId: { id: 'attempt-1', tenantId: 'tenant-1' } },
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
                answer: 'Ni Hao',
                isCorrect: true,
                pointsAwarded: 3,
              }),
            ],
          },
        }),
      }),
    );
  });

  it('should reject unsupported exam answer shapes before updating attempts', async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000);
    const prisma = {
      examAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          courseId: 'course-1',
          status: ExamAttemptStatus.STARTED,
          startedAt,
          submittedAt: null,
          exam: {
            id: 'exam-1',
            courseId: 'course-1',
            durationMinutes: 30,
            passingScore: 60,
            sections: [
              {
                questions: [
                  {
                    id: 'question-1',
                    type: ExamQuestionType.MULTIPLE_CHOICE,
                    prompt: 'Choose one',
                    options: ['A', 'B'],
                    correctAnswer: 1,
                    explanation: 'B is correct',
                    points: 1,
                  },
                ],
              },
            ],
          },
        }),
        update: vi.fn(),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    await expect(
      service.submitAttempt('attempt-1', 'tenant-1', { id: 'user-1', role: Role.STUDENT }, [
        { questionId: 'question-1', answer: '1' },
      ]),
    ).rejects.toThrow('Multiple-choice answers must be integer option indexes');

    expect(prisma.examAttempt.update).not.toHaveBeenCalled();
  });

  it('should resume an existing active started attempt instead of creating a new one', async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000);
    const exam = {
      id: 'exam-1',
      courseId: 'course-1',
      durationMinutes: 30,
      sections: [
        {
          questions: [
            {
              id: 'question-1',
              type: ExamQuestionType.MULTIPLE_CHOICE,
              prompt: 'Choose one',
              points: 1,
            },
          ],
        },
      ],
    };
    const prisma = {
      exam: {
        findFirst: vi.fn().mockResolvedValue(exam),
      },
      examAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          examId: 'exam-1',
          courseId: 'course-1',
          status: ExamAttemptStatus.STARTED,
          startedAt,
          submittedAt: null,
          createdAt: startedAt,
        }),
        create: vi.fn(),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    const result = await service.startAttempt('exam-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });

    expect(result.resumed).toBe(true);
    expect(result.attempt.id).toBe('attempt-1');
    expect(result.attempt).toHaveProperty('deadlineAt');
    expect(result.attempt.isExpired).toBe(false);
    expect(prisma.examAttempt.create).not.toHaveBeenCalled();
  });

  it('should reject submission when the exam attempt is expired', async () => {
    const startedAt = new Date(Date.now() - 31 * 60_000);
    const prisma = {
      examAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          courseId: 'course-1',
          status: ExamAttemptStatus.STARTED,
          startedAt,
          submittedAt: null,
          exam: {
            id: 'exam-1',
            courseId: 'course-1',
            durationMinutes: 30,
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
                    points: 1,
                  },
                ],
              },
            ],
          },
        }),
        update: vi.fn(),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    await expect(
      service.submitAttempt('attempt-1', 'tenant-1', { id: 'user-1', role: Role.STUDENT }, [
        { questionId: 'question-1', answer: 1 },
      ]),
    ).rejects.toThrow('Exam attempt time has expired');

    expect(prisma.examAttempt.update).not.toHaveBeenCalled();
  });

  it('should hide correct answers and explanations from student exam reads', async () => {
    const prisma = {
      exam: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'exam-1',
          courseId: 'course-1',
          sections: [
            {
              questions: [
                {
                  id: 'question-1',
                  prompt: 'Choose one',
                  correctAnswer: 1,
                  explanation: 'B is correct',
                  points: 1,
                },
              ],
            },
          ],
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    const result = await service.getExam('exam-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });

    expect(result.sections[0].questions[0]).not.toHaveProperty('correctAnswer');
    expect(result.sections[0].questions[0]).not.toHaveProperty('explanation');
  });

  it('should list recent exam attempts with timing metadata for the current student', async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000);
    const prisma = {
      examAttempt: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'attempt-1',
            userId: 'user-1',
            courseId: 'course-1',
            startedAt,
            submittedAt: null,
            exam: {
              id: 'exam-1',
              title: 'Midterm',
              durationMinutes: 30,
              passingScore: 60,
              course: { id: 'course-1', title: 'HSK 1' },
              unit: { id: 'unit-1', title: 'Unit 1' },
            },
          },
        ]),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', userId: 'user-1' }),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    const result = await service.listAttempts('tenant-1', { id: 'user-1', role: Role.STUDENT }, {});

    expect(prisma.examAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1' }),
        take: 10,
      }),
    );
    expect(result[0]).toHaveProperty('deadlineAt');
    expect(result[0].isExpired).toBe(false);
  });

  it('should return exam attempt review with answer metadata and deadline state', async () => {
    const startedAt = new Date(Date.now() - 5 * 60_000);
    const prisma = {
      examAttempt: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'attempt-1',
          courseId: 'course-1',
          startedAt,
          submittedAt: new Date(),
          answers: [
            {
              question: {
                id: 'question-1',
                prompt: 'Choose one',
                correctAnswer: 1,
                explanation: 'B is correct',
              },
            },
          ],
          exam: {
            id: 'exam-1',
            title: 'Midterm',
            durationMinutes: 30,
            passingScore: 60,
            course: { id: 'course-1', title: 'HSK 1' },
            unit: { id: 'unit-1', title: 'Unit 1' },
          },
        }),
      },
    };
    const learningAccess = {
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ExamService(prisma as never, learningAccess as never);

    const result = await service.getAttempt('attempt-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });

    expect(learningAccess.ensureCourseAccess).toHaveBeenCalledWith('course-1', 'tenant-1', {
      id: 'user-1',
      role: Role.STUDENT,
    });
    expect(result.exam.title).toBe('Midterm');
    expect(result).toHaveProperty('deadlineAt');
    expect(result.isExpired).toBe(false);
  });
});
