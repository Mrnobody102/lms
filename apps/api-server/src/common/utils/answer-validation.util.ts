import { BadRequestException } from '@nestjs/common';
import { ExamQuestionType, PracticeQuestionType } from '@repo/database';

export type AnswerQuestionType = PracticeQuestionType | ExamQuestionType;

export const ANSWER_LIMITS = {
  maxOptions: 20,
  maxOptionLength: 1000,
  maxFillBlankLength: 1000,
  maxAiAnswerLength: 5000,
  maxSkillTags: 10,
  maxSubmittedAnswers: 200,
  maxPracticeSetQuestions: 100,
  maxExamSections: 20,
  maxExamSectionQuestions: 100,
} as const;

export interface NormalizedQuestionPayload {
  options?: string[];
  correctAnswer: number | string;
}

export function normalizeQuestionPayload(input: {
  type: AnswerQuestionType;
  options?: unknown;
  correctAnswer: unknown;
}): NormalizedQuestionPayload {
  if (isMultipleChoice(input.type)) {
    const options = normalizeOptions(input.options);
    const correctAnswer = normalizeMultipleChoiceAnswer(input.correctAnswer, options.length);
    return { options, correctAnswer };
  }

  if (input.options !== undefined) {
    throw new BadRequestException('Fill-blank questions must not include answer options');
  }

  return {
    correctAnswer: isAiEvaluatedQuestion(input.type)
      ? normalizeAiAnswer(input.correctAnswer, 'Correct answer')
      : normalizeFillBlankAnswer(input.correctAnswer, 'Correct answer'),
  };
}

export function normalizeSubmittedAnswer(input: {
  type: AnswerQuestionType;
  answer: unknown;
  options?: unknown;
}): number | string {
  if (isMultipleChoice(input.type)) {
    const options = normalizeOptions(input.options);
    return normalizeMultipleChoiceAnswer(input.answer, options.length);
  }

  return isAiEvaluatedQuestion(input.type)
    ? normalizeAiAnswer(input.answer, 'Submitted answer')
    : normalizeFillBlankAnswer(input.answer, 'Submitted answer');
}

export function isNormalizedAnswerCorrect(input: {
  type: AnswerQuestionType;
  answer: number | string;
  correctAnswer: unknown;
}): boolean {
  if (isMultipleChoice(input.type)) {
    return input.answer === normalizeMultipleChoiceAnswer(input.correctAnswer);
  }

  return normalizeText(input.answer) === normalizeText(input.correctAnswer);
}

function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException('Multiple-choice questions require answer options');
  }

  if (value.length < 2 || value.length > ANSWER_LIMITS.maxOptions) {
    throw new BadRequestException(
      `Multiple-choice questions require 2-${ANSWER_LIMITS.maxOptions} options`,
    );
  }

  return value.map((option) => {
    if (typeof option !== 'string') {
      throw new BadRequestException('Multiple-choice options must be strings');
    }

    const normalized = option.trim();
    if (!normalized) {
      throw new BadRequestException('Multiple-choice options must not be empty');
    }

    if (normalized.length > ANSWER_LIMITS.maxOptionLength) {
      throw new BadRequestException(
        `Multiple-choice options must be at most ${ANSWER_LIMITS.maxOptionLength} characters`,
      );
    }

    return normalized;
  });
}

function normalizeMultipleChoiceAnswer(value: unknown, optionCount?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException('Multiple-choice answers must be integer option indexes');
  }

  if (value < 0 || (optionCount !== undefined && value >= optionCount)) {
    throw new BadRequestException('Multiple-choice answer index is outside the option range');
  }

  return value;
}

function normalizeFillBlankAnswer(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} must be text`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new BadRequestException(`${label} must not be empty`);
  }

  if (normalized.length > ANSWER_LIMITS.maxFillBlankLength) {
    throw new BadRequestException(
      `${label} must be at most ${ANSWER_LIMITS.maxFillBlankLength} characters`,
    );
  }

  return normalized;
}

function normalizeAiAnswer(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} must be text`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new BadRequestException(`${label} must not be empty`);
  }

  if (normalized.length > ANSWER_LIMITS.maxAiAnswerLength) {
    throw new BadRequestException(
      `${label} must be at most ${ANSWER_LIMITS.maxAiAnswerLength} characters`,
    );
  }

  return normalized;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase();
}

function isMultipleChoice(type: AnswerQuestionType): boolean {
  return String(type) === 'MULTIPLE_CHOICE';
}

function isAiEvaluatedQuestion(type: AnswerQuestionType): boolean {
  return String(type) === 'AI_EVALUATED_AUDIO' || String(type) === 'AI_EVALUATED_TEXT';
}
