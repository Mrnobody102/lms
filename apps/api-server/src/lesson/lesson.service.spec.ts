import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { LearningActivityType, LessonType, ProgressStatus, Role } from '@repo/database';
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
          practiceExerciseSetId: null,
          examId: null,
          tenantId: 'tenant-1',
          type: LessonType.text,
          content: 'Lesson content',
        }),
        update: vi.fn().mockResolvedValue({ id: 'lesson-1' }),
      },
      practiceExerciseSet: {
        findFirst: vi.fn(),
      },
      exam: {
        findFirst: vi.fn(),
      },
      learningActivity: {
        create: vi.fn().mockResolvedValue({ id: 'activity-1' }),
      },
      userLessonProgress: {
        upsert: vi.fn(),
      },
    };
    const learningAccess = {
      courseWhere: vi.fn().mockReturnValue({ id: 'course-1', tenantId: 'tenant-1' }),
      lessonWhere: vi.fn().mockReturnValue({ id: 'lesson-1', tenantId: 'tenant-1' }),
    };
    const srs = {
      upsertCustomCardFromSource: vi.fn(),
    };

    return {
      prisma,
      srs,
      service: new LessonService(prisma as never, learningAccess as never, srs as never),
    };
  };

  it('should preserve zero duration when creating lessons', async () => {
    const { prisma, service } = createService();

    await service.create({
      title: 'Intro',
      courseId: 'course-1',
      tenantId: 'tenant-1',
      duration: 0,
    });

    expect(prisma.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          duration: 0,
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

  it('should attach a standalone practice exercise set to a practice lesson', async () => {
    const { prisma, service } = createService();
    prisma.practiceExerciseSet.findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'set-1', courseId: null });

    await service.create({
      title: 'Practice',
      type: LessonType.practice,
      courseId: 'course-1',
      tenantId: 'tenant-1',
      practiceExerciseSetId: 'set-1',
    });

    expect(prisma.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: LessonType.practice,
          practiceExerciseSetId: 'set-1',
          examId: null,
        }),
      }),
    );
  });

  it('should reject a practice exercise set from another course', async () => {
    const { prisma, service } = createService();
    prisma.practiceExerciseSet.findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'set-1', courseId: 'course-2' });

    await expect(
      service.create({
        title: 'Practice',
        type: LessonType.practice,
        courseId: 'course-1',
        tenantId: 'tenant-1',
        practiceExerciseSetId: 'set-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should track micro-card completion and complete lesson progress', async () => {
    const { prisma, service } = createService();
    prisma.lesson.findFirst = vi.fn().mockResolvedValue({
      id: 'lesson-1',
      courseId: 'course-1',
      type: LessonType.micro_card,
      content: JSON.stringify({ cards: [{ id: 'card-1', front: '你', back: 'you' }] }),
    });

    await service.trackMicroCardEvent(
      'lesson-1',
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      {
        cardKey: 'card-1',
        durationMs: 1201,
        eventType: LearningActivityType.MICRO_CARD_COMPLETED,
      },
    );

    expect(prisma.learningActivity.create).toHaveBeenCalledWith({
      data: {
        courseId: 'course-1',
        lessonId: 'lesson-1',
        tenantId: 'tenant-1',
        timeSpentSeconds: 2,
        type: LearningActivityType.MICRO_CARD_COMPLETED,
        userId: 'user-1',
      },
    });
    expect(prisma.userLessonProgress.upsert).toHaveBeenCalledWith({
      where: {
        tenantId_userId_lessonId: {
          lessonId: 'lesson-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
        },
      },
      update: { status: ProgressStatus.COMPLETED },
      create: {
        lessonId: 'lesson-1',
        status: ProgressStatus.COMPLETED,
        tenantId: 'tenant-1',
        userId: 'user-1',
      },
    });
  });

  it('should add an individual micro-card to SRS review', async () => {
    const { prisma, service, srs } = createService();
    prisma.lesson.findFirst = vi.fn().mockResolvedValue({
      id: 'lesson-1',
      courseId: 'course-1',
      type: LessonType.micro_card,
      content: JSON.stringify({
        cards: [{ id: 'card-1', front: '好', pinyin: 'hao3', back: 'good', example: '你好' }],
      }),
    });

    await service.addMicroCardToReview(
      'lesson-1',
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      'card-1',
    );

    expect(srs.upsertCustomCardFromSource).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
      'lesson-1:card-1',
      {
        customContent: {
          back: 'good',
          example: '你好',
          front: '好',
          phonetics: 'hao3',
        },
        skillCodes: [],
      },
    );
  });
});
