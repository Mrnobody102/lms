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
   * Chat interface for Roleplay Session.
   */
  chatRoleplay(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    systemPrompt: string,
  ): Promise<string>;

  /**
   * Evaluate a completed Roleplay Session.
   */
  evaluateRoleplaySession(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }>;
}
