import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import type { ModelMessage } from 'ai';
import { PrismaService } from '../common/services/prisma.service';
import { SkillMasteryService } from '../skill/skill-mastery.service';
import { IAiProvider, AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private skillMasteryService: SkillMasteryService,
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
        where: { tenantId_userId: { tenantId, userId } },
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
      where: { tenantId_userId: { tenantId, userId } },
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

  async generateFlashcard(
    tenantId: string,
    userId: string,
    front: string,
    context?: string,
  ): Promise<{ back: string; phonetics: string; example: string }> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.generateFlashcard({ front, context });
  }

  async generateDailyQuest(
    tenantId: string,
    userId: string,
  ): Promise<import('./interfaces/ai-provider.interface').GeneratedPracticeQuestion[]> {
    await this.consumeQuota(tenantId, userId);

    // 1. Get weakest skills (limit to 1 or 2 to keep the quest focused)
    const weakestSkills = await this.skillMasteryService.getWeakestSkills(tenantId, userId, 2);

    // 2. Format skill topics and tags
    const skillNames = weakestSkills
      .map((s) => s?.nameVi || s?.name)
      .filter(Boolean)
      .join(' và ');
    const skillCodes = weakestSkills.map((s) => s?.code).filter(Boolean) as string[];

    if (!skillNames) {
      throw new BadRequestException('Không tìm thấy kỹ năng nào để tạo Daily Quest.');
    }

    // 3. Generate 3-5 questions via AI
    return this.aiProvider.generatePracticeQuestions({
      topic: `Bài tập rèn luyện kỹ năng: ${skillNames}`,
      count: 3, // We keep it bite-sized (3 questions)
      questionType: 'MULTIPLE_CHOICE', // For simplicity in MVP, we can randomly choose or stick to MC
      skillTags: skillCodes,
    });
  }

  async chatRoleplay(
    tenantId: string,
    userId: string,
    messages: ModelMessage[],
    systemPrompt: string,
  ): Promise<string> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.chatRoleplay(messages, systemPrompt);
  }

  async evaluateRoleplaySession(
    tenantId: string,
    userId: string,
    messages: ModelMessage[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }> {
    await this.consumeQuota(tenantId, userId);
    return this.aiProvider.evaluateRoleplaySession(messages, scenario);
  }
}
