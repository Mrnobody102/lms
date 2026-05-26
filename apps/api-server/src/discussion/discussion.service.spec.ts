import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscussionTargetType, Role } from '@repo/database';
import { describe, expect, it, vi } from 'vitest';
import { DiscussionService } from './discussion.service';

describe('DiscussionService', () => {
  const createService = () => {
    const prisma = {
      discussionThread: {
        create: vi.fn().mockResolvedValue({ id: 'thread-1' }),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockImplementation((args?: { where?: { content?: string } }) => {
          if (args?.where?.content) {
            return Promise.resolve(null);
          }

          return Promise.resolve({
            id: 'thread-1',
            authorId: 'student-1',
            targetType: DiscussionTargetType.LESSON,
            lessonId: 'lesson-1',
            exerciseSetId: null,
          });
        }),
        update: vi.fn().mockResolvedValue({ id: 'thread-1', isResolved: true }),
        delete: vi.fn().mockResolvedValue({ id: 'thread-1' }),
      },
      discussionReply: {
        create: vi.fn().mockResolvedValue({ id: 'reply-1' }),
        findFirst: vi.fn().mockImplementation((args?: { where?: { content?: string } }) => {
          if (args?.where?.content) {
            return Promise.resolve(null);
          }

          return Promise.resolve({ id: 'reply-1', authorId: 'student-1' });
        }),
        update: vi.fn().mockResolvedValue({ id: 'reply-1' }),
        delete: vi.fn().mockResolvedValue({ id: 'reply-1' }),
      },
      lesson: {
        findFirst: vi.fn().mockResolvedValue({ id: 'lesson-1' }),
      },
      practiceExerciseSet: {
        findFirst: vi.fn().mockResolvedValue({ id: 'set-1', courseId: 'course-1' }),
      },
    };
    const learningAccess = {
      lessonWhere: vi.fn().mockReturnValue({ id: 'lesson-1', tenantId: 'tenant-1' }),
      ensureCourseAccess: vi.fn().mockResolvedValue(undefined),
    };

    return {
      prisma,
      learningAccess,
      service: new DiscussionService(prisma as never, learningAccess as never),
    };
  };

  it('creates a lesson discussion with tenant and author context', async () => {
    const { prisma, learningAccess, service } = createService();

    await service.createThread(
      'tenant-1',
      { id: 'student-1', role: Role.STUDENT },
      {
        targetType: DiscussionTargetType.LESSON,
        lessonId: 'lesson-1',
        title: 'Question',
        content: 'How does this work?',
      },
    );

    expect(learningAccess.lessonWhere).toHaveBeenCalledWith(
      'tenant-1',
      { id: 'student-1', role: Role.STUDENT },
      'lesson-1',
    );
    expect(prisma.discussionThread.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          authorId: 'student-1',
          lessonId: 'lesson-1',
          content: 'How does this work?',
        }),
      }),
    );
  });

  it('requires the correct target id for lesson discussions', async () => {
    const { service } = createService();

    await expect(
      service.createThread(
        'tenant-1',
        { id: 'student-1', role: Role.STUDENT },
        {
          targetType: DiscussionTargetType.LESSON,
          content: 'Missing lesson',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('checks course access before creating a practice discussion', async () => {
    const { learningAccess, service } = createService();

    await service.createThread(
      'tenant-1',
      { id: 'student-1', role: Role.STUDENT },
      {
        targetType: DiscussionTargetType.PRACTICE_EXERCISE_SET,
        exerciseSetId: 'set-1',
        content: 'Practice question',
      },
    );

    expect(learningAccess.ensureCourseAccess).toHaveBeenCalledWith('course-1', 'tenant-1', {
      id: 'student-1',
      role: Role.STUDENT,
    });
  });

  it('throws NotFoundException when the thread does not exist for replies', async () => {
    const { prisma, service } = createService();
    prisma.discussionThread.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createReply(
        'missing-thread',
        'tenant-1',
        { id: 'student-1', role: Role.STUDENT },
        {
          content: 'Reply',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows the author to edit their discussion thread', async () => {
    const { prisma, service } = createService();

    await service.updateThread(
      'thread-1',
      'tenant-1',
      { id: 'student-1', role: Role.STUDENT },
      {
        title: 'Updated',
        content: 'Updated discussion',
      },
    );

    expect(prisma.discussionThread.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_tenantId: { id: 'thread-1', tenantId: 'tenant-1' } },
        data: {
          title: 'Updated',
          content: 'Updated discussion',
        },
      }),
    );
  });

  it('allows admins to delete spam threads', async () => {
    const { prisma, service } = createService();

    await service.deleteThread('thread-1', 'tenant-1', { id: 'admin-1', role: Role.ADMIN });

    expect(prisma.discussionThread.delete).toHaveBeenCalledWith({
      where: { id_tenantId: { id: 'thread-1', tenantId: 'tenant-1' } },
    });
  });

  it('blocks duplicate replies from the same author in a short window', async () => {
    const { prisma, service } = createService();
    prisma.discussionReply.findFirst.mockResolvedValueOnce({
      id: 'reply-duplicate',
      authorId: 'student-1',
    });

    await expect(
      service.createReply(
        'thread-1',
        'tenant-1',
        { id: 'student-1', role: Role.STUDENT },
        {
          content: 'Reply',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
