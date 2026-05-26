import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscussionTargetType, Prisma, Role } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { CreateDiscussionReplyDto } from './dto/create-discussion-reply.dto';
import { CreateDiscussionThreadDto } from './dto/create-discussion-thread.dto';
import { DiscussionQueryDto } from './dto/discussion-query.dto';
import { UpdateDiscussionReplyDto } from './dto/update-discussion-reply.dto';
import { UpdateDiscussionThreadDto } from './dto/update-discussion-thread.dto';

interface DiscussionUser {
  id: string;
  role: Role;
}

interface TargetResolution {
  lessonId?: string;
  exerciseSetId?: string;
}

const DUPLICATE_WINDOW_MS = 60_000;

@Injectable()
export class DiscussionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async listThreads(tenantId: string, user: DiscussionUser, query: DiscussionQueryDto) {
    const { page = 1, limit = 10 } = query;
    const target = await this.resolveTarget(tenantId, user, query);
    const where: Prisma.DiscussionThreadWhereInput = {
      tenantId,
      targetType: query.targetType,
      ...target,
    };

    const [threads, total] = await Promise.all([
      this.prisma.discussionThread.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }],
        include: discussionThreadInclude,
      }),
      this.prisma.discussionThread.count({ where }),
    ]);

    return {
      data: threads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createThread(tenantId: string, user: DiscussionUser, dto: CreateDiscussionThreadDto) {
    const target = await this.resolveTarget(tenantId, user, dto);
    const content = dto.content.trim();
    const title = dto.title?.trim() || null;
    await this.ensureThreadIsNotDuplicate(tenantId, user.id, dto.targetType, target, content);

    return this.prisma.discussionThread.create({
      data: {
        tenantId,
        authorId: user.id,
        targetType: dto.targetType,
        title,
        content,
        ...target,
      },
      include: discussionThreadInclude,
    });
  }

  async updateThread(
    threadId: string,
    tenantId: string,
    user: DiscussionUser,
    dto: UpdateDiscussionThreadDto,
  ) {
    const thread = await this.getAccessibleThread(threadId, tenantId, user);

    if (thread.authorId !== user.id) {
      throw new ForbiddenException('Only the thread author can edit this discussion');
    }

    const data: Prisma.DiscussionThreadUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim() || null;
    }

    if (dto.content !== undefined) {
      data.content = dto.content.trim();
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No discussion changes were provided');
    }

    return this.prisma.discussionThread.update({
      where: { id_tenantId: { id: thread.id, tenantId } },
      data,
      include: discussionThreadInclude,
    });
  }

  async deleteThread(threadId: string, tenantId: string, user: DiscussionUser) {
    const thread = await this.getAccessibleThread(threadId, tenantId, user);

    if (!this.canDeleteContent(thread.authorId, user)) {
      throw new ForbiddenException('Only the thread author or an admin can delete this discussion');
    }

    await this.prisma.discussionThread.delete({
      where: { id_tenantId: { id: thread.id, tenantId } },
    });

    return { id: thread.id };
  }

  async createReply(
    threadId: string,
    tenantId: string,
    user: DiscussionUser,
    dto: CreateDiscussionReplyDto,
  ) {
    const thread = await this.getAccessibleThread(threadId, tenantId, user);
    const content = dto.content.trim();
    await this.ensureReplyIsNotDuplicate(tenantId, user.id, thread.id, content);

    return this.prisma.discussionReply.create({
      data: {
        tenantId,
        threadId: thread.id,
        authorId: user.id,
        content,
      },
      include: discussionReplyInclude,
    });
  }

  async updateReply(
    threadId: string,
    replyId: string,
    tenantId: string,
    user: DiscussionUser,
    dto: UpdateDiscussionReplyDto,
  ) {
    const thread = await this.getAccessibleThread(threadId, tenantId, user);
    const reply = await this.getReplyInThread(replyId, thread.id, tenantId);

    if (reply.authorId !== user.id) {
      throw new ForbiddenException('Only the reply author can edit this reply');
    }

    return this.prisma.discussionReply.update({
      where: { id_tenantId: { id: reply.id, tenantId } },
      data: { content: dto.content.trim() },
      include: discussionReplyInclude,
    });
  }

  async deleteReply(threadId: string, replyId: string, tenantId: string, user: DiscussionUser) {
    const thread = await this.getAccessibleThread(threadId, tenantId, user);
    const reply = await this.getReplyInThread(replyId, thread.id, tenantId);

    if (!this.canDeleteContent(reply.authorId, user)) {
      throw new ForbiddenException('Only the reply author or an admin can delete this reply');
    }

    await this.prisma.discussionReply.delete({
      where: { id_tenantId: { id: reply.id, tenantId } },
    });

    return { id: reply.id };
  }

  async resolveThread(threadId: string, tenantId: string, user: DiscussionUser) {
    const thread = await this.getAccessibleThread(threadId, tenantId, user);
    const canResolve = thread.authorId === user.id || this.canModerateDiscussion(user);

    if (!canResolve) {
      throw new ForbiddenException(
        'Only the thread author or an admin can resolve this discussion',
      );
    }

    return this.prisma.discussionThread.update({
      where: { id_tenantId: { id: thread.id, tenantId } },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
      include: discussionThreadInclude,
    });
  }

  private async getAccessibleThread(threadId: string, tenantId: string, user: DiscussionUser) {
    const thread = await this.prisma.discussionThread.findFirst({
      where: { id: threadId, tenantId },
      select: {
        id: true,
        authorId: true,
        targetType: true,
        lessonId: true,
        exerciseSetId: true,
      },
    });

    if (!thread) {
      throw new NotFoundException(`Discussion thread with ID ${threadId} not found`);
    }

    await this.resolveTarget(tenantId, user, {
      targetType: thread.targetType,
      lessonId: thread.lessonId ?? undefined,
      exerciseSetId: thread.exerciseSetId ?? undefined,
    });

    return thread;
  }

  private async getReplyInThread(replyId: string, threadId: string, tenantId: string) {
    const reply = await this.prisma.discussionReply.findFirst({
      where: { id: replyId, threadId, tenantId },
      select: { id: true, authorId: true },
    });

    if (!reply) {
      throw new NotFoundException(`Discussion reply with ID ${replyId} not found`);
    }

    return reply;
  }

  private async ensureThreadIsNotDuplicate(
    tenantId: string,
    authorId: string,
    targetType: DiscussionTargetType,
    target: TargetResolution,
    content: string,
  ) {
    const existing = await this.prisma.discussionThread.findFirst({
      where: {
        tenantId,
        authorId,
        targetType,
        lessonId: target.lessonId,
        exerciseSetId: target.exerciseSetId,
        content,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Duplicate discussion content was posted too quickly');
    }
  }

  private async ensureReplyIsNotDuplicate(
    tenantId: string,
    authorId: string,
    threadId: string,
    content: string,
  ) {
    const existing = await this.prisma.discussionReply.findFirst({
      where: {
        tenantId,
        authorId,
        threadId,
        content,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Duplicate reply content was posted too quickly');
    }
  }

  private canDeleteContent(authorId: string, user: DiscussionUser) {
    return authorId === user.id || this.canModerateDiscussion(user);
  }

  private canModerateDiscussion(user: DiscussionUser) {
    return (
      user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN || user.role === Role.INSTRUCTOR
    );
  }

  private async resolveTarget(
    tenantId: string,
    user: DiscussionUser,
    input: {
      targetType: DiscussionTargetType;
      lessonId?: string;
      exerciseSetId?: string;
    },
  ): Promise<TargetResolution> {
    if (input.targetType === DiscussionTargetType.LESSON) {
      if (!input.lessonId) {
        throw new BadRequestException('lessonId is required for lesson discussions');
      }

      const lesson = await this.prisma.lesson.findFirst({
        where: this.learningAccess.lessonWhere(tenantId, user, input.lessonId),
        select: { id: true },
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${input.lessonId} not found`);
      }

      return { lessonId: lesson.id, exerciseSetId: undefined };
    }

    if (!input.exerciseSetId) {
      throw new BadRequestException('exerciseSetId is required for practice discussions');
    }

    const exerciseSet = await this.prisma.practiceExerciseSet.findFirst({
      where: {
        id: input.exerciseSetId,
        tenantId,
        deletedAt: null,
        ...(user.role === Role.STUDENT ? { isPublished: true } : {}),
      },
      select: { id: true, courseId: true },
    });

    if (!exerciseSet) {
      throw new NotFoundException(`Practice exercise set with ID ${input.exerciseSetId} not found`);
    }

    if (exerciseSet.courseId) {
      await this.learningAccess.ensureCourseAccess(exerciseSet.courseId, tenantId, user);
    }

    return { lessonId: undefined, exerciseSetId: exerciseSet.id };
  }
}

const discussionReplyInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      role: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.DiscussionReplyInclude;

const discussionThreadInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      role: true,
      avatarUrl: true,
    },
  },
  replies: {
    orderBy: { createdAt: 'asc' },
    include: discussionReplyInclude,
  },
  _count: {
    select: { replies: true },
  },
} satisfies Prisma.DiscussionThreadInclude;
