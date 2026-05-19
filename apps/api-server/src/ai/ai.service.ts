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

  async explainAnswer(
    tenantId: string,
    userId: string,
    questionPrompt: string,
    correctAnswer: unknown,
    userAnswer: unknown,
    skillTags?: string[],
    context?: string,
  ): Promise<string> {
    // 1. Check Quota
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

    // 2. Generate explanation
    const explanation = await this.aiProvider.generateExplanation({
      questionPrompt,
      correctAnswer,
      userAnswer,
      skillTags,
      context,
    });

    // 3. Update quota
    await this.prisma.aiUsageQuota.update({
      where: { id: quota.id },
      data: { requestsUsed: { increment: 1 } },
    });

    return explanation;
  }
}
