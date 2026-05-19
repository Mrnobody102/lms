import { describe, expect, it, vi } from 'vitest';
import { SkillMasteryService } from './skill-mastery.service';

describe('SkillMasteryService', () => {
  it('bootstraps mastery from first batch when no existing record', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({});
    const update = vi.fn();
    const prisma = { skillMastery: { findUnique, create, update, findMany: vi.fn() } };
    const service = new SkillMasteryService(prisma as never);

    await service.applyAnswerEvents('tenant-1', 'user-1', [
      { skillCodes: ['VOCABULARY'], isCorrect: true },
      { skillCodes: ['VOCABULARY'], isCorrect: false },
      { skillCodes: ['VOCABULARY'], isCorrect: true },
      { skillCodes: ['VOCABULARY'], isCorrect: true },
    ]);

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        skillCode: 'VOCABULARY',
        mastery: 0.75,
        attempts: 4,
        correctAttempts: 3,
      },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('updates existing mastery using EWMA with alpha=0.7', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'mastery-1',
      mastery: 0.5,
      attempts: 4,
      correctAttempts: 2,
    });
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn();
    const prisma = { skillMastery: { findUnique, create, update, findMany: vi.fn() } };
    const service = new SkillMasteryService(prisma as never);

    await service.applyAnswerEvents('tenant-1', 'user-1', [
      { skillCodes: ['VOCABULARY'], isCorrect: true },
      { skillCodes: ['VOCABULARY'], isCorrect: true },
    ]);

    // EWMA: 0.7*0.5 + 0.3*1.0 = 0.65
    expect(update).toHaveBeenCalledWith({
      where: { id: 'mastery-1' },
      data: { mastery: 0.65, attempts: 6, correctAttempts: 4 },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('aggregates events across multiple skills independently', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({});
    const prisma = {
      skillMastery: { findUnique, create, update: vi.fn(), findMany: vi.fn() },
    };
    const service = new SkillMasteryService(prisma as never);

    await service.applyAnswerEvents('tenant-1', 'user-1', [
      { skillCodes: ['VOCABULARY', 'GRAMMAR'], isCorrect: true },
      { skillCodes: ['GRAMMAR'], isCorrect: false },
    ]);

    expect(create).toHaveBeenCalledTimes(2);
    const codes = create.mock.calls.map((call) => call[0].data.skillCode);
    expect(codes).toEqual(expect.arrayContaining(['VOCABULARY', 'GRAMMAR']));
  });

  it('skips events with no skill codes silently', async () => {
    const findUnique = vi.fn();
    const create = vi.fn();
    const prisma = {
      skillMastery: { findUnique, create, update: vi.fn(), findMany: vi.fn() },
    };
    const service = new SkillMasteryService(prisma as never);

    await service.applyAnswerEvents('tenant-1', 'user-1', [
      { skillCodes: [], isCorrect: true },
      { skillCodes: [''], isCorrect: false },
    ]);

    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('swallows prisma errors so submit flow is not blocked', async () => {
    const findUnique = vi.fn().mockRejectedValue(new Error('boom'));
    const prisma = {
      skillMastery: { findUnique, create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    };
    const service = new SkillMasteryService(prisma as never);

    await expect(
      service.applyAnswerEvents('tenant-1', 'user-1', [
        { skillCodes: ['VOCABULARY'], isCorrect: true },
      ]),
    ).resolves.toBeUndefined();
  });

  it('returns mastery list ordered by mastery ascending', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'mastery-1', mastery: 0.2 }]);
    const prisma = { skillMastery: { findMany } };
    const service = new SkillMasteryService(prisma as never);

    const result = await service.getStudentMastery('tenant-1', 'user-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', userId: 'user-1' },
        orderBy: [{ mastery: 'asc' }, { skillCode: 'asc' }],
      }),
    );
    expect(result).toHaveLength(1);
  });
});
