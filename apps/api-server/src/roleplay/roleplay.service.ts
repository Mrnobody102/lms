import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ModelMessage } from 'ai';
import { MessageRole, Prisma, Role, RoleplayMode, RoleplaySessionStatus } from '@repo/database';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../common/services/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateRoleplayAudioMessageDto } from './dto/create-roleplay-audio-message.dto';
import { CreateRoleplaySessionDto } from './dto/create-roleplay-session.dto';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';
import { RoleplayScenarioService } from './roleplay-scenario.service';

interface RoleplayMessageForModel {
  role: MessageRole;
  content: string;
}

interface RoleplayUser {
  id: string;
  role: Role;
}

@Injectable()
export class RoleplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly scenarios: RoleplayScenarioService,
    private readonly media: MediaService,
    private readonly pronunciation: PronunciationAssessmentService,
  ) {}

  async createSession(tenantId: string, user: RoleplayUser, dto: CreateRoleplaySessionDto) {
    const config = await this.resolveSessionConfig(tenantId, user, dto);

    const session = await this.prisma.roleplaySession.create({
      data: {
        tenantId,
        userId: user.id,
        scenario: config.scenarioText,
        scenarioId: config.scenarioId,
        mode: config.mode,
        status: RoleplaySessionStatus.IN_PROGRESS,
        messages: {
          create: {
            role: MessageRole.SYSTEM,
            content: config.systemPrompt,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    if (config.openingMessage) {
      await this.prisma.roleplayMessage.create({
        data: {
          tenantId,
          sessionId: session.id,
          role: MessageRole.AI,
          content: config.openingMessage,
        },
      });
      return this.getSession(tenantId, user.id, session.id);
    }

    const aiReply = await this.aiService.chatRoleplay(
      tenantId,
      user.id,
      this.toModelMessages(session.messages),
      config.systemPrompt,
    );

    await this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId: session.id,
        role: MessageRole.AI,
        content: aiReply,
      },
    });

    return this.getSession(tenantId, user.id, session.id);
  }

  async getSessions(tenantId: string, userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.roleplaySession.findMany({
        where: { tenantId, userId },
        include: {
          scenarioRef: { select: { id: true, title: true, mode: true } },
        },
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
        scenarioRef: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            pronunciationAssessments: true,
          },
        },
        pronunciationAssessments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async sendMessage(tenantId: string, userId: string, sessionId: string, content: string) {
    const session = await this.getSession(tenantId, userId, sessionId);
    this.ensureSessionInProgress(session.status);

    const userMessage = await this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId,
        role: MessageRole.USER,
        content,
      },
    });

    const coreMessages = this.toModelMessages([...session.messages, userMessage]);
    const aiMessage = await this.createAiReply(
      tenantId,
      userId,
      sessionId,
      coreMessages,
      session.scenarioRef?.systemPrompt ?? `You are in a roleplay. Scenario: ${session.scenario}`,
    );

    return {
      ...session,
      messages: [...session.messages, userMessage, aiMessage],
    };
  }

  async sendAudioMessage(
    tenantId: string,
    userId: string,
    sessionId: string,
    dto: CreateRoleplayAudioMessageDto,
  ) {
    const session = await this.getSession(tenantId, userId, sessionId);
    this.ensureSessionInProgress(session.status);

    if (session.mode === RoleplayMode.TEXT) {
      throw new BadRequestException('This roleplay session does not accept audio messages');
    }

    const asset = await this.media.validateAudioAsset(tenantId, dto.mediaAssetId);
    const content = dto.content?.trim() || dto.expectedText?.trim() || '[audio]';

    const userMessage = await this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId,
        role: MessageRole.USER,
        content,
        audioMediaAssetId: asset.id,
      },
    });

    await this.pronunciation.createAndAssess({
      tenantId,
      sessionId,
      messageId: userMessage.id,
      mediaAssetId: asset.id,
      mediaUrl: asset.url,
      expectedText: dto.expectedText,
      targetLanguage: session.scenarioRef?.targetLanguage ?? 'en-US',
    });

    const coreMessages = this.toModelMessages([...session.messages, userMessage]);
    await this.createAiReply(
      tenantId,
      userId,
      sessionId,
      coreMessages,
      session.scenarioRef?.systemPrompt ?? `You are in a roleplay. Scenario: ${session.scenario}`,
    );

    return this.getSession(tenantId, userId, sessionId);
  }

  async getPronunciationAssessments(tenantId: string, userId: string, sessionId: string) {
    await this.getSession(tenantId, userId, sessionId);
    return this.pronunciation.listForSession(tenantId, sessionId);
  }

  async completeSession(tenantId: string, userId: string, sessionId: string) {
    const session = await this.getSession(tenantId, userId, sessionId);

    if (session.status === RoleplaySessionStatus.COMPLETED) {
      return session;
    }

    const evaluation = await this.aiService.evaluateRoleplaySession(
      tenantId,
      userId,
      this.toModelMessages(session.messages),
      session.scenario,
    );
    const pronunciationScore = this.averagePronunciationScore(session.pronunciationAssessments);

    await this.prisma.roleplaySession.update({
      where: { id: sessionId, tenantId, userId },
      data: {
        status: RoleplaySessionStatus.COMPLETED,
        completedAt: new Date(),
        score: evaluation.score,
        pronunciationScore,
        feedback: evaluation.feedback as Prisma.InputJsonValue,
      },
    });

    return this.getSession(tenantId, userId, sessionId);
  }

  private async createAiReply(
    tenantId: string,
    userId: string,
    sessionId: string,
    messages: ModelMessage[],
    systemPrompt: string,
  ) {
    const aiReply = await this.aiService.chatRoleplay(tenantId, userId, messages, systemPrompt);

    return this.prisma.roleplayMessage.create({
      data: {
        tenantId,
        sessionId,
        role: MessageRole.AI,
        content: aiReply,
      },
    });
  }

  private async resolveSessionConfig(
    tenantId: string,
    user: RoleplayUser,
    dto: CreateRoleplaySessionDto,
  ) {
    if (dto.scenarioId) {
      const scenario = await this.scenarios.getPublishedForStudent(tenantId, user, dto.scenarioId);
      const requestedMode = dto.mode ?? scenario.mode;
      if (scenario.mode !== RoleplayMode.MIXED && requestedMode !== scenario.mode) {
        throw new BadRequestException('Requested mode is not supported by this scenario');
      }

      return {
        scenarioId: scenario.id,
        scenarioText: scenario.title,
        systemPrompt: scenario.systemPrompt,
        openingMessage: scenario.openingMessage,
        mode: requestedMode,
      };
    }

    const scenario = dto.scenario?.trim();
    if (!scenario) {
      throw new BadRequestException('scenarioId or scenario is required');
    }

    return {
      scenarioId: undefined,
      scenarioText: scenario,
      systemPrompt: `You are participating in a roleplay scenario: ${scenario}. Start the conversation naturally.`,
      openingMessage: undefined,
      mode: dto.mode ?? RoleplayMode.TEXT,
    };
  }

  private ensureSessionInProgress(status: RoleplaySessionStatus) {
    if (status !== RoleplaySessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is already completed');
    }
  }

  private averagePronunciationScore(
    assessments: Array<{ overallScore: number | null; status: string }>,
  ) {
    const scores = assessments
      .map((assessment) => assessment.overallScore)
      .filter((score): score is number => typeof score === 'number');

    if (scores.length === 0) {
      return undefined;
    }

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
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
