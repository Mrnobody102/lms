import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ReviewCardGrade, ReviewCardSource } from '@repo/database';
import { SrsService } from './srs.service';

const NOW = new Date('2026-05-19T12:00:00.000Z');

function makePrisma(overrides: Record<string, unknown> = {}) {
  const reviewCard = {
    upsert: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    delete: vi.fn(),
  };
  const reviewLog = {
    create: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockResolvedValue([]),
  };
  const practiceQuestion = { findMany: vi.fn().mockResolvedValue([]) };
  const examQuestion = { findMany: vi.fn().mockResolvedValue([]) };
  return {
    reviewCard,
    reviewLog,
    practiceQuestion,
    examQuestion,
    ...overrides,
    $transaction: vi.fn((cb) => cb({ reviewCard, reviewLog, practiceQuestion, examQuestion })),
  };
}

describe('SrsService.scheduleNext', () => {
  const service = new SrsService({} as never);

  it('AGAIN resets reps, increases lapses, lowers EF (clamped at 1.3) and dues in 10 minutes', () => {
    const result = service.scheduleNext(
      { reps: 3, lapses: 0, easeFactor: 1.4, interval: 7 },
      ReviewCardGrade.AGAIN,
      NOW,
    );
    expect(result.reps).toBe(0);
    expect(result.lapses).toBe(1);
    expect(result.easeFactor).toBeCloseTo(1.3, 5);
    expect(result.interval).toBe(0);
    expect(result.dueAt.getTime() - NOW.getTime()).toBe(10 * 60 * 1000);
  });

  it('GOOD on a fresh card sets interval=1 day', () => {
    const result = service.scheduleNext(
      { reps: 0, lapses: 0, easeFactor: 2.5, interval: 0 },
      ReviewCardGrade.GOOD,
      NOW,
    );
    expect(result.reps).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.dueAt.getTime() - NOW.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('GOOD after first review jumps to 6 days', () => {
    const result = service.scheduleNext(
      { reps: 1, lapses: 0, easeFactor: 2.5, interval: 1 },
      ReviewCardGrade.GOOD,
      NOW,
    );
    expect(result.reps).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('GOOD after that scales by EF', () => {
    const result = service.scheduleNext(
      { reps: 5, lapses: 0, easeFactor: 2.5, interval: 10 },
      ReviewCardGrade.GOOD,
      NOW,
    );
    expect(result.reps).toBe(6);
    expect(result.interval).toBe(25); // round(10 * 2.5)
  });

  it('HARD lowers EF and uses 1.2x interval', () => {
    const result = service.scheduleNext(
      { reps: 3, lapses: 0, easeFactor: 2.5, interval: 10 },
      ReviewCardGrade.HARD,
      NOW,
    );
    expect(result.reps).toBe(4);
    expect(result.easeFactor).toBeCloseTo(2.35, 5);
    expect(result.interval).toBe(12); // round(10 * 1.2)
  });

  it('EASY raises EF and scales interval more aggressively', () => {
    const result = service.scheduleNext(
      { reps: 3, lapses: 0, easeFactor: 2.5, interval: 10 },
      ReviewCardGrade.EASY,
      NOW,
    );
    expect(result.reps).toBe(4);
    expect(result.easeFactor).toBeCloseTo(2.65, 5);
    expect(result.interval).toBe(33); // round(10 * 2.5 * 1.3)
  });
});

describe('SrsService.upsertCardsForAnswers', () => {
  it('creates cards only for incorrect answers and ignores correct ones', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.upsert.mockResolvedValue({});
    const service = new SrsService(prisma as never);

    await service.upsertCardsForAnswers('tenant-1', 'user-1', [
      {
        sourceType: ReviewCardSource.PRACTICE_QUESTION,
        questionId: 'q-1',
        skillCodes: ['VOCABULARY'],
        isCorrect: true,
      },
      {
        sourceType: ReviewCardSource.PRACTICE_QUESTION,
        questionId: 'q-2',
        skillCodes: ['VOCABULARY'],
        isCorrect: false,
      },
    ]);

    expect(prisma.reviewCard.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.reviewCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_userId_sourceType_sourceId: {
            tenantId: 'tenant-1',
            userId: 'user-1',
            sourceType: ReviewCardSource.PRACTICE_QUESTION,
            sourceId: 'q-2',
          },
        },
        update: expect.objectContaining({
          reps: 0,
          isSuspended: false,
          skillCodes: ['VOCABULARY'],
        }),
        create: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          sourceType: ReviewCardSource.PRACTICE_QUESTION,
          sourceId: 'q-2',
          skillCodes: ['VOCABULARY'],
        }),
      }),
    );
  });

  it('swallows prisma errors so submit flow is not blocked', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.upsert.mockRejectedValue(new Error('boom'));
    const service = new SrsService(prisma as never);

    await expect(
      service.upsertCardsForAnswers('tenant-1', 'user-1', [
        {
          sourceType: ReviewCardSource.PRACTICE_QUESTION,
          questionId: 'q-1',
          skillCodes: [],
          isCorrect: false,
        },
      ]),
    ).resolves.toBeUndefined();
  });

  it('is a no-op when there are no incorrect answers', async () => {
    const prisma = makePrisma();
    const service = new SrsService(prisma as never);

    await service.upsertCardsForAnswers('tenant-1', 'user-1', [
      {
        sourceType: ReviewCardSource.PRACTICE_QUESTION,
        questionId: 'q-1',
        skillCodes: [],
        isCorrect: true,
      },
    ]);

    expect(prisma.reviewCard.upsert).not.toHaveBeenCalled();
  });
});

