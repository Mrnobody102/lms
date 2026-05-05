import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@repo/database';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
  const createService = () => {
    const prisma = {
      course: {
        findFirst: vi.fn().mockResolvedValue({ id: 'course-1' }),
      },
      courseUnit: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      lesson: {
        create: vi.fn().mockResolvedValue({ id: 'lesson-1' }),
        findFirst: vi.fn().mockResolvedValue({
          id: 'lesson-1',
          courseId: 'course-1',
          tenantId: 'tenant-1',
        }),
        update: vi.fn().mockResolvedValue({ id: 'lesson-1' }),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ id: 'course-1', tenantId: 'tenant-1' }),
      lessonWhere: vi.fn().mockReturnValue({ id: 'lesson-1', tenantId: 'tenant-1' }),
    };

    return {
      prisma,
      service: new LessonService(prisma as never, learningAccess as never),
    };
  };

  it('should preserve zero duration and explicit quiz payloads when creating lessons', async () => {
    const { prisma, service } = createService();

    await service.create({
      title: 'Intro',
      courseId: 'course-1',
      tenantId: 'tenant-1',
      duration: 0,
      quiz: { questions: [] },
    });

    expect(prisma.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          duration: 0,
          quiz: { questions: [] },
        }),
      }),
    );
  });

  it('should clear quiz JSON when update receives null', async () => {
    const { prisma, service } = createService();

    await service.update('lesson-1', 'tenant-1', { quiz: null });

    expect(prisma.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quiz: Prisma.DbNull,
        }),
      }),
    );
  });
});
