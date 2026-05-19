import { describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { SkillService } from './skill.service';

describe('SkillService', () => {
  it('lists active skills scoped to tenant ordered by sortOrder', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'skill-1', code: 'VOCABULARY', sortOrder: 10 }]);
    const prisma = { skill: { findMany } };
    const service = new SkillService(prisma as never);

    const result = await service.list('tenant-1');

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
    expect(result).toHaveLength(1);
  });

  it('includes inactive skills when admin opts in', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { skill: { findMany } };
    const service = new SkillService(prisma as never);

    await service.list('tenant-1', { includeInactive: true });

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  });

  it('creates a skill and forwards canonical fields', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'skill-1',
      tenantId: 'tenant-1',
      code: 'VOCABULARY',
      name: 'Vocabulary',
    });
    const prisma = { skill: { create } };
    const service = new SkillService(prisma as never);

    const result = await service.create('tenant-1', {
      code: 'VOCABULARY',
      name: 'Vocabulary',
      nameVi: 'Từ vựng',
      color: '#22c55e',
      sortOrder: 10,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        code: 'VOCABULARY',
        name: 'Vocabulary',
        nameVi: 'Từ vựng',
        color: '#22c55e',
        description: undefined,
        sortOrder: 10,
        isActive: true,
      },
    });
    expect(result.id).toBe('skill-1');
  });

  it('translates duplicate code error into ConflictException', async () => {
    const knownError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const create = vi.fn().mockRejectedValue(knownError);
    const prisma = { skill: { create } };
    const service = new SkillService(prisma as never);

    await expect(
      service.create('tenant-1', { code: 'VOCABULARY', name: 'Vocabulary' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when updating a missing skill', async () => {
    const prisma = {
      skill: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
    };
    const service = new SkillService(prisma as never);

    await expect(
      service.update('tenant-1', '00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.skill.update).not.toHaveBeenCalled();
  });

  it('soft-deletes a skill by setting deletedAt and isActive=false', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'skill-1', tenantId: 'tenant-1', code: 'VOCABULARY' });
    const update = vi.fn().mockResolvedValue({ id: 'skill-1', deletedAt: new Date() });
    const prisma = { skill: { findFirst, update } };
    const service = new SkillService(prisma as never);

    await service.softDelete('tenant-1', 'skill-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'skill-1' },
      data: { deletedAt: expect.any(Date) as Date, isActive: false },
    });
  });
});