describe('SrsService.getQueue', () => {
  it('joins polymorphic question payload by source type', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findMany.mockResolvedValue([
      {
        id: 'card-1',
        sourceType: ReviewCardSource.PRACTICE_QUESTION,
        sourceId: 'pq-1',
        skillCodes: ['VOCABULARY'],
        dueAt: new Date('2026-05-19T11:00:00.000Z'),
        reps: 0,
        lapses: 0,
        easeFactor: 2.5,
      },
      {
        id: 'card-2',
        sourceType: ReviewCardSource.EXAM_QUESTION,
        sourceId: 'eq-1',
        skillCodes: ['GRAMMAR'],
        dueAt: new Date('2026-05-19T11:00:00.000Z'),
        reps: 1,
        lapses: 0,
        easeFactor: 2.5,
      },
    ]);
    prisma.practiceQuestion.findMany.mockResolvedValue([
      {
        id: 'pq-1',
        prompt: 'Practice prompt',
        type: 'MULTIPLE_CHOICE',
        options: ['A', 'B'],
        correctAnswer: 1,
        explanation: null,
      },
    ]);
    prisma.examQuestion.findMany.mockResolvedValue([
      {
        id: 'eq-1',
        prompt: 'Exam prompt',
        type: 'FILL_BLANK',
        options: null,
        correctAnswer: 'ni hao',
        explanation: 'Greeting',
      },
    ]);
    const service = new SrsService(prisma as never);

    const queue = await service.getQueue('tenant-1', 'user-1');

    expect(queue).toHaveLength(2);
    expect(queue[0].question?.prompt).toBe('Practice prompt');
    expect(queue[1].question?.prompt).toBe('Exam prompt');
    expect(prisma.reviewCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          isSuspended: false,
          dueAt: { lte: expect.any(Date) as Date },
        }),
        orderBy: { dueAt: 'asc' },
      }),
    );
  });

  it('returns null question payload when source has been deleted', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findMany.mockResolvedValue([
      {
        id: 'card-1',
        sourceType: ReviewCardSource.PRACTICE_QUESTION,
        sourceId: 'pq-deleted',
        skillCodes: [],
        dueAt: new Date('2026-05-19T11:00:00.000Z'),
        reps: 0,
        lapses: 0,
        easeFactor: 2.5,
      },
    ]);
    const service = new SrsService(prisma as never);

    const queue = await service.getQueue('tenant-1', 'user-1');

    expect(queue[0].question).toBeNull();
  });
});

