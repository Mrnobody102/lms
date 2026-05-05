import { describe, expect, it } from 'vitest';
import { PracticeQuestionType } from '@repo/database';
import {
  isNormalizedAnswerCorrect,
  normalizeQuestionPayload,
  normalizeSubmittedAnswer,
} from './answer-validation.util';

describe('answer validation utilities', () => {
  it('should normalize multiple-choice question payloads', () => {
    expect(
      normalizeQuestionPayload({
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        options: [' A ', 'B'],
        correctAnswer: 1,
      }),
    ).toEqual({
      options: ['A', 'B'],
      correctAnswer: 1,
    });
  });

  it('should reject multiple-choice answers outside the option range', () => {
    expect(() =>
      normalizeSubmittedAnswer({
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        options: ['A', 'B'],
        answer: 2,
      }),
    ).toThrow('Multiple-choice answer index is outside the option range');
  });

  it('should compare fill-blank answers case-insensitively after trimming', () => {
    const answer = normalizeSubmittedAnswer({
      type: PracticeQuestionType.FILL_BLANK,
      answer: ' Ni Hao ',
    });

    expect(
      isNormalizedAnswerCorrect({
        type: PracticeQuestionType.FILL_BLANK,
        answer,
        correctAnswer: 'ni hao',
      }),
    ).toBe(true);
  });
});
