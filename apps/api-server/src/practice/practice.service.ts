import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PracticeQuestionType, Prisma, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';

interface PracticeUser {
  id: string;
  role: Role;
}

interface SubmittedAnswer {
  questionId: string;
  answer: unknown;
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
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

    return this.prisma.practiceQuestion.create({
      data: {
        tenantId,
        courseId: data.courseId,
        unitId: data.unitId,
        type: data.type,
        prompt: data.prompt,
        options: data.options === undefined ? undefined : (data.options as Prisma.InputJsonValue),
        correctAnswer: data.correctAnswer as Prisma.InputJsonValue,
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
      include: this.exerciseSetInclude(true),
    });

    if (!exerciseSet) {
      throw new NotFoundException(`Practice exercise set with ID ${exerciseSetId} not found`);
    }

    await this.learningAccess.ensureCourseAccess(exerciseSet.courseId, tenantId, user);

    const questions = exerciseSet.questions.map((link) => link.question);
    if (questions.length === 0) {
      throw new BadRequestException('Practice exercise set has no questions');
    }

    const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
    const unknownQuestion = answers.find(
      (answer) => !questions.some((question) => question.id === answer.questionId),
    );
    if (unknownQuestion) {
      throw new BadRequestException(`Question ${unknownQuestion.questionId} is not in this set`);
    }

    const results = questions.map((question) => {
      const answer = answerByQuestion.get(question.id);
      const isCorrect = answer === undefined ? false : this.scoreAnswer(question, answer);
      return {
        questionId: question.id,
        prompt: question.prompt,
        answer: answer ?? null,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    });
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

  private exerciseSetInclude(includeCorrectAnswers: boolean) {
    return {
      course: { select: { id: true, title: true } },
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
              explanation: true,
              skillTags: true,
              ...(includeCorrectAnswers ? { correctAnswer: true } : {}),
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
        const { correctAnswer: _correctAnswer, ...question } = link.question;
        return { ...link, question };
      }),
    };
  }

  private scoreAnswer(
    question: { type: PracticeQuestionType; correctAnswer: unknown },
    answer: unknown,
  ) {
    if (question.type === PracticeQuestionType.FILL_BLANK) {
      return this.normalizeText(answer) === this.normalizeText(question.correctAnswer);
    }

    return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
  }

  private normalizeText(value: unknown) {
    return String(value ?? '')
      .trim()
      .toLocaleLowerCase();
  }
}
