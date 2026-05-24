import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Prisma, LessonType } from '@repo/database';
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
          type: LessonType.text,
          content: 'Lesson content',
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

  it('should reject invalid micro-card content when creating lessons', async () => {
    const { service } = createService();

    await expect(
      service.create({
        title: 'Flashcards',
        type: LessonType.micro_card,
        courseId: 'course-1',
        tenantId: 'tenant-1',
        content: JSON.stringify({ cards: [{ front: 'missing back' }] }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should accept valid legacy micro-card content when updating lessons', async () => {
    const { prisma, service } = createService();

    await service.update('lesson-1', 'tenant-1', {
      type: LessonType.micro_card,
      content: JSON.stringify({ front: '你', back: 'you' }),
    });

    expect(prisma.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: LessonType.micro_card,
          content: JSON.stringify({ front: '你', back: 'you' }),
        }),
      }),
    );
  });
});