describe('SrsService.submitReview', () => {
  it('uses tenant-scoped lookup and returns NotFound outside the user scope', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findUnique.mockResolvedValue(null);
    const service = new SrsService(prisma as never);

    await expect(
      service.submitReview('tenant-1', 'user-1', 'card-1', ReviewCardGrade.GOOD),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reviewCard.findUnique).toHaveBeenCalledWith({
      where: { id: 'card-1', tenantId: 'tenant-1', userId: 'user-1' },
    });
  });

  it('throws NotFound when card is missing', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findUnique.mockResolvedValue(null);
    const service = new SrsService(prisma as never);

    await expect(
      service.submitReview('tenant-1', 'user-1', 'missing', ReviewCardGrade.GOOD),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists scheduling result and clears suspension', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findUnique.mockResolvedValue({
      id: 'card-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      reps: 0,
      lapses: 0,
      easeFactor: 2.5,
      interval: 0,
      customContent: null,
    });
    prisma.reviewCard.update.mockResolvedValue({ id: 'card-1' });
    const service = new SrsService(prisma as never);

    await service.submitReview('tenant-1', 'user-1', 'card-1', ReviewCardGrade.GOOD, 1200);

    expect(prisma.reviewCard.update).toHaveBeenCalledWith({
      where: { id: 'card-1', tenantId: 'tenant-1', userId: 'user-1' },
      data: expect.objectContaining({
        reps: 1,
        interval: 1,
        easeFactor: 2.5,
        lastGrade: ReviewCardGrade.GOOD,
        isSuspended: false,
      }),
    });
    expect(prisma.reviewLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cardId: 'card-1',
        grade: ReviewCardGrade.GOOD,
        durationMs: 1200,
        easeFactor: 2.5,
      }),
    });
  });
});

describe('SrsService Custom Cards', () => {
  it('creates custom card', async () => {
    const prisma = makePrisma();
    const service = new SrsService(prisma as never);

    await service.createCustomCard('tenant-1', 'user-1', {
      customContent: { front: 'A', back: 'B' },
      skillCodes: ['V'],
    });

    expect(prisma.reviewCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        sourceType: ReviewCardSource.CUSTOM,
        skillCodes: ['V'],
        customContent: { front: 'A', back: 'B' },
      }),
    });
  });

  it('updates custom card', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findUnique.mockResolvedValue({
      id: 'card-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      sourceType: ReviewCardSource.CUSTOM,
    });
    const service = new SrsService(prisma as never);

    await service.updateCustomCard('tenant-1', 'user-1', 'card-1', {
      customContent: { front: 'C', back: 'D' },
      skillCodes: ['G'],
    });

    expect(prisma.reviewCard.update).toHaveBeenCalledWith({
      where: { id: 'card-1', tenantId: 'tenant-1', userId: 'user-1' },
      data: expect.objectContaining({
        customContent: { front: 'C', back: 'D' },
        skillCodes: ['G'],
      }),
    });
  });

  it('deletes custom card', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.findUnique.mockResolvedValue({
      id: 'card-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      sourceType: ReviewCardSource.CUSTOM,
    });
    const service = new SrsService(prisma as never);

    await service.deleteCustomCard('tenant-1', 'user-1', 'card-1');

    expect(prisma.reviewCard.delete).toHaveBeenCalledWith({
      where: { id: 'card-1', tenantId: 'tenant-1', userId: 'user-1' },
    });
  });
});

describe('SrsService.getReviewStats', () => {
  it('groups logs by date', async () => {
    const prisma = makePrisma();
    prisma.reviewLog.findMany.mockResolvedValue([
      { createdAt: new Date('2026-05-18T10:00:00Z') },
      { createdAt: new Date('2026-05-19T10:00:00Z') },
      { createdAt: new Date('2026-05-19T11:00:00Z') },
    ]);
    const service = new SrsService(prisma as never);

    const stats = await service.getReviewStats('tenant-1', 'user-1', 7);

    expect(stats).toHaveLength(2);
    expect(stats[0].date).toBe('2026-05-18');
    expect(stats[0].count).toBe(1);
    expect(stats[1].date).toBe('2026-05-19');
    expect(stats[1].count).toBe(2);
  });
});

describe('SrsService.getDueSummary', () => {
  it('counts dueNow / dueToday / total separately', async () => {
    const prisma = makePrisma();
    prisma.reviewCard.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(20);
    const service = new SrsService(prisma as never);

    const summary = await service.getDueSummary('tenant-1', 'user-1');

    expect(summary).toEqual({ dueNow: 3, dueToday: 7, total: 20 });
    expect(prisma.reviewCard.count).toHaveBeenCalledTimes(3);
  });
});
