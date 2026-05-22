import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { IAiProvider, AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN) private aiProvider: IAiProvider,
  ) {}

  private async consumeQuota(tenantId: string, userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quota = await this.prisma.aiUsageQuota.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!quota) {
      quota = await this.prisma.aiUsageQuota.create({
        data: {
          tenantId,
          userId,
          resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Reset tomorrow
          requestLimit: 50, // Default limit per user per day
        },
      });
    }

    // Reset logic
    if (quota.resetAt <= new Date()) {
      quota = await this.prisma.aiUsageQuota.update({
        where: { id: quota.id },
        data: {
          requestsUsed: 0,
          resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }

    if (quota.requestsUsed >= quota.requestLimit) {
      throw new BadRequestException(
        'Bạn đã hết lượt sử dụng Gia sư AI hôm nay. Vui lòng quay lại vào ngày mai.',
      );
    }

    await this.prisma.aiUsageQuota.update({
      where: { id: quota.id },
      data: { requestsUsed: { increment: 1 } },
    });
  }

  async explainAnswer(
    tenantId: string,
    userId: string,
    questionPrompt: string,
    correctAnswer: unknown,
    userAnswer: unknown,
    skillTags?: string[],
    context?: string,
  ): Promise<string> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.generateExplanation({
      questionPrompt,
      correctAnswer,
      userAnswer,
      skillTags,
      context,
    });
  }

  async generatePracticeQuestions(
    tenantId: string,
    userId: string,
    options: import('./interfaces/ai-provider.interface').GeneratePracticeOptions,
  ): Promise<import('./interfaces/ai-provider.interface').GeneratedPracticeQuestion[]> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.generatePracticeQuestions(options);
  }

  async chatRoleplay(
    tenantId: string,
    userId: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    systemPrompt: string,
  ): Promise<string> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.chatRoleplay(messages, systemPrompt);
  }

  async evaluateRoleplaySession(
    tenantId: string,
    userId: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.evaluateRoleplaySession(messages, scenario);
  }
}
