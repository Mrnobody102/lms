export interface GenerateExplanationOptions {
  questionPrompt: string;
  correctAnswer: unknown;
  userAnswer: unknown;
  skillTags?: string[];
  context?: string; // Optional lesson content
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

export interface IAiProvider {
  /**
   * Generates a short, helpful explanation of why the user's answer is incorrect.
   */
  generateExplanation(options: GenerateExplanationOptions): Promise<string>;
}
