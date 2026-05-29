import type { ModelMessage } from 'ai';
import { PracticeQuestionType } from '@repo/database';

export interface GenerateExplanationOptions {
  questionPrompt: string;
  correctAnswer: unknown;
  userAnswer: unknown;
  skillTags?: string[];
  context?: string; // Optional lesson content
}

export interface GeneratePracticeOptions {
  topic: string;
  context?: string;
  count: number;
  questionType: PracticeQuestionType;
  skillTags?: string[];
}

export interface GeneratedPracticeQuestion {
  type: PracticeQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer: unknown;
  explanation?: string;
  skillTags: string[];
}

export interface GenerateFlashcardOptions {
  front: string;
  context?: string;
}

export interface GenerateFlashcardsBulkOptions {
  topic: string;
  count: number;
  context?: string;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

export interface IAiProvider {
  /**
   * Generates a short, helpful explanation of why the user's answer is incorrect.
   */
  generateExplanation(options: GenerateExplanationOptions): Promise<string>;

  /**
   * Generates practice questions based on a topic or context.
   */
  generatePracticeQuestions(options: GeneratePracticeOptions): Promise<GeneratedPracticeQuestion[]>;

  /**
   * Generates a flashcard based on a prompt.
   */
  generateFlashcard(
    options: GenerateFlashcardOptions,
  ): Promise<{ back: string; phonetics: string; example: string }>;

  /**
   * Generates multiple flashcards based on a topic.
   */
  generateFlashcardsBulk(
    options: GenerateFlashcardsBulkOptions,
  ): Promise<{ front: string; back: string; phonetics: string; example: string }[]>;

  /**
   * Chat interface for Roleplay Session.
   */
  chatRoleplay(messages: ModelMessage[], systemPrompt: string): Promise<string>;

  /**
   * Evaluate a completed Roleplay Session.
   */
  evaluateRoleplaySession(
    messages: ModelMessage[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }>;
}
