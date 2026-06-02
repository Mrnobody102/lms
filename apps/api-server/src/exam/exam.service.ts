import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CourseActivityProgressStatus,
  CourseActivityType,
  ExamAttemptStatus,
  ExamQuestionType,
  Prisma,
  ReviewCardSource,
  Role,
} from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import {
  isNormalizedAnswerCorrect,
  normalizeQuestionPayload,
  normalizeSubmittedAnswer,
} from '../common/utils/answer-validation.util';
import { MediaService } from '../media/media.service';
import { SkillMasteryService } from '../skill/skill-mastery.service';
import { SrsService } from '../srs/srs.service';
import { CreateExamDto } from './dto/create-exam.dto';
import type { ExamStatusFilter } from './dto/exam-query.dto';

interface ExamUser {
  id: string;
  role: Role;
}

interface SubmittedExamAnswer {
  questionId: string;
  answer: unknown;
}

interface ExamListQuery {
  courseId?: string;
  unitId?: string;
  search?: string;
  status?: ExamStatusFilter;
  page?: number;
  limit?: number;
}

interface ExamQuestionForScoring {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  points: number;
  skillTags?: string[];
}

interface ExamWithSections {
  sections: Array<{ questions: ExamQuestionForScoring[] }>;
}

interface TimedAttempt {
  startedAt: Date;
  submittedAt?: Date | null;
}

