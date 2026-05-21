import type { ExamQuestion } from '@/lib/exam-api';
import type { PracticeQuestion } from '@/lib/practice-api';

type AnswerableQuestion =
  | Pick<PracticeQuestion, 'type' | 'options'>
  | Pick<ExamQuestion, 'type' | 'options'>;

export function isQuestionAnswered(
  question: AnswerableQuestion,
  rawValue: string | undefined,
): boolean {
  if (rawValue === undefined) {
    return false;
  }

  if (question.type === 'MULTIPLE_CHOICE') {
    return rawValue.trim() !== '';
  }

  if (
    question.type === 'FILL_BLANK' ||
    question.type === 'AI_EVALUATED_TEXT' ||
    question.type === 'AI_EVALUATED_AUDIO'
  ) {
    return rawValue.trim() !== '';
  }

  if (question.type === 'MATCHING') {
    try {
      const mapping = JSON.parse(rawValue) as Record<string, string>;
      const options = question.options as { left?: string[] } | null;
      const left = options?.left ?? [];
      return left.length > 0 && left.every((item) => Boolean(mapping[item]?.trim()));
    } catch {
      return false;
    }
  }

  if (question.type === 'ORDERING') {
    try {
      const ordered = JSON.parse(rawValue) as string[];
      const options = Array.isArray(question.options) ? question.options.map(String) : [];
      return ordered.length === options.length && ordered.every((item) => item.trim() !== '');
    } catch {
      return false;
    }
  }

  return rawValue.trim() !== '';
}

export function parseSubmittedAnswer(question: AnswerableQuestion, value: string): unknown {
  if (question.type === 'MULTIPLE_CHOICE') {
    return Number(value);
  }

  if (question.type === 'MATCHING' || question.type === 'ORDERING') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return value.trim();
}
