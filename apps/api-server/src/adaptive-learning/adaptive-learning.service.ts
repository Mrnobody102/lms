import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdaptiveLearningPathItemStatus,
  EnrollmentStatus,
  Prisma,
  QuestionReviewStatus,
  Role,
} from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import {
  ADAPTIVE_SEQUENCING,
  buildAdaptiveNextSteps,
  countDueSkills,
  isWeakMastery,
} from './adaptive-sequencing';
import { AdaptiveLearningQueryDto } from './dto/adaptive-learning-query.dto';
import { AdaptiveNextStepsQueryDto } from './dto/adaptive-next-steps-query.dto';

interface PracticeAttemptSignal {
  questionId: string;
  isCorrect: boolean;
  skillTags: string[];
}

interface AdaptiveLearner {
  id: string;
  role: Role;
}

interface SkillStats {
  attempted: number;
  incorrect: number;
}

const MIN_SIMILAR_QUESTIONS = 2;
const MAX_PATH_ITEMS_FOR_SEQUENCING = 50;
const MAX_DUE_CARDS_FOR_SEQUENCING = 200;

@Injectable()
export class AdaptiveLearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async createRecommendationsFromPracticeAttempt(input: {
    tenantId: string;
    userId: string;
    courseId: string;
    attemptId: string;
    results: PracticeAttemptSignal[];
  }) {
    const weakSkills = this.findWeakSkills(input.results);
    if (weakSkills.length === 0) {
      return { created: 0 };
    }

    let created = 0;
    const answeredQuestionIds = input.results.map((result) => result.questionId);

    for (const skill of weakSkills) {
      const existing = await this.prisma.adaptiveLearningPathItem.findFirst({
        where: {
          tenantId: input.tenantId,
          userId: input.userId,
          courseId: input.courseId,
          sourceSkillCode: skill.code,
          status: {
            in: [
              AdaptiveLearningPathItemStatus.PENDING,
              AdaptiveLearningPathItemStatus.IN_PROGRESS,
            ],
          },
        },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const questions = await this.prisma.practiceQuestion.findMany({
        where: {
          tenantId: input.tenantId,
          courseId: input.courseId,
          reviewStatus: QuestionReviewStatus.APPROVED,
          deletedAt: null,
          skillTags: { has: skill.code },
          id: { notIn: answeredQuestionIds },
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (questions.length < MIN_SIMILAR_QUESTIONS) {
        continue;
      }

      await this.prisma.adaptiveLearningPathItem.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          courseId: input.courseId,
          sourceSkillCode: skill.code,
          sourceAttemptId: input.attemptId,
          questionIds: questions.map((question) => question.id),
          priority: skill.incorrect * 10 + skill.attempted,
          reason: {
            source: 'practice-attempt',
            attempted: skill.attempted,
            incorrect: skill.incorrect,
            message: 'Learner missed multiple questions for this skill',
          } satisfies Prisma.InputJsonObject,
        },
      });
      created += 1;
    }

    return { created };
  }

  async listPath(tenantId: string, user: AdaptiveLearner, query: AdaptiveLearningQueryDto) {
    const targetUserId = this.resolveTargetUserId(user, query.userId);

    if (query.courseId) {
      await this.learningAccess.ensureCourseAccess(query.courseId, tenantId, user);
    }

    const where: Prisma.AdaptiveLearningPathItemWhereInput = {
      tenantId,
      userId: targetUserId,
      courseId: query.courseId,
      status: query.status,
    };

    if (user.role === Role.INSTRUCTOR || user.role === Role.STUDENT) {
      where.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
    }

    const items = await this.prisma.adaptiveLearningPathItem.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    const questionIds = [...new Set(items.flatMap((item) => item.questionIds))];
    const questions = await this.prisma.practiceQuestion.findMany({
      where: {
        tenantId,
        id: { in: questionIds },
        reviewStatus: QuestionReviewStatus.APPROVED,
        deletedAt: null,
        ...(user.role === Role.STUDENT || user.role === Role.INSTRUCTOR
          ? { course: this.learningAccess.courseWhere(tenantId, user, query.courseId) }
          : {}),
      },
      select: {
        id: true,
        type: true,
        prompt: true,
        options: true,
        skillTags: true,
        audioMediaAssetId: true,
        audioReplayLimit: true,
        audioMediaAsset: { select: { id: true, url: true, status: true } },
      },
    });
    const questionById = new Map(questions.map((question) => [question.id, question]));

    return items.map((item) => ({
      ...item,
      recommendation: buildRecommendationSummary(item),
      questions: item.questionIds
        .map((questionId) => questionById.get(questionId))
        .filter((question): question is (typeof questions)[number] => Boolean(question)),
    }));
  }

  async getNext(tenantId: string, user: AdaptiveLearner, courseId?: string) {
    const path = await this.listPath(tenantId, user, {
      courseId,
      status: AdaptiveLearningPathItemStatus.PENDING,
    });

    return path[0] ?? null;
  }

  /**
   * Sequence the learner's next steps across SRS due cards, pending adaptive
   * path items, and low-mastery skills. The result is deterministic and every
   * step explains its own ranking through `signals` and `scoreBreakdown`.
   */
  async getNextSteps(tenantId: string, user: AdaptiveLearner, query: AdaptiveNextStepsQueryDto) {
    const targetUserId = this.resolveTargetUserId(user, query.userId);

    if (query.courseId) {
      await this.learningAccess.ensureCourseAccess(query.courseId, tenantId, user);
    }

    if (user.role === Role.INSTRUCTOR) {
      await this.ensureInstructorCanViewLearner(tenantId, user, targetUserId, query.courseId);
    }

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const pathWhere: Prisma.AdaptiveLearningPathItemWhereInput = {
      tenantId,
      userId: targetUserId,
      courseId: query.courseId,
      status: {
        in: [AdaptiveLearningPathItemStatus.PENDING, AdaptiveLearningPathItemStatus.IN_PROGRESS],
      },
    };

    if (user.role === Role.INSTRUCTOR || user.role === Role.STUDENT) {
      pathWhere.course = this.learningAccess.courseWhere(tenantId, user, query.courseId);
    }

    const cardAccess = await this.learningAccess.reviewCardWhere(
      tenantId,
      targetUserId,
      user,
      query.courseId,
    );
    const dueCardWhere: Prisma.ReviewCardWhereInput = {
      ...cardAccess,
      isSuspended: false,
      dueAt: { lte: now },
    };

    const [pathItems, masteries, dueNow, dueToday, dueCards] = await Promise.all([
      this.prisma.adaptiveLearningPathItem.findMany({
        where: pathWhere,
        select: {
          id: true,
          courseId: true,
          sourceSkillCode: true,
          questionIds: true,
          status: true,
          priority: true,
          reason: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: MAX_PATH_ITEMS_FOR_SEQUENCING,
      }),
      // Mastery is tenant-wide and cannot be separated by course. Instructors
      // receive scoped path/SRS signals, never a learner's global mastery.
      user.role === Role.INSTRUCTOR
        ? Promise.resolve([])
        : this.prisma.skillMastery.findMany({
            where: { tenantId, userId: targetUserId },
            select: { skillCode: true, mastery: true, attempts: true },
            orderBy: [{ mastery: 'asc' }, { skillCode: 'asc' }],
          }),
      this.prisma.reviewCard.count({ where: dueCardWhere }),
      this.prisma.reviewCard.count({
        where: { ...cardAccess, isSuspended: false, dueAt: { lte: endOfToday } },
      }),
      this.prisma.reviewCard.findMany({
        where: dueCardWhere,
        select: { skillCodes: true },
        orderBy: { dueAt: 'asc' },
        take: MAX_DUE_CARDS_FOR_SEQUENCING,
      }),
    ]);

    const steps = buildAdaptiveNextSteps({
      pathItems,
      masteries,
      dueNow,
      dueToday,
      dueSkillCounts: countDueSkills(dueCards),
      limit: query.limit,
    });

    return {
      learnerId: targetUserId,
      courseId: query.courseId ?? null,
      generatedAt: now,
      steps,
      signals: {
        dueNow,
        dueToday,
        pendingPathItems: pathItems.length,
        trackedSkillCount: masteries.length,
        weakSkillCount: masteries.filter(isWeakMastery).length,
        weakMasteryThreshold: Math.round(ADAPTIVE_SEQUENCING.weakMasteryThreshold * 100),
      },
    };
  }

  async updateStatus(
    tenantId: string,
    user: AdaptiveLearner,
    itemId: string,
    status: AdaptiveLearningPathItemStatus,
  ) {
    const where: Prisma.AdaptiveLearningPathItemWhereInput = { id: itemId, tenantId };
    if (user.role === Role.INSTRUCTOR || user.role === Role.STUDENT) {
      where.course = this.learningAccess.courseWhere(tenantId, user);
    }

    const item = await this.prisma.adaptiveLearningPathItem.findFirst({
      where,
      select: { id: true, userId: true },
    });

    if (!item) {
      throw new NotFoundException('Adaptive learning path item not found');
    }

    if (user.role === Role.STUDENT && item.userId !== user.id) {
      throw new ForbiddenException('Students can only update their own adaptive path');
    }

    return this.prisma.adaptiveLearningPathItem.update({
      where: { id: item.id, tenantId },
      data: { status },
    });
  }

  async startPractice(tenantId: string, user: AdaptiveLearner, itemId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "AdaptiveLearningPathItem" WHERE "id" = ${itemId} AND "tenantId" = ${tenantId} AND "userId" = ${user.id} FOR UPDATE`;
      const item = await tx.adaptiveLearningPathItem.findFirst({
        where: {
          id: itemId,
          tenantId,
          userId: user.id,
          course: this.learningAccess.courseWhere(tenantId, user),
        },
      });
      if (!item) throw new NotFoundException('Adaptive learning path item not found');
      if (item.status === AdaptiveLearningPathItemStatus.SKIPPED) {
        throw new BadRequestException('This adaptive practice was skipped');
      }
      const questions = await tx.practiceQuestion.findMany({
        where: {
          tenantId,
          courseId: item.courseId,
          id: { in: item.questionIds },
          deletedAt: null,
          reviewStatus: QuestionReviewStatus.APPROVED,
        },
        select: { id: true },
      });
      if (questions.length !== item.questionIds.length || questions.length === 0) {
        throw new BadRequestException('Some adaptive practice questions are no longer available');
      }
      // A unique relation makes start/resume idempotent, including two browser tabs.
      const exerciseSet = await tx.practiceExerciseSet.upsert({
        where: { adaptivePathItemId_tenantId: { adaptivePathItemId: item.id, tenantId } },
        create: {
          tenantId,
          courseId: item.courseId,
          adaptivePathItemId: item.id,
          title: item.sourceSkillCode,
          isPublished: true,
          questions: {
            create: item.questionIds.map((questionId, order) => ({ questionId, order })),
          },
        },
        update: {},
        select: { id: true },
      });
      await tx.adaptiveLearningPathItem.updateMany({
        where: {
          id: item.id,
          tenantId,
          userId: user.id,
          status: AdaptiveLearningPathItemStatus.PENDING,
        },
        data: { status: AdaptiveLearningPathItemStatus.IN_PROGRESS },
      });
      return { exerciseSetId: exerciseSet.id };
    });
  }

  private resolveTargetUserId(user: AdaptiveLearner, requestedUserId?: string) {
    const targetUserId = user.role === Role.STUDENT ? user.id : requestedUserId;
    if (!targetUserId) {
      throw new ForbiddenException('userId is required for admin adaptive path lookup');
    }
    return targetUserId;
  }

  private async ensureInstructorCanViewLearner(
    tenantId: string,
    instructor: AdaptiveLearner,
    learnerId: string,
    courseId?: string,
  ) {
    const sharedEnrollments = await this.prisma.courseEnrollment.count({
      where: {
        tenantId,
        userId: learnerId,
        status: EnrollmentStatus.ACTIVE,
        course: this.learningAccess.courseWhere(tenantId, instructor, courseId),
      },
    });

    if (sharedEnrollments === 0) {
      throw new ForbiddenException('Instructors can only view learners in assigned courses');
    }
  }

  private findWeakSkills(results: PracticeAttemptSignal[]) {
    const statsBySkill = new Map<string, SkillStats>();

    for (const result of results) {
      for (const skillCode of result.skillTags) {
        const stats = statsBySkill.get(skillCode) ?? { attempted: 0, incorrect: 0 };
        stats.attempted += 1;
        if (!result.isCorrect) {
          stats.incorrect += 1;
        }
        statsBySkill.set(skillCode, stats);
      }
    }

    return Array.from(statsBySkill.entries())
      .filter(([, stats]) => stats.incorrect >= 2 || (stats.attempted >= 3 && stats.incorrect >= 2))
      .map(([code, stats]) => ({ code, ...stats }))
      .sort((left, right) => right.incorrect - left.incorrect || right.attempted - left.attempted);
  }
}

interface AdaptivePathSummaryInput {
  priority: number;
  questionIds: string[];
  reason: Prisma.JsonValue;
  sourceSkillCode: string;
}

function buildRecommendationSummary(item: AdaptivePathSummaryInput) {
  const reason = toRecord(item.reason);
  const attempted = readNumber(reason.attempted);
  const incorrect = readNumber(reason.incorrect);
  const reasonSource = readString(reason.source) ?? 'adaptive-signal';

  return {
    reasonCode: 'weak_skill_practice_misses',
    source: reasonSource,
    summary:
      attempted !== null && incorrect !== null
        ? `Learner missed ${incorrect} of ${attempted} recent items for ${item.sourceSkillCode}`
        : `Learner needs more practice for ${item.sourceSkillCode}`,
    nextAction: 'practice_similar_questions',
    signals: {
      attempted,
      incorrect,
      priority: item.priority,
      questionCount: item.questionIds.length,
      sourceSkillCode: item.sourceSkillCode,
    },
  };
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
