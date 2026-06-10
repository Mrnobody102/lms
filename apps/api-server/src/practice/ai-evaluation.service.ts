import { Injectable } from '@nestjs/common';
import { PracticeQuestionType } from '@repo/database';
import {
  AiGatewayService,
  type AiPracticeEvaluationRequest,
  type AiPracticeEvaluationResponse,
} from '../ai/ai-gateway.service';
import { AI_FEATURE_KEYS, AI_PROMPT_VERSIONS } from '../ai/ai-governance.constants';
import { AiGovernanceService } from '../ai/ai-governance.service';
import { AuditStatus } from '../common/services/audit-log.service';

export interface PracticeAiEvaluationInput {
  type: PracticeQuestionType;
  answer: string;
  correctAnswer: unknown;
  questionPrompt?: string;
  skillTags?: string[];
  courseTitle?: string;
  courseAiSettings?: unknown;
  questionId?: string;
  role?: string;
  tenantId?: string;
  userId?: string;
}

export interface PracticeAiFeedback {
  status: 'AUTO_REVIEWED' | 'PENDING_REVIEW';
  mode: PracticeQuestionType;
  matched: boolean;
  transcript: string;
  summary?: string;
  confidence?: number;
  provider?: string;
  model?: string;
}

@Injectable()
export class AiEvaluationService {
  constructor(
    private readonly aiGateway: AiGatewayService = new AiGatewayService(),
    private readonly aiGovernance?: AiGovernanceService,
  ) {}

  async evaluatePracticeAnswer(input: PracticeAiEvaluationInput): Promise<PracticeAiFeedback> {
    const fallback = this.buildFallbackFeedback(input);
    const gatewayFeedback = await this.requestGovernedGatewayFeedback(input);

    if (!gatewayFeedback) {
      return fallback;
    }

    const matched =
      typeof gatewayFeedback.matched === 'boolean' ? gatewayFeedback.matched : fallback.matched;

    return {
      status: fallback.status,
      mode: input.type,
      matched,
      transcript: gatewayFeedback.transcript ?? fallback.transcript,
      summary: gatewayFeedback.summary,
      confidence: gatewayFeedback.confidence,
      provider: gatewayFeedback.provider,
      model: gatewayFeedback.model,
    };
  }

  supportsPracticeQuestion(type: PracticeQuestionType) {
    return (
      type === PracticeQuestionType.AI_EVALUATED_AUDIO ||
      type === PracticeQuestionType.AI_EVALUATED_TEXT
    );
  }

  private buildFallbackFeedback(input: PracticeAiEvaluationInput): PracticeAiFeedback {
    return {
      status: this.canAutoReview(input.correctAnswer) ? 'AUTO_REVIEWED' : 'PENDING_REVIEW',
      mode: input.type,
      matched: this.matchesReference(input.answer, input.correctAnswer),
      transcript: input.answer,
    };
  }

  private async requestGatewayFeedback(
    input: PracticeAiEvaluationInput,
  ): Promise<AiPracticeEvaluationResponse | null> {
    try {
      return await this.aiGateway.evaluatePracticeAnswer({
        type: input.type,
        answer: input.answer,
        correctAnswer: input.correctAnswer,
        questionPrompt: input.questionPrompt,
        skillTags: input.skillTags,
        courseTitle: input.courseTitle,
        courseAiSettings: input.courseAiSettings,
      } satisfies AiPracticeEvaluationRequest);
    } catch {
      return null;
    }
  }

  private async requestGovernedGatewayFeedback(
    input: PracticeAiEvaluationInput,
  ): Promise<AiPracticeEvaluationResponse | null> {
    const runtimeConfig = this.aiGateway.getRuntimeConfig();
    if (!runtimeConfig.enabled) {
      return null;
    }

    if (!this.aiGovernance || !input.tenantId || !input.userId || !input.role) {
      return this.requestGatewayFeedback(input);
    }

    const reservation = await this.aiGovernance
      .reserve({
        tenantId: input.tenantId,
        userId: input.userId,
        role: input.role,
        feature: AI_FEATURE_KEYS.practiceEvaluate,
        promptVersion: AI_PROMPT_VERSIONS.practiceEvaluate,
        sourceId: input.questionId,
        metadata: {
          questionType: input.type,
          skillTags: input.skillTags ?? [],
        },
      })
      .catch(() => null);

    if (!reservation) {
      return null;
    }

    try {
      const feedback = await this.requestGatewayFeedback(input);
      await this.aiGovernance.recordResult(
        reservation,
        feedback ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
      );
      return feedback;
    } catch (error) {
      await this.aiGovernance.recordResult(reservation, AuditStatus.FAILURE, error);
      return null;
    }
  }

  private matchesReference(answer: string, correctAnswer: unknown) {
    if (!this.canAutoReview(correctAnswer)) {
      return false;
    }

    return normalizeText(answer) === normalizeText(correctAnswer);
  }

  private canAutoReview(correctAnswer: unknown): correctAnswer is string {
    return typeof correctAnswer === 'string' && correctAnswer.trim().length > 0;
  }
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}
