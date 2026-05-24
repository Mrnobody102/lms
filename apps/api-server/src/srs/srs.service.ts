import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReviewCardGrade, ReviewCardSource, type ReviewCard } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';

const MIN_EASE_FACTOR = 1.3;
const FAILED_INTERVAL_MINUTES = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CUSTOM_CARDS = 500;

export interface AnswerEvent {
  sourceType: ReviewCardSource;
  questionId: string;
  skillCodes: string[];
  isCorrect: boolean;
}

export interface QueueQuestionPayload {
  id: string;
  prompt: string;
  type: string;
  options: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  audioMediaAsset: { id: string; url: string | null } | null;
  audioReplayLimit: number | null;
}

export interface QueueItem {
  cardId: string;
  sourceType: ReviewCardSource;
  question: QueueQuestionPayload | null;
  skillCodes: string[];
  dueAt: Date;
  reps: number;
  lapses: number;
  easeFactor: number;
}

export interface DueSummary {
  dueNow: number;
  dueToday: number;
  total: number;
}

export interface CustomCardContent {
  front: string;
  back?: string;
  pinyin?: string;
  example?: string;
}

export interface CustomCardInput {
  customContent: CustomCardContent;
  skillCodes?: string[];
}

interface ScheduleResult {
  reps: number;
  lapses: number;
  easeFactor: number;
  interval: number;
  dueAt: Date;
}

@Injectable()
export class SrsService {
  private readonly logger = new Logger(SrsService.name);

  constructor(private readonly prisma: PrismaService) {}

  scheduleNext(
    state: { reps: number; lapses: number; easeFactor: number; interval: number },
    grade: ReviewCardGrade,
    now: Date = new Date(),
  ): ScheduleResult {
    const { reps, lapses, easeFactor, interval } = state;
    let nextEf = easeFactor;
    let nextReps = reps;
    let nextLapses = lapses;
    let nextInterval = interval;
    let nextDue = new Date(now);

    switch (grade) {
      case ReviewCardGrade.AGAIN:
        nextReps = 0;
        nextLapses = lapses + 1;
        nextEf = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
        nextInterval = 0;
        nextDue = new Date(now.getTime() + FAILED_INTERVAL_MINUTES * 60 * 1000);
        break;
      case ReviewCardGrade.HARD: {
        nextEf = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
        const base = interval > 0 ? Math.max(1, Math.round(interval * 1.2)) : 1;
        nextInterval = base;
        nextReps = reps + 1;
        nextDue = new Date(now.getTime() + base * ONE_DAY_MS);
        break;
      }
      case ReviewCardGrade.GOOD: {
        if (reps === 0) nextInterval = 1;
        else if (reps === 1) nextInterval = 6;
        else nextInterval = Math.max(1, Math.round(interval * easeFactor));
        nextReps = reps + 1;
        nextDue = new Date(now.getTime() + nextInterval * ONE_DAY_MS);
        break;
      }
      case ReviewCardGrade.EASY: {
        const base = interval > 0 ? Math.round(interval * easeFactor * 1.3) : 4;
        nextInterval = Math.max(1, base);
        nextEf = easeFactor + 0.15;
        nextReps = reps + 1;
        nextDue = new Date(now.getTime() + nextInterval * ONE_DAY_MS);
        break;
      }
    }

    return {
      reps: nextReps,
      lapses: nextLapses,
      easeFactor: nextEf,
      interval: nextInterval,
      dueAt: nextDue,
    };
  }

