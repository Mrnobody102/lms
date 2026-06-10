import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PracticeQuestionType } from '@repo/database';
import type { ModelMessage } from 'ai';
import { SkillMasteryService } from '../skill/skill-mastery.service';
import { AI_FEATURE_KEYS, AI_PROMPT_VERSIONS } from './ai-governance.constants';
import type { AiFeatureKey } from './ai-governance.constants';
import { AiGovernanceService } from './ai-governance.service';
import {
  AI_PROVIDER_TOKEN,
  MAX_BULK_FLASHCARD_COUNT,
  MIN_BULK_FLASHCARD_COUNT,
  type IAiProvider,
} from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private skillMasteryService: SkillMasteryService,
    private aiGovernance: AiGovernanceService,
    @Inject(AI_PROVIDER_TOKEN) private aiProvider: IAiProvider,
  ) {}

  async explainAnswer(
    tenantId: string,
    userId: string,
    role: string,
    questionPrompt: string,
    correctAnswer: unknown,
    userAnswer: unknown,
    skillTags?: string[],
    context?: string,
  ): Promise<string> {
    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature: AI_FEATURE_KEYS.tutorExplain,
        promptVersion: AI_PROMPT_VERSIONS.tutorExplain,
      },
      () =>
        this.aiProvider.generateExplanation({
          questionPrompt,
          correctAnswer,
          userAnswer,
          skillTags,
          context,
        }),
    );
  }

  async generatePracticeQuestions(
    tenantId: string,
    userId: string,
    role: string,
    options: import('./interfaces/ai-provider.interface').GeneratePracticeOptions,
    sourceId?: string,
  ): Promise<import('./interfaces/ai-provider.interface').GeneratedPracticeQuestion[]> {
    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature: AI_FEATURE_KEYS.practiceGenerate,
        promptVersion: AI_PROMPT_VERSIONS.practiceGenerate,
        sourceId,
        metadata: {
          questionType: options.questionType,
          requestedCount: options.count,
          skillTags: options.skillTags ?? [],
        },
      },
      () => this.aiProvider.generatePracticeQuestions(options),
    );
  }

  async generateFlashcard(
    tenantId: string,
    userId: string,
    role: string,
    front: string,
    context?: string,
  ): Promise<{ back: string; phonetics: string; example: string }> {
    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature: AI_FEATURE_KEYS.flashcardGenerate,
        promptVersion: AI_PROMPT_VERSIONS.flashcardGenerate,
      },
      () => this.aiProvider.generateFlashcard({ front, context }),
    );
  }

  async generateFlashcardsBulk(
    tenantId: string,
    userId: string,
    role: string,
    topic: string,
    count: number,
    context?: string,
  ) {
    const safeCount = normalizeFlashcardCount(count);

    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature: AI_FEATURE_KEYS.flashcardBulk,
        promptVersion: AI_PROMPT_VERSIONS.flashcardBulk,
        metadata: { requestedCount: safeCount },
      },
      async () => {
        try {
          return await this.aiProvider.generateFlashcardsBulk({
            topic,
            count: safeCount,
            context,
          });
        } catch (error) {
          this.logger.warn(
            `Bulk flashcard generation failed for tenant=${tenantId} user=${userId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          throw new BadGatewayException('Không thể sinh thẻ bằng AI lúc này. Hãy thử lại sau.');
        }
      },
    );
  }

  async generateDailyQuest(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<import('./interfaces/ai-provider.interface').GeneratedPracticeQuestion[]> {
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
    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature: AI_FEATURE_KEYS.dailyQuest,
        promptVersion: AI_PROMPT_VERSIONS.dailyQuest,
        metadata: { skillTags: skillCodes },
      },
      () =>
        this.aiProvider.generatePracticeQuestions({
          topic: `Bài tập rèn luyện kỹ năng: ${skillNames}`,
          count: 3, // We keep it bite-sized (3 questions)
          questionType: PracticeQuestionType.MULTIPLE_CHOICE,
          skillTags: skillCodes,
        }),
    );
  }

  async chatRoleplay(
    tenantId: string,
    userId: string,
    role: string,
    messages: ModelMessage[],
    systemPrompt: string,
    feature: AiFeatureKey = AI_FEATURE_KEYS.roleplayChat,
    promptVersion: string = AI_PROMPT_VERSIONS.roleplayChat,
    sourceId?: string,
  ): Promise<string> {
    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature,
        promptVersion,
        sourceId,
      },
      () => this.aiProvider.chatRoleplay(messages, systemPrompt),
    );
  }

  async evaluateRoleplaySession(
    tenantId: string,
    userId: string,
    role: string,
    messages: ModelMessage[],
    scenario: string,
    sourceId?: string,
  ): Promise<{ score: number; feedback: unknown }> {
    return this.aiGovernance.withGovernance(
      {
        tenantId,
        userId,
        role,
        feature: AI_FEATURE_KEYS.roleplayEvaluate,
        promptVersion: AI_PROMPT_VERSIONS.roleplayEvaluate,
        sourceId,
      },
      () => this.aiProvider.evaluateRoleplaySession(messages, scenario),
    );
  }
}

function normalizeFlashcardCount(count: number): number {
  if (
    !Number.isInteger(count) ||
    count < MIN_BULK_FLASHCARD_COUNT ||
    count > MAX_BULK_FLASHCARD_COUNT
  ) {
    throw new BadRequestException(
      'Số lượng thẻ phải từ ' + MIN_BULK_FLASHCARD_COUNT + ' đến ' + MAX_BULK_FLASHCARD_COUNT + '.',
    );
  }

  return count;
}
