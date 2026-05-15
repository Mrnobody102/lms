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
  options?: unknown;
  correctAnswer: unknown;
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

  if (isMatching(input.type)) {
    const options = normalizeMatchingOptions(input.options);
    const correctAnswer = normalizeMatchingAnswer(input.correctAnswer);
    return { options, correctAnswer };
  }

  if (isOrdering(input.type)) {
    const options = normalizeOptions(input.options);
    const correctAnswer = normalizeOrderingAnswer(input.correctAnswer, options);
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
}): unknown {
  if (isMultipleChoice(input.type)) {
    const options = normalizeOptions(input.options);
    return normalizeMultipleChoiceAnswer(input.answer, options.length);
  }

  if (isMatching(input.type)) {
    return normalizeMatchingAnswer(input.answer);
  }

  if (isOrdering(input.type)) {
    const options = normalizeOptions(input.options);
    return normalizeOrderingAnswer(input.answer, options);
  }

  return isAiEvaluatedQuestion(input.type)
    ? normalizeAiAnswer(input.answer, 'Submitted answer')
    : normalizeFillBlankAnswer(input.answer, 'Submitted answer');
}

export function isNormalizedAnswerCorrect(input: {
  type: AnswerQuestionType;
  answer: unknown;
  correctAnswer: unknown;
}): boolean {
  if (isMultipleChoice(input.type)) {
    return input.answer === normalizeMultipleChoiceAnswer(input.correctAnswer);
  }

  if (isMatching(input.type)) {
    const answer = normalizeMatchingAnswer(input.answer);
    const correct = normalizeMatchingAnswer(input.correctAnswer);
    if (Object.keys(answer).length !== Object.keys(correct).length) return false;
    for (const key in correct) {
      if (answer[key] !== correct[key]) return false;
    }
    return true;
  }

  if (isOrdering(input.type)) {
    const answer = input.answer as string[];
    const correct = input.correctAnswer as string[];
    if (!Array.isArray(answer) || !Array.isArray(correct)) return false;
    if (answer.length !== correct.length) return false;
    for (let i = 0; i < correct.length; i++) {
      if (answer[i] !== correct[i]) return false;
    }
    return true;
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

function isMatching(type: AnswerQuestionType): boolean {
  return String(type) === 'MATCHING';
}

function isOrdering(type: AnswerQuestionType): boolean {
  return String(type) === 'ORDERING';
}

function normalizeMatchingOptions(value: unknown): { left: string[]; right: string[] } {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Matching questions require options object');
  }

  const { left, right } = value as { left?: unknown; right?: unknown };
  if (!Array.isArray(left) || !Array.isArray(right)) {
    throw new BadRequestException('Matching options must contain "left" and "right" arrays');
  }

  if (left.length < 2 || right.length < 2) {
    throw new BadRequestException('Matching options require at least 2 items per list');
  }

  return {
    left: left.map(String),
    right: right.map(String),
  };
}

function normalizeMatchingAnswer(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Matching answer must be an object map');
  }

  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof k !== 'string' || typeof v !== 'string') {
      throw new BadRequestException('Matching answer keys and values must be strings');
    }
    map[k] = v;
  }

  return map;
}

function normalizeOrderingAnswer(value: unknown, options: string[]): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException('Ordering answer must be an array');
  }

  if (value.length !== options.length) {
    throw new BadRequestException('Ordering answer length must match options length');
  }

  const normalized = value.map(String);
  const optionsSet = new Set(options);

  for (const item of normalized) {
    if (!optionsSet.has(item)) {
      throw new BadRequestException(`Ordering item "${item}" is not in the options`);
    }
  }

  return normalized;
}