  async upsertCardsForAnswers(
    tenantId: string,
    userId: string,
    events: AnswerEvent[],
  ): Promise<void> {
    const incorrect = events.filter((event) => !event.isCorrect && event.questionId);
    if (incorrect.length === 0) return;

    try {
      const now = new Date();
      const dueAt = new Date(now.getTime() + FAILED_INTERVAL_MINUTES * 60 * 1000);
      await Promise.all(
        incorrect.map((event) =>
          this.prisma.reviewCard.upsert({
            where: {
              tenantId_userId_sourceType_sourceId: {
                tenantId,
                userId,
                sourceType: event.sourceType,
                sourceId: event.questionId,
              },
            },
            update: {
              skillCodes: event.skillCodes,
              dueAt,
              reps: 0,
              isSuspended: false,
            },
            create: {
              tenantId,
              userId,
              sourceType: event.sourceType,
              sourceId: event.questionId,
              skillCodes: event.skillCodes,
              dueAt,
            },
          }),
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to upsert review cards for user=${userId} tenant=${tenantId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getQueue(
    tenantId: string,
    userId: string,
    options: { limit?: number; skill?: string } = {},
  ): Promise<QueueItem[]> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const cards = await this.prisma.reviewCard.findMany({
      where: {
        tenantId,
        userId,
        isSuspended: false,
        dueAt: { lte: new Date() },
        ...(options.skill ? { skillCodes: { has: options.skill } } : {}),
      },
      orderBy: { dueAt: 'asc' },
      take: limit,
    });

    if (cards.length === 0) return [];

    const practiceIds = cards
      .filter((c) => c.sourceType === ReviewCardSource.PRACTICE_QUESTION)
      .map((c) => c.sourceId);
    const examIds = cards
      .filter((c) => c.sourceType === ReviewCardSource.EXAM_QUESTION)
      .map((c) => c.sourceId);

    type PracticeQueueRow = {
      id: string;
      prompt: string;
      type: unknown;
      options: unknown;
      correctAnswer: unknown;
      explanation: string | null;
      audioReplayLimit: number | null;
      audioMediaAsset: { id: string; url: string | null } | null;
    };
    type ExamQueueRow = PracticeQueueRow;

    const [practiceQuestions, examQuestions] = await Promise.all([
      practiceIds.length
        ? (this.prisma.practiceQuestion.findMany({
            where: { tenantId, id: { in: practiceIds }, deletedAt: null },
            select: {
              id: true,
              prompt: true,
              type: true,
              options: true,
              correctAnswer: true,
              explanation: true,
              audioReplayLimit: true,
              audioMediaAsset: { select: { id: true, url: true } },
            },
          }) as Promise<PracticeQueueRow[]>)
        : Promise.resolve([] as PracticeQueueRow[]),
      examIds.length
        ? (this.prisma.examQuestion.findMany({
            where: { tenantId, id: { in: examIds } },
            select: {
              id: true,
              prompt: true,
              type: true,
              options: true,
              correctAnswer: true,
              explanation: true,
              audioReplayLimit: true,
              audioMediaAsset: { select: { id: true, url: true } },
            },
          }) as Promise<ExamQueueRow[]>)
        : Promise.resolve([] as ExamQueueRow[]),
    ]);

    const practiceById = new Map(practiceQuestions.map((q) => [q.id, q]));
    const examById = new Map(examQuestions.map((q) => [q.id, q]));

    return cards.map((card) => {
      const source =
        card.sourceType === ReviewCardSource.PRACTICE_QUESTION
          ? practiceById.get(card.sourceId)
          : examById.get(card.sourceId);
      let question: QueueQuestionPayload | null = null;

      if (card.sourceType === ReviewCardSource.CUSTOM && card.customContent) {
        const customContent = card.customContent as Record<string, string>;
        question = {
          id: card.sourceId,
          prompt: customContent.front || '',
          type: 'micro_card',
          options: null,
          correctAnswer: null,
          explanation: customContent.back || '',
          audioMediaAsset: null,
          audioReplayLimit: null,
        };
      } else if (source) {
        question = {
          id: source.id,
          prompt: source.prompt,
          type: String(source.type),
          options: source.options,
          correctAnswer: source.correctAnswer,
          explanation: source.explanation,
          audioMediaAsset: source.audioMediaAsset
            ? { id: source.audioMediaAsset.id, url: source.audioMediaAsset.url }
            : null,
          audioReplayLimit: source.audioReplayLimit ?? null,
        };
      }
      return {
        cardId: card.id,
        sourceType: card.sourceType,
        question,
        skillCodes: card.skillCodes,
        dueAt: card.dueAt,
        reps: card.reps,
        lapses: card.lapses,
        easeFactor: card.easeFactor,
      };
    });
  }

  async submitReview(
    tenantId: string,
    userId: string,
    cardId: string,
    grade: ReviewCardGrade,
    durationMs?: number,
  ): Promise<ReviewCard> {
    const card = await this.prisma.reviewCard.findUnique({
      where: { id: cardId, tenantId, userId },
    });
    if (!card) throw new NotFoundException('Review card not found');

    const next = this.scheduleNext(
      {
        reps: card.reps,
        lapses: card.lapses,
        easeFactor: card.easeFactor,
        interval: card.interval,
      },
      grade,
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedCard = await tx.reviewCard.update({
        where: { id: card.id, tenantId, userId },
        data: {
          reps: next.reps,
          lapses: next.lapses,
          easeFactor: next.easeFactor,
          interval: next.interval,
          dueAt: next.dueAt,
          lastReviewedAt: new Date(),
          lastGrade: grade,
          isSuspended: false,
        },
      });

      await tx.reviewLog.create({
        data: {
          tenantId,
          userId,
          cardId: card.id,
          grade,
          easeFactor: next.easeFactor,
          interval: next.interval,
          durationMs,
        },
      });

      return updatedCard;
    });
  }

  async getDueSummary(tenantId: string, userId: string): Promise<DueSummary> {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [dueNow, dueToday, total] = await Promise.all([
      this.prisma.reviewCard.count({
        where: { tenantId, userId, isSuspended: false, dueAt: { lte: now } },
      }),
      this.prisma.reviewCard.count({
        where: { tenantId, userId, isSuspended: false, dueAt: { lte: endOfToday } },
      }),
      this.prisma.reviewCard.count({
        where: { tenantId, userId, isSuspended: false },
      }),
    ]);

    return { dueNow, dueToday, total };
  }

  async createCustomCard(
    tenantId: string,
    userId: string,
    data: CustomCardInput,
  ): Promise<ReviewCard> {
    await this.ensureCustomCardLimit(tenantId, userId);

    return this.prisma.reviewCard.create({
      data: {
        tenantId,
        userId,
        sourceType: ReviewCardSource.CUSTOM,
        sourceId: randomUUID(),
        skillCodes: data.skillCodes || [],
        dueAt: new Date(),
        customContent: this.toCustomCardJson(data.customContent),
      },
    });
  }

  async upsertCustomCardFromSource(
    tenantId: string,
    userId: string,
    sourceId: string,
    data: CustomCardInput,
  ): Promise<ReviewCard> {
    const where = {
      tenantId_userId_sourceType_sourceId: {
        tenantId,
        userId,
        sourceType: ReviewCardSource.CUSTOM,
        sourceId,
      },
    };
    const existing = await this.prisma.reviewCard.findUnique({ where });
    if (!existing) {
      await this.ensureCustomCardLimit(tenantId, userId);
    }

    return this.prisma.reviewCard.upsert({
      where,
      update: {
        customContent: this.toCustomCardJson(data.customContent),
        skillCodes: data.skillCodes || [],
        isSuspended: false,
      },
      create: {
        tenantId,
        userId,
        sourceType: ReviewCardSource.CUSTOM,
        sourceId,
        skillCodes: data.skillCodes || [],
        dueAt: new Date(),
        customContent: this.toCustomCardJson(data.customContent),
      },
    });
  }

  private async ensureCustomCardLimit(tenantId: string, userId: string) {
    const currentCount = await this.prisma.reviewCard.count({
      where: {
        tenantId,
        userId,
        sourceType: ReviewCardSource.CUSTOM,
      },
    });

    if (currentCount >= MAX_CUSTOM_CARDS) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${MAX_CUSTOM_CARDS} custom cards.`,
      );
    }
  }

  async getCustomCards(tenantId: string, userId: string): Promise<ReviewCard[]> {
    return this.prisma.reviewCard.findMany({
      where: { tenantId, userId, sourceType: ReviewCardSource.CUSTOM },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCustomCard(
    tenantId: string,
    userId: string,
    cardId: string,
    data: CustomCardInput,
  ): Promise<ReviewCard> {
    const card = await this.prisma.reviewCard.findUnique({
      where: { id: cardId, tenantId, userId },
    });
    if (!card) throw new NotFoundException('Review card not found');
    if (card.sourceType !== ReviewCardSource.CUSTOM) {
      throw new ForbiddenException('Only custom cards can be updated');
    }

    return this.prisma.reviewCard.update({
      where: { id: cardId, tenantId, userId },
      data: {
        customContent: this.toCustomCardJson(data.customContent),
        skillCodes: data.skillCodes || [],
      },
    });
  }

  async deleteCustomCard(tenantId: string, userId: string, cardId: string): Promise<void> {
    const card = await this.prisma.reviewCard.findUnique({
      where: { id: cardId, tenantId, userId },
    });
    if (!card) throw new NotFoundException('Review card not found');
    if (card.sourceType !== ReviewCardSource.CUSTOM) {
      throw new ForbiddenException('Only custom cards can be deleted');
    }

    await this.prisma.reviewCard.delete({
      where: { id: cardId, tenantId, userId },
    });
  }

  async getReviewStats(
    tenantId: string,
    userId: string,
    days: number = 30,
  ): Promise<Array<{ date: string; count: number }>> {
    const windowDays = Math.min(Math.max(days, 1), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    const result = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::bigint as count
      FROM "ReviewLog"
      WHERE "tenantId" = ${tenantId}
        AND "userId" = ${userId}
        AND "createdAt" >= ${startDate}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    return result.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));
  }

  private toCustomCardJson(content: CustomCardContent): Prisma.InputJsonObject {
    const json: Record<string, string> = {
      front: content.front,
    };

    if (content.back) json.back = content.back;
    if (content.pinyin) json.pinyin = content.pinyin;
    if (content.example) json.example = content.example;

    return json;
  }
}
