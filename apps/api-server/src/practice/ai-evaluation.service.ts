import { Injectable } from '@nestjs/common';
import { PracticeQuestionType } from '@repo/database';

export interface PracticeAiEvaluationInput {
  type: PracticeQuestionType;
  answer: string;
  correctAnswer: unknown;
}

export interface PracticeAiFeedback {
  status: 'AUTO_REVIEWED' | 'PENDING_REVIEW';
  mode: PracticeQuestionType;
  matched: boolean;
  transcript: string;
}

@Injectable()
export class AiEvaluationService {
  evaluatePracticeAnswer(input: PracticeAiEvaluationInput): PracticeAiFeedback {
    return {
      status: this.canAutoReview(input.correctAnswer) ? 'AUTO_REVIEWED' : 'PENDING_REVIEW',
      mode: input.type,
      matched: this.matchesReference(input.answer, input.correctAnswer),
      transcript: input.answer,
    };
  }

  supportsPracticeQuestion(type: PracticeQuestionType) {
    return (
      type === PracticeQuestionType.AI_EVALUATED_AUDIO ||
      type === PracticeQuestionType.AI_EVALUATED_TEXT
    );
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
