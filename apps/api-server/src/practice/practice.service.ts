import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PracticeQuestionType, Prisma, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import {
  isNormalizedAnswerCorrect,
  normalizeQuestionPayload,
  normalizeSubmittedAnswer,
} from '../common/utils/answer-validation.util';
import { AiEvaluationService, type PracticeAiFeedback } from './ai-evaluation.service';

interface PracticeUser {
  id: string;
  role: Role;
}

interface SubmittedAnswer {
  questionId: string;
  answer: unknown;
}

interface AttemptAnswerForStats {
  aiFeedback?: unknown;
  question: {
    type: PracticeQuestionType;
  };
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly aiEvaluation: AiEvaluationService = new AiEvaluationService(),
  ) {}

  async createQuestion(
    tenantId: string,
    data: {
      courseId: string;
      unitId?: string;
      type: PracticeQuestionType;
      prompt: string;
      options?: unknown;
      correctAnswer: unknown;
      explanation?: string;
      skillTags?: string[];
    },
  ) {
    await this.ensureCourse(tenantId, data.courseId);
    await this.ensureUnit(tenantId, data.courseId, data.unitId);
    const questionPayload = normalizeQuestionPayload({
      type: data.type,
      options: data.options,
      correctAnswer: data.correctAnswer,
    });

    return this.prisma.practiceQuestion.create({
      data: {
        tenantId,
        courseId: data.courseId,
        unitId: data.unitId,
        type: data.type,
        prompt: data.prompt,
        options:
          questionPayload.options === undefined
            ? undefined
            : (questionPayload.options as Prisma.InputJsonValue),
        correctAnswer: questionPayload.correctAnswer as Prisma.InputJsonValue,
        explanation: data.explanation,
        skillTags: data.skillTags ?? [],
      },
    });
  }

  async listQuestions(tenantId: string, query: { courseId?: string; unitId?: string }) {
    return this.prisma.practiceQuestion.findMany({
      where: {
        tenantId,
        courseId: query.courseId,
        unitId: query.unitId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExerciseSet(
    tenantId: string,
    data: {
      courseId: string;
      unitId?: string;
      title: string;
      description?: string;
      isPublished?: boolean;
      questionIds: string[];
    },
  ) {
    await this.ensureCourse(tenantId, data.courseId);
    await this.ensureUnit(tenantId, data.courseId, data.unitId);
    const questions = await this.findValidQuestions(tenantId, data.courseId, data.questionIds);

    return this.prisma.$transaction(async (tx) => {
      const exerciseSet = await tx.practiceExerciseSet.create({
        data: {
          tenantId,
          courseId: data.courseId,
          unitId: data.unitId,
          title: data.title,
          description: data.description,
          isPublished: data.isPublished ?? false,
        },
      });

      await tx.practiceExerciseSetQuestion.createMany({
        data: questions.map((question, index) => ({
          tenantId,
          exerciseSetId: exerciseSet.id,
          questionId: question.id,
          order: index,
        })),
      });

      return tx.practiceExerciseSet.findFirstOrThrow({
        where: { id: exerciseSet.id, tenantId },
        include: this.exerciseSetInclude(true),
      });
    });
  }

  async listExerciseSets(
    tenantId: string,
    user: PracticeUser,
    query: { courseId?: string; unitId?: string },
  ) {
    const where: Prisma.PracticeExerciseSetWhereInput = {
      tenantId,
      courseId: query.courseId,
      unitId: query.unitId,
      deletedAt: null,
    };

    if (user.role === Role.STUDENT) {
      where.isPublished = true;
      where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
    }

    return this.prisma.practiceExerciseSet.findMany({
      where,
      include: {
        _count: { select: { questions: true, attempts: true } },
        course: { select: { id: true, title: true } },
        unit: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExerciseSet(id: string, tenantId: string, user: PracticeUser) {
    const exerciseSet = await this.prisma.practiceExerciseSet.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
      },
      include: this.exerciseSetInclude(user.role !== Role.STUDENT),
    });

    if (!exerciseSet) {
      throw new NotFoundException(`Practice exercise set with ID ${id} not found`);
    }

    await this.learningAccess.ensureCourseAccess(exerciseSet.courseId, tenantId, user);
    return user.role === Role.STUDENT ? this.hideAnswers(exerciseSet) : exerciseSet;
  }

  async listAttempts(
    tenantId: string,
    user: PracticeUser,
    query: { courseId?: string; exerciseSetId?: string; limit?: number },
  ) {
    const where: Prisma.PracticeAttemptWhereInput = {
      tenantId,
      courseId: query.courseId,
      exerciseSetId: query.exerciseSetId,
    };

    if (user.role === Role.STUDENT) {
      where.userId = user.id;
      where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
    }

    const attempts = await this.prisma.practiceAttempt.findMany({
      where,
      include: {
        exerciseSet: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
          },
        },
        answers: {
          select: {
            aiFeedback: true,
            question: { select: { type: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: query.limit ?? 10,
    });

    const attemptSummaries = attempts.map((attempt) => this.toAttemptSummary(attempt));

    if (user.role === Role.STUDENT) {
      return attemptSummaries;
    }

    return Promise.all(
      attemptSummaries.map(async (attempt) => {
        await this.learningAccess.ensureCourseAccess(attempt.courseId, tenantId, user);
        return attempt;
      }),
    );
  }

  async getAttempt(attemptId: string, tenantId: string, user: PracticeUser) {
    const attempt = await this.prisma.practiceAttempt.findFirst({
      where: {
        id: attemptId,
        tenantId,
        ...(user.role === Role.STUDENT ? { userId: user.id } : {}),
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                prompt: true,
                type: true,
                options: true,
                correctAnswer: true,
                explanation: true,
                skillTags: true,
              },
            },
          },
        },
        exerciseSet: {
          select: {
            id: true,
            title: true,
            description: true,
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Practice attempt with ID ${attemptId} not found`);
    }

    await this.learningAccess.ensureCourseAccess(attempt.courseId, tenantId, user);
    return {
      ...attempt,
      stats: this.buildAttemptStats(attempt.answers),
    };
  }

  async submitAttempt(
    exerciseSetId: string,
    tenantId: string,
    user: PracticeUser,
    answers: SubmittedAnswer[],
  ) {
    const exerciseSet = await this.prisma.practiceExerciseSet.findFirst({
      where: {
        id: exerciseSetId,
        tenantId,
        isPublished: true,
        deletedAt: null,
      },
      include: this.exerciseSetInclude(true, true),
    });

    if (!exerciseSet) {
      throw new NotFoundException(`Practice exercise set with ID ${exerciseSetId} not found`);
    }

    await this.learningAccess.ensureCourseAccess(exerciseSet.courseId, tenantId, user);

    const questions = exerciseSet.questions.map((link) => link.question);
    if (questions.length === 0) {
      throw new BadRequestException('Practice exercise set has no questions');
    }

    const unknownQuestion = answers.find(
      (answer) => !questions.some((question) => question.id === answer.questionId),
    );
    if (unknownQuestion) {
      throw new BadRequestException(`Question ${unknownQuestion.questionId} is not in this set`);
    }
    if (new Set(answers.map((answer) => answer.questionId)).size !== answers.length) {
      throw new BadRequestException('Duplicate answers are not allowed');
    }

    const answerByQuestion = new Map(
      answers.map((submittedAnswer) => {
        const question = questions.find((entry) => entry.id === submittedAnswer.questionId)!;
        return [
          submittedAnswer.questionId,
          normalizeSubmittedAnswer({
            type: question.type,
            answer: submittedAnswer.answer,
            options: question.options,
          }),
        ];
      }),
    );

    const results = await Promise.all(
      questions.map(async (question) => {
        const answer = answerByQuestion.get(question.id);
        const isCorrect = answer === undefined ? false : this.scoreAnswer(question, answer);
        const aiFeedback = await this.buildAiFeedback({
          question,
          answer,
          courseTitle: exerciseSet.course?.title,
          courseAiSettings: exerciseSet.course?.aiSettings,
        });

        return {
          questionId: question.id,
          prompt: question.prompt,
          answer: answer ?? null,
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          aiFeedback,
        };
      }),
    );
    const score = results.filter((result) => result.isCorrect).length;

    const attempt = await this.prisma.practiceAttempt.create({
      data: {
        tenantId,
        userId: user.id,
        courseId: exerciseSet.courseId,
        exerciseSetId: exerciseSet.id,
        score,
        totalPoints: questions.length,
        answers: {
          create: results
            .filter((result) => result.answer !== null)
            .map((result) => ({
              tenantId,
              questionId: result.questionId,
              answer: result.answer as Prisma.InputJsonValue,
              isCorrect: result.isCorrect,
              ...(result.aiFeedback
                ? { aiFeedback: result.aiFeedback as unknown as Prisma.InputJsonValue }
                : {}),
            })),
        },
      },
      include: {
        answers: true,
      },
    });

    return {
      attempt,
      result: {
        score,
        totalPoints: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        answers: results,
      },
    };
  }

  private async ensureCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: this.learningAccess.courseWhere(tenantId, undefined, courseId, {
        includeInactive: true,
      }),
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
      where: {
        id: unitId,
        tenantId,
        courseId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found in this course`);
    }
  }

  private async findValidQuestions(tenantId: string, courseId: string, questionIds: string[]) {
    const uniqueQuestionIds = [...new Set(questionIds)];
    const questions = await this.prisma.practiceQuestion.findMany({
      where: {
        id: { in: uniqueQuestionIds },
        tenantId,
        courseId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (questions.length !== uniqueQuestionIds.length) {
      throw new BadRequestException('One or more questions do not belong to this course');
    }

    return uniqueQuestionIds.map((id) => questions.find((question) => question.id === id)!);
  }

  private exerciseSetInclude(includeCorrectAnswers: boolean, includeCourseAiSettings = false) {
    return {
      course: {
        select: includeCourseAiSettings
          ? { id: true, title: true, aiSettings: true }
          : { id: true, title: true },
      },
      unit: { select: { id: true, title: true } },
      questions: {
        orderBy: { order: 'asc' as const },
        include: {
          question: {
            select: {
              id: true,
              type: true,
              prompt: true,
              options: true,
              skillTags: true,
              ...(includeCorrectAnswers ? { correctAnswer: true, explanation: true } : {}),
            },
          },
        },
      },
    };
  }

  private hideAnswers<T extends { questions: Array<{ question: Record<string, unknown> }> }>(
    exerciseSet: T,
  ) {
    return {
      ...exerciseSet,
      questions: exerciseSet.questions.map((link) => {
        const {
          correctAnswer: _correctAnswer,
          explanation: _explanation,
          ...question
        } = link.question;
        return { ...link, question };
      }),
    };
  }

  private scoreAnswer(
    question: { type: PracticeQuestionType; correctAnswer: unknown },
    answer: number | string,
  ) {
    return isNormalizedAnswerCorrect({
      type: question.type,
      answer,
      correctAnswer: question.correctAnswer,
    });
  }

  private async buildAiFeedback(input: {
    question: {
      type: PracticeQuestionType;
      prompt: string;
      correctAnswer: unknown;
      skillTags?: string[];
    };
    answer: number | string | undefined;
    courseTitle?: string;
    courseAiSettings?: unknown;
  }): Promise<PracticeAiFeedback | undefined> {
    const { question, answer } = input;

    if (
      answer === undefined ||
      typeof answer !== 'string' ||
      !this.aiEvaluation.supportsPracticeQuestion(question.type)
    ) {
      return undefined;
    }

    return this.aiEvaluation.evaluatePracticeAnswer({
      type: question.type,
      answer,
      correctAnswer: question.correctAnswer,
      questionPrompt: question.prompt,
      skillTags: question.skillTags,
      courseTitle: input.courseTitle,
      courseAiSettings: input.courseAiSettings,
    });
  }

  private toAttemptSummary<T extends { answers?: AttemptAnswerForStats[] }>(attempt: T) {
    const { answers = [], ...summary } = attempt;
    return {
      ...summary,
      stats: this.buildAttemptStats(answers),
    };
  }

  private buildAttemptStats(answers: AttemptAnswerForStats[] = []) {
    const aiAnswers = answers.filter((answer) => this.isAiQuestion(answer.question.type));
    const aiReviewedCount = aiAnswers.filter(
      (answer) => this.getAiFeedbackStatus(answer.aiFeedback) === 'AUTO_REVIEWED',
    ).length;

    return {
      answeredCount: answers.length,
      aiAnsweredCount: aiAnswers.length,
      aiReviewedCount,
      aiPendingCount: Math.max(aiAnswers.length - aiReviewedCount, 0),
    };
  }

  private isAiQuestion(type: PracticeQuestionType) {
    return (
      type === PracticeQuestionType.AI_EVALUATED_AUDIO ||
      type === PracticeQuestionType.AI_EVALUATED_TEXT
    );
  }

  private getAiFeedbackStatus(value: unknown) {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    const status = (value as Record<string, unknown>).status;
    return status === 'AUTO_REVIEWED' || status === 'PENDING_REVIEW' ? status : undefined;
  }
}
