import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdaptiveLearningPathItemStatus, Prisma, QuestionReviewStatus, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { AdaptiveLearningQueryDto } from './dto/adaptive-learning-query.dto';

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
    const targetUserId = user.role === Role.STUDENT ? user.id : query.userId;
    if (!targetUserId) {
      throw new ForbiddenException('userId is required for admin adaptive path lookup');
    }

    if (query.courseId) {
      await this.learningAccess.ensureCourseAccess(query.courseId, tenantId, user);
    }

    const items = await this.prisma.adaptiveLearningPathItem.findMany({
      where: {
        tenantId,
        userId: targetUserId,
        courseId: query.courseId,
        status: query.status,
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    const questionIds = [...new Set(items.flatMap((item) => item.questionIds))];
    const questions = await this.prisma.practiceQuestion.findMany({
      where: {
        tenantId,
        id: { in: questionIds },
        deletedAt: null,
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

  async updateStatus(
    tenantId: string,
    user: AdaptiveLearner,
    itemId: string,
    status: AdaptiveLearningPathItemStatus,
  ) {
    const item = await this.prisma.adaptiveLearningPathItem.findFirst({
      where: { id: itemId, tenantId },
      select: { id: true, userId: true },
    });

    if (!item) {
      throw new NotFoundException('Adaptive learning path item not found');
    }

    if (user.role === Role.STUDENT && item.userId !== user.id) {
      throw new ForbiddenException('Students can only update their own adaptive path');
    }

    return this.prisma.adaptiveLearningPathItem.update({
      where: { id: item.id },
      data: { status },
    });
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
