import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ModelMessage } from 'ai';
import { MessageRole, Prisma, RoleplaySessionStatus } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { AiService } from '../ai/ai.service';

interface RoleplayMessageForModel {
  role: MessageRole;
  content: string;
}

@Injectable()
export class RoleplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createSession(tenantId: string, userId: string, scenario: string) {
    const session = await this.prisma.roleplaySession.create({
      data: {
        tenantId,
        userId,
        scenario,
        status: RoleplaySessionStatus.IN_PROGRESS,
        messages: {
          create: {
            role: MessageRole.SYSTEM,
            content: `You are participating in a roleplay scenario: ${scenario}. Start the conversation naturally.`,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    const coreMessages = this.toModelMessages(session.messages);

    const aiReply = await this.aiService.chatRoleplay(
      tenantId,
      userId,
      coreMessages,
      `You are in a roleplay. Scenario: ${scenario}`,
    );

    await this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId: session.id,
        role: MessageRole.AI,
        content: aiReply,
      },
    });

    return this.getSession(tenantId, userId, session.id);
  }

  async getSessions(tenantId: string, userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.roleplaySession.findMany({
        where: { tenantId, userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.roleplaySession.count({
        where: { tenantId, userId },
      }),
    ]);

    return { data, total };
  }

  async getSession(tenantId: string, userId: string, sessionId: string) {
    const session = await this.prisma.roleplaySession.findUnique({
      where: { id: sessionId, tenantId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async sendMessage(tenantId: string, userId: string, sessionId: string, content: string) {
    const session = await this.getSession(tenantId, userId, sessionId);

    if (session.status !== RoleplaySessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is already completed');
    }

    const userMessage = await this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId,
        role: MessageRole.USER,
        content,
      },
    });

    const coreMessages = this.toModelMessages([...session.messages, userMessage]);

    const aiReply = await this.aiService.chatRoleplay(
      tenantId,
      userId,
      coreMessages,
      `You are in a roleplay. Scenario: ${session.scenario}`,
    );

    const aiMessage = await this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId,
        role: MessageRole.AI,
        content: aiReply,
      },
    });

    return {
      ...session,
      messages: [...session.messages, userMessage, aiMessage],
    };
  }

  async completeSession(tenantId: string, userId: string, sessionId: string) {
    const session = await this.getSession(tenantId, userId, sessionId);

    if (session.status === RoleplaySessionStatus.COMPLETED) {
      return session; // Already completed
    }

    const coreMessages = this.toModelMessages(session.messages);

    const evaluation = await this.aiService.evaluateRoleplaySession(
      tenantId,
      userId,
      coreMessages,
      session.scenario,
    );

    const updatedSession = await this.prisma.roleplaySession.update({
      where: { id: sessionId, tenantId, userId },
      data: {
        status: RoleplaySessionStatus.COMPLETED,
        completedAt: new Date(),
        score: evaluation.score,
        feedback: evaluation.feedback as Prisma.InputJsonValue,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return updatedSession;
  }

  private toModelMessages(messages: RoleplayMessageForModel[]): ModelMessage[] {
    return messages.map((message) => ({
      role: this.toModelRole(message.role),
      content: message.content,
    }));
  }

  private toModelRole(role: MessageRole): 'user' | 'assistant' | 'system' {
    if (role === MessageRole.USER) return 'user';
    if (role === MessageRole.AI) return 'assistant';
    return 'system';
  }
}
