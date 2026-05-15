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

  it('should normalize AI-evaluated answers with the extended text limit', () => {
    const longAnswer = 'x'.repeat(1500);

    expect(
      normalizeSubmittedAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: ` ${longAnswer} `,
      }),
    ).toBe(longAnswer);
  });

  it('should normalize matching question payloads', () => {
    expect(
      normalizeQuestionPayload({
        type: PracticeQuestionType.MATCHING,
        options: { left: ['A', 'B'], right: ['1', '2'] },
        correctAnswer: { A: '1', B: '2' },
      }),
    ).toEqual({
      options: { left: ['A', 'B'], right: ['1', '2'] },
      correctAnswer: { A: '1', B: '2' },
    });
  });

  it('should correctly grade matching answers', () => {
    expect(
      isNormalizedAnswerCorrect({
        type: PracticeQuestionType.MATCHING,
        answer: { A: '1', B: '2' },
        correctAnswer: { A: '1', B: '2' },
      }),
    ).toBe(true);

    expect(
      isNormalizedAnswerCorrect({
        type: PracticeQuestionType.MATCHING,
        answer: { A: '2', B: '1' },
        correctAnswer: { A: '1', B: '2' },
      }),
    ).toBe(false);
  });

  it('should normalize ordering question payloads', () => {
    expect(
      normalizeQuestionPayload({
        type: PracticeQuestionType.ORDERING,
        options: ['Step 1', 'Step 2', 'Step 3'],
        correctAnswer: ['Step 2', 'Step 1', 'Step 3'],
      }),
    ).toEqual({
      options: ['Step 1', 'Step 2', 'Step 3'],
      correctAnswer: ['Step 2', 'Step 1', 'Step 3'],
    });
  });

  it('should correctly grade ordering answers', () => {
    expect(
      isNormalizedAnswerCorrect({
        type: PracticeQuestionType.ORDERING,
        answer: ['Step 2', 'Step 1', 'Step 3'],
        correctAnswer: ['Step 2', 'Step 1', 'Step 3'],
      }),
    ).toBe(true);

    expect(
      isNormalizedAnswerCorrect({
        type: PracticeQuestionType.ORDERING,
        answer: ['Step 1', 'Step 2', 'Step 3'],
        correctAnswer: ['Step 2', 'Step 1', 'Step 3'],
      }),
    ).toBe(false);
  });
});
