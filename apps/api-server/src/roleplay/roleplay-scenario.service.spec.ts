import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Role, RoleplayMode } from '@repo/database';
import { RoleplayScenarioService } from './roleplay-scenario.service';

function buildPrismaMock() {
  return {
    course: {
      findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
    },
    courseUnit: {
      findFirst: vi.fn().mockResolvedValue({ id: 'unit-1' }),
    },
    roleplayScenario: {
      create: vi.fn().mockResolvedValue({ id: 'scenario-1' }),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
    },
  };
}

describe('RoleplayScenarioService', () => {
  it('creates tenant-scoped course scenarios with safe defaults', async () => {
    const prisma = buildPrismaMock();
    const learningAccess = {
      courseWhere: vi.fn(),
    };
    const service = new RoleplayScenarioService(prisma as never, learningAccess as never);

    await service.create('tenant-1', {
      courseId: 'course-1',
      systemPrompt: 'Stay in character.',
      title: 'Restaurant',
      unitId: 'unit-1',
    });

    expect(prisma.course.findFirst).toHaveBeenCalledWith({
      where: { id: 'course-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true },
    });
    expect(prisma.courseUnit.findFirst).toHaveBeenCalledWith({
      where: { id: 'unit-1', courseId: 'course-1', tenantId: 'tenant-1', deletedAt: null },
      select: { id: true },
    });
    expect(prisma.roleplayScenario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        courseId: 'course-1',
        isPublished: false,
        mode: RoleplayMode.TEXT,
        skillTags: [],
        targetLanguage: 'zh-CN',
        tenantId: 'tenant-1',
      }),
    });
  });

  it('lists only published accessible scenarios for students', async () => {
    const prisma = buildPrismaMock();
    const courseWhere = { id: 'course-1', tenantId: 'tenant-1' };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue(courseWhere),
    };
    const service = new RoleplayScenarioService(prisma as never, learningAccess as never);

    await service.getAvailable(
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      { courseId: 'course-1', mode: RoleplayMode.MIXED },
    );

    expect(learningAccess.courseWhere).toHaveBeenCalledWith(
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      'course-1',
    );
    expect(prisma.roleplayScenario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          course: courseWhere,
          deletedAt: null,
          isPublished: true,
          mode: RoleplayMode.MIXED,
          tenantId: 'tenant-1',
        }),
      }),
    );
  });

  it('rejects inaccessible published scenario lookup', async () => {
    const prisma = buildPrismaMock();
    prisma.roleplayScenario.findFirst = vi.fn().mockResolvedValue(null);
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ id: 'course-1', tenantId: 'tenant-1' }),
    };
    const service = new RoleplayScenarioService(prisma as never, learningAccess as never);

    await expect(
      service.getPublishedForStudent(
        'tenant-1',
        { id: 'user-1', role: Role.STUDENT },
        'scenario-x',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