@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
    private readonly skillMastery: SkillMasteryService,
    private readonly srs: SrsService,
    private readonly media: MediaService,
  ) {}

  private async validateAudioAssets(
    tenantId: string,
    sections: { questions: { audioMediaAssetId?: string | null }[] }[],
  ): Promise<void> {
    const assetIds = new Set<string>();
    for (const section of sections) {
      for (const question of section.questions) {
        if (question.audioMediaAssetId) assetIds.add(question.audioMediaAssetId);
      }
    }
    for (const assetId of assetIds) {
      await this.media.validateAudioAsset(tenantId, assetId);
    }
  }

  async createExam(tenantId: string, data: CreateExamDto, user?: ExamUser) {
    if (data.courseId && user) {
      await this.learningAccess.ensureAuthoringCourseAccess(data.courseId, tenantId, user);
    }
    await this.ensureCourse(tenantId, data.courseId);
    await this.ensureUnit(tenantId, data.courseId, data.unitId);
    await this.validateAudioAssets(tenantId, data.sections);
    const sections = data.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        payload: normalizeQuestionPayload({
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
        }),
      })),
    }));

    return this.prisma.exam.create({
      data: {
        tenantId,
        courseId: data.courseId,
        unitId: data.unitId,
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes ?? 30,
        passingScore: data.passingScore,
        isPublished: user?.role === Role.INSTRUCTOR ? false : (data.isPublished ?? false),
        sections: {
          create: sections.map((section, sectionIndex) => ({
            tenantId,
            title: section.title,
            order: section.order ?? sectionIndex,
            questions: {
              create: section.questions.map((question, questionIndex) => ({
                tenantId,
                type: question.type,
                prompt: question.prompt,
                options:
                  question.payload.options === undefined
                    ? undefined
                    : (question.payload.options as Prisma.InputJsonValue),
                correctAnswer: question.payload.correctAnswer as Prisma.InputJsonValue,
                explanation: question.explanation,
                points: question.points ?? 1,
                skillTags: question.skillTags ?? [],
                audioMediaAssetId: question.audioMediaAssetId ?? null,
                audioReplayLimit: question.audioReplayLimit ?? null,
                order: questionIndex,
              })),
            },
          })),
        },
      },
      include: this.examInclude(true),
    });
  }

  async updateExam(
    id: string,
    tenantId: string,
    data: {
      unitId?: string | null;
      title?: string;
      description?: string | null;
      durationMinutes?: number;
      passingScore?: number | null;
      isPublished?: boolean;
      sections?: CreateExamDto['sections'];
    },
    user?: ExamUser,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, courseId: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(exam.courseId, tenantId, user);
    }

    const nextUnitId =
      data.unitId === undefined
        ? undefined
        : await this.resolveUnit(tenantId, exam.courseId, data.unitId);

    const topLevelData: Prisma.ExamUncheckedUpdateInput = {
      title: data.title,
      description: data.description,
      durationMinutes: data.durationMinutes,
      passingScore: data.passingScore,
      isPublished: user?.role === Role.INSTRUCTOR ? undefined : data.isPublished,
      unitId: nextUnitId,
    };

    if (!data.sections) {
      return this.prisma.exam.update({
        where: { id_tenantId: { id, tenantId } },
        data: topLevelData,
        include: this.examInclude(true),
      });
    }

    await this.validateAudioAssets(tenantId, data.sections);

    const sections = data.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        payload: normalizeQuestionPayload({
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
        }),
      })),
    }));

    return this.prisma.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id_tenantId: { id, tenantId } },
        data: topLevelData,
      });

      await tx.examSection.deleteMany({
        where: { examId: id, tenantId },
      });

      for (const [sectionIndex, section] of sections.entries()) {
        await tx.examSection.create({
          data: {
            tenantId,
            examId: id,
            title: section.title,
            order: section.order ?? sectionIndex,
            questions: {
              create: section.questions.map((question, questionIndex) => ({
                tenantId,
                type: question.type,
                prompt: question.prompt,
                options:
                  question.payload.options === undefined
                    ? undefined
                    : (question.payload.options as Prisma.InputJsonValue),
                correctAnswer: question.payload.correctAnswer as Prisma.InputJsonValue,
                explanation: question.explanation,
                points: question.points ?? 1,
                skillTags: question.skillTags ?? [],
                audioMediaAssetId: question.audioMediaAssetId ?? null,
                audioReplayLimit: question.audioReplayLimit ?? null,
                order: questionIndex,
              })),
            },
          },
        });
      }

      return tx.exam.findFirstOrThrow({
        where: { id, tenantId },
        include: this.examInclude(true),
      });
    });
  }

  async removeExam(id: string, tenantId: string, user?: ExamUser) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, courseId: true },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    if (user) {
      await this.learningAccess.ensureAuthoringCourseAccess(exam.courseId, tenantId, user);
    }

    return this.prisma.exam.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  async listExams(tenantId: string, user: ExamUser, query: ExamListQuery) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const andFilters: Prisma.ExamWhereInput[] = [];
    const where: Prisma.ExamWhereInput = {
      tenantId,
      courseId: query.courseId,
      unitId: query.unitId,
      deletedAt: null,
    };

    if (user.role === Role.STUDENT) {
      where.isPublished = true;
      if (query.courseId) {
        where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
      } else {
        andFilters.push({
          OR: [{ courseId: null }, { course: this.learningAccess.courseWhere(tenantId, user) }],
        });
      }
    } else if (query.status && query.status !== 'all') {
      where.isPublished = query.status === 'published';
    }

    const search = query.search?.trim();
    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { unit: { title: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { sections: true, attempts: true } },
          course: { select: { id: true, title: true } },
          unit: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getExam(id: string, tenantId: string, user: ExamUser) {
    const exam = await this.prisma.exam.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
      },
      include: this.examInclude(user.role !== Role.STUDENT),
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    if (exam.courseId) {
      await this.learningAccess.ensureCourseAccess(exam.courseId, tenantId, user);
    }
    return user.role === Role.STUDENT ? this.hideAnswers(exam) : exam;
  }

  async listAttempts(
    tenantId: string,
    user: ExamUser,
    query: { courseId?: string; examId?: string; limit?: number },
  ) {
    const limit = this.getAttemptLimit(query.limit);
    const where: Prisma.ExamAttemptWhereInput = {
      tenantId,
      courseId: query.courseId,
      examId: query.examId,
    };

    if (user.role === Role.STUDENT) {
      where.userId = user.id;
      if (query.courseId) {
        where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
      } else {
        where.OR = [
          { courseId: null },
          { course: this.learningAccess.courseWhere(tenantId, user) },
        ];
      }
    }

    const attempts = await this.prisma.examAttempt.findMany({
      where,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            passingScore: true,
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    const visibleAttempts =
      user.role === Role.STUDENT
        ? attempts
        : await Promise.all(
            attempts.map(async (attempt) => {
              if (attempt.courseId) {
                await this.learningAccess.ensureCourseAccess(attempt.courseId, tenantId, user);
              }
              return attempt;
            }),
          );

    return visibleAttempts.map((attempt) => ({
      ...attempt,
      deadlineAt: this.getAttemptDeadline(attempt, attempt.exam.durationMinutes),
      isExpired: this.isAttemptExpired(attempt, attempt.exam.durationMinutes),
    }));
  }

  async startAttempt(examId: string, tenantId: string, user: ExamUser) {
    const exam = await this.prisma.exam.findFirst({
      where: {
        id: examId,
        tenantId,
        isPublished: true,
        deletedAt: null,
      },
      include: this.examInclude(false),
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    if (exam.courseId) {
      await this.learningAccess.ensureCourseAccess(exam.courseId, tenantId, user);
    }

    const totalPoints = this.getQuestions(exam).reduce((sum, question) => sum + question.points, 0);
    if (totalPoints === 0) {
      throw new BadRequestException('Exam has no questions');
    }

    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        tenantId,
        userId: user.id,
        examId: exam.id,
        status: ExamAttemptStatus.STARTED,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAttempt && !this.isAttemptExpired(existingAttempt, exam.durationMinutes)) {
      await this.upsertActivityProgressForExam({
        tenantId,
        userId: user.id,
        examId: exam.id,
        status: CourseActivityProgressStatus.IN_PROGRESS,
        lastAccessedAt: existingAttempt.startedAt,
        completedAt: null,
        scorePercent: null,
      });

      return {
        attempt: this.withAttemptTiming(existingAttempt, exam.durationMinutes),
        exam: this.hideAnswers(exam),
        resumed: true,
      };
    }

    const attempt = await this.prisma.examAttempt.create({
      data: {
        tenantId,
        userId: user.id,
        courseId: exam.courseId,
        examId: exam.id,
        status: ExamAttemptStatus.STARTED,
        totalPoints,
      },
    });

    await this.upsertActivityProgressForExam({
      tenantId,
      userId: user.id,
      examId: exam.id,
      status: CourseActivityProgressStatus.IN_PROGRESS,
      lastAccessedAt: attempt.startedAt,
      completedAt: null,
      scorePercent: null,
    });

    return {
      attempt: this.withAttemptTiming(attempt, exam.durationMinutes),
      exam: this.hideAnswers(exam),
      resumed: false,
    };
  }

  async submitAttempt(
    attemptId: string,
    tenantId: string,
    user: ExamUser,
    answers: SubmittedExamAnswer[],
  ) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: this.attemptWhere(attemptId, tenantId, user),
      include: {
        exam: {
          include: this.examInclude(true),
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Exam attempt with ID ${attemptId} not found`);
    }

    if (attempt.status === ExamAttemptStatus.SUBMITTED) {
      throw new BadRequestException('Exam attempt has already been submitted');
    }

    // Give a 2-minute grace period for network latency
    const gracePeriodMs = 120_000;
    if (
      Date.now() >
      this.getAttemptDeadline(attempt, attempt.exam.durationMinutes).getTime() + gracePeriodMs
    ) {
      throw new BadRequestException('Exam attempt time has expired');
    }

    if (attempt.courseId) {
      await this.learningAccess.ensureCourseAccess(attempt.courseId, tenantId, user);
    }

    const questions = this.getQuestions(attempt.exam);
    const unknownQuestion = answers.find(
      (answer) => !questions.some((question) => question.id === answer.questionId),
    );
    if (unknownQuestion) {
      throw new BadRequestException(`Question ${unknownQuestion.questionId} is not in this exam`);
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

    const results = questions.map((question) => {
      const answer = answerByQuestion.get(question.id);
      const isCorrect = answer === undefined ? false : this.scoreAnswer(question, answer);
      return {
        questionId: question.id,
        prompt: question.prompt,
        answer: answer ?? null,
        isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation ?? null,
      };
    });
    const score = results.reduce((sum, result) => sum + result.pointsAwarded, 0);
    const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

    const submittedAttempt = await this.prisma.examAttempt.update({
      where: { id_tenantId: { id: attempt.id, tenantId } },
      data: {
        status: ExamAttemptStatus.SUBMITTED,
        score,
        totalPoints,
        submittedAt: new Date(),
        answers: {
          create: results
            .filter((result) => result.answer !== null)
            .map((result) => ({
              questionId: result.questionId,
              answer: result.answer as Prisma.InputJsonValue,
              isCorrect: result.isCorrect,
              pointsAwarded: result.pointsAwarded,
            })),
        },
      },
      include: { answers: true },
    });

    await this.skillMastery.applyAnswerEvents(
      tenantId,
      user.id,
      results.map((result) => ({
        skillCodes: questions.find((q) => q.id === result.questionId)?.skillTags ?? [],
        isCorrect: result.isCorrect,
      })),
    );

    await this.srs.upsertCardsForAnswers(
      tenantId,
      user.id,
      results.map((result) => ({
        sourceType: ReviewCardSource.EXAM_QUESTION,
        questionId: result.questionId,
        skillCodes: questions.find((q) => q.id === result.questionId)?.skillTags ?? [],
        isCorrect: result.isCorrect,
      })),
    );

    await this.upsertActivityProgressForExam({
      tenantId,
      userId: user.id,
      examId: attempt.exam.id,
      status: CourseActivityProgressStatus.COMPLETED,
      lastAccessedAt: submittedAttempt.submittedAt ?? new Date(),
      completedAt: submittedAttempt.submittedAt ?? new Date(),
      scorePercent: this.toScorePercent(score, totalPoints),
    });

    return {
      attempt: this.withAttemptTiming(submittedAttempt, attempt.exam.durationMinutes),
      result: this.buildResult(score, totalPoints, attempt.exam.passingScore, results),
    };
  }

  async getAttempt(attemptId: string, tenantId: string, user: ExamUser) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: this.attemptWhere(attemptId, tenantId, user),
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
                points: true,
                skillTags: true,
              },
            },
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            durationMinutes: true,
            course: { select: { id: true, title: true } },
            unit: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Exam attempt with ID ${attemptId} not found`);
    }

    if (attempt.courseId) {
      await this.learningAccess.ensureCourseAccess(attempt.courseId, tenantId, user);
    }
    const attemptWithTiming = {
      ...attempt,
      deadlineAt: this.getAttemptDeadline(attempt, attempt.exam.durationMinutes),
      isExpired: this.isAttemptExpired(attempt, attempt.exam.durationMinutes),
    };

    if (user.role === Role.STUDENT && attempt.status !== ExamAttemptStatus.SUBMITTED) {
      return this.hideAttemptAnswerSecrets(attemptWithTiming);
    }

    return attemptWithTiming;
  }

  private async ensureCourse(tenantId: string, courseId?: string | null) {
    if (!courseId) return;
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

  private async ensureUnit(tenantId: string, courseId?: string | null, unitId?: string | null) {
    if (!unitId) {
      return;
    }

    const unit = await this.prisma.courseUnit.findFirst({
      where: {
        id: unitId,
        tenantId,
        ...(courseId ? { courseId } : {}),
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found in this course`);
    }
  }

  private async resolveUnit(tenantId: string, courseId?: string | null, unitId?: string | null) {
    if (unitId === null) {
      return null;
    }

    if (!unitId) {
      return undefined;
    }

    const unit = await this.prisma.courseUnit.findFirst({
      where: {
        id: unitId,
        tenantId,
        ...(courseId ? { courseId } : {}),
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found in this course`);
    }

    return unit.id;
  }

  private attemptWhere(attemptId: string, tenantId: string, user: ExamUser) {
    return {
      id: attemptId,
      tenantId,
      ...(user.role === Role.STUDENT ? { userId: user.id } : {}),
    };
  }

  private examInclude(includeCorrectAnswers: boolean) {
    return {
      course: { select: { id: true, title: true } },
      unit: { select: { id: true, title: true } },
      sections: {
        orderBy: { order: 'asc' as const },
        include: {
          questions: {
            orderBy: { order: 'asc' as const },
            select: {
              id: true,
              type: true,
              prompt: true,
              options: true,
              points: true,
              skillTags: true,
              audioMediaAssetId: true,
              audioReplayLimit: true,
              audioMediaAsset: {
                select: { id: true, url: true, status: true },
              },
              ...(includeCorrectAnswers ? { correctAnswer: true, explanation: true } : {}),
            },
          },
        },
      },
    };
  }

  private hideAnswers<T extends { sections: Array<{ questions: Array<Record<string, unknown>> }> }>(
    exam: T,
  ) {
    return {
      ...exam,
      sections: exam.sections.map((section) => ({
        ...section,
        questions: section.questions.map((rawQuestion) => {
          const {
            correctAnswer: _correctAnswer,
            explanation: _explanation,
            ...question
          } = rawQuestion;
          return question;
        }),
      })),
    };
  }

  private hideAttemptAnswerSecrets<
    T extends { answers: Array<{ question: Record<string, unknown> }> },
  >(attempt: T) {
    return {
      ...attempt,
      answers: attempt.answers.map((answer) => {
        const {
          correctAnswer: _correctAnswer,
          explanation: _explanation,
          ...question
        } = answer.question;
        return { ...answer, question };
      }),
    };
  }

  private getQuestions(exam: ExamWithSections) {
    return exam.sections.flatMap((section) => section.questions);
  }

  private scoreAnswer(
    question: { type: ExamQuestionType; correctAnswer?: unknown },
    answer: unknown,
  ) {
    return isNormalizedAnswerCorrect({
      type: question.type,
      answer,
      correctAnswer: question.correctAnswer,
    });
  }

  private buildResult(
    score: number,
    totalPoints: number,
    passingScore: number | null,
    answers: Array<{
      questionId: string;
      prompt: string;
      answer: unknown;
      isCorrect: boolean;
      pointsAwarded: number;
      correctAnswer: unknown;
      explanation: string | null;
    }>,
  ) {
    const percentage = Math.round((score / totalPoints) * 100);
    return {
      score,
      totalPoints,
      percentage,
      passed: passingScore === null ? null : percentage >= passingScore,
      answers,
    };
  }

  private toScorePercent(score: number, totalPoints: number) {
    return totalPoints <= 0 ? 0 : Math.round((score / totalPoints) * 100);
  }

  private getAttemptLimit(limit?: number) {
    return Math.min(Math.max(limit ?? 10, 1), 20);
  }

  private async upsertActivityProgressForExam(input: {
    tenantId: string;
    userId: string;
    examId: string;
    status: CourseActivityProgressStatus;
    lastAccessedAt: Date;
    completedAt: Date | null;
    scorePercent: number | null;
  }) {
    const activity = await this.prisma.courseActivity.findFirst({
      where: {
        tenantId: input.tenantId,
        type: CourseActivityType.EXAM,
        targetId: input.examId,
        deletedAt: null,
      },
      select: { id: true },
      orderBy: { order: 'asc' },
    });

    if (!activity) {
      return;
    }

    const existing = await this.prisma.userCourseActivityProgress.findUnique({
      where: {
        tenantId_userId_activityId: {
          tenantId: input.tenantId,
          userId: input.userId,
          activityId: activity.id,
        },
      },
      select: { status: true, completedAt: true, scorePercent: true },
    });
    const keepCompleted =
      existing?.status === CourseActivityProgressStatus.COMPLETED &&
      input.status !== CourseActivityProgressStatus.COMPLETED;

    await this.prisma.userCourseActivityProgress.upsert({
      where: {
        tenantId_userId_activityId: {
          tenantId: input.tenantId,
          userId: input.userId,
          activityId: activity.id,
        },
      },
      update: {
        status: keepCompleted ? CourseActivityProgressStatus.COMPLETED : input.status,
        lastAccessedAt: input.lastAccessedAt !== undefined ? input.lastAccessedAt : undefined,
        completedAt: keepCompleted
          ? existing?.completedAt
          : input.completedAt !== undefined
            ? input.completedAt
            : undefined,
        scorePercent: keepCompleted
          ? existing?.scorePercent
          : input.scorePercent !== undefined
            ? input.scorePercent
            : undefined,
      },
      create: {
        tenantId: input.tenantId,
        userId: input.userId,
        activityId: activity.id,
        status: input.status,
        lastAccessedAt: input.lastAccessedAt,
        completedAt: input.completedAt,
        scorePercent: input.scorePercent,
      },
    });
  }

  private getAttemptDeadline(attempt: TimedAttempt, durationMinutes: number) {
    return new Date(attempt.startedAt.getTime() + durationMinutes * 60_000);
  }

  private isAttemptExpired(attempt: TimedAttempt, durationMinutes: number) {
    if (attempt.submittedAt) {
      return false;
    }

    return this.getAttemptDeadline(attempt, durationMinutes).getTime() <= Date.now();
  }

  private withAttemptTiming<T extends TimedAttempt>(attempt: T, durationMinutes: number) {
    return {
      ...attempt,
      deadlineAt: this.getAttemptDeadline(attempt, durationMinutes),
      isExpired: this.isAttemptExpired(attempt, durationMinutes),
    };
  }
}
