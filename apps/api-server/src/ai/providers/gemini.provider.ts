import { Injectable, Logger } from '@nestjs/common';
import { generateText, generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import {
  IAiProvider,
  GenerateExplanationOptions,
  GeneratePracticeOptions,
  GeneratedPracticeQuestion,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  async generateExplanation(options: GenerateExplanationOptions): Promise<string> {
    try {
      const { questionPrompt, correctAnswer, userAnswer, skillTags, context } = options;

      const systemPrompt = `You are a friendly, encouraging, and highly effective AI tutor.
Your goal is to explain to the student why their answer is incorrect, based on the provided correct answer.
Keep your explanation concise (1-3 short paragraphs), easy to understand, and focused on the specific mistake.
Do not give away the answer directly if it's a practice, just explain the concept (though in this case the student already knows the correct answer, so explain why the correct answer is right and their answer is wrong).
Use Markdown for formatting (bolding key terms).
Language: Vietnamese (unless the context strictly requires otherwise).

Context: ${context || 'None'}
Skills tested: ${skillTags?.join(', ') || 'General'}`;

      const userPrompt = `Question:
${questionPrompt}

Correct Answer:
${JSON.stringify(correctAnswer)}

Student's Incorrect Answer:
${JSON.stringify(userAnswer)}

Please explain why the student's answer is incorrect and clarify the concept.`;

      // Use a fast model like gemini-2.5-flash if available, or gemini-1.5-flash
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
      });

      return text;
    } catch (error) {
      this.logger.error('Error generating explanation from Gemini', error);
      throw new Error('Failed to generate explanation from AI provider.');
    }
  }

  async generatePracticeQuestions(
    options: GeneratePracticeOptions,
  ): Promise<GeneratedPracticeQuestion[]> {
    try {
      const { topic, context, count, questionType, skillTags } = options;

      const systemPrompt = `You are an expert instructional designer and teacher.
Your task is to generate exactly ${count} practice questions about the topic: "${topic}".
Ensure the questions are engaging, accurate, and suitable for the learners.
Language: Vietnamese.

Context/Reference material (use this if provided to base your questions on):
${context || 'None'}

Target Skills: ${skillTags?.join(', ') || 'General'}`;

      let schema;
      if (questionType === 'MULTIPLE_CHOICE') {
        schema = z.object({
          questions: z
            .array(
              z.object({
                prompt: z.string().describe('The question prompt'),
                options: z
                  .array(
                    z.object({
                      id: z.string(),
                      text: z.string(),
                    }),
                  )
                  .length(4)
                  .describe(
                    'Exactly 4 multiple choice options. Give them unique IDs like A, B, C, D',
                  ),
                correctAnswer: z.object({
                  optionId: z.string().describe('The ID of the correct option'),
                }),
                explanation: z.string().describe('Explanation of the correct answer'),
              }),
            )
            .length(count),
        });
      } else if (questionType === 'FILL_BLANK') {
        schema = z.object({
          questions: z
            .array(
              z.object({
                prompt: z.string().describe('The question prompt with a blank represented as ___'),
                correctAnswer: z.object({
                  words: z
                    .array(z.string())
                    .describe(
                      'The correct words to fill in the blank. Can be multiple acceptable answers.',
                    ),
                }),
                explanation: z.string().describe('Explanation of the correct answer'),
              }),
            )
            .length(count),
        });
      } else {
        throw new Error(`Unsupported question type for AI generation: ${questionType}`);
      }

      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        prompt: `Please generate the questions in the specified JSON schema.`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: schema as any,
        temperature: 0.5,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (object as any).questions.map((q: any) => ({
        type: questionType,
        prompt: q.prompt,
        options: q.options || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        skillTags: skillTags || [],
      }));
    } catch (error) {
      this.logger.error('Error generating practice questions from Gemini', error);
      throw new Error('Failed to generate practice questions from AI provider.');
    }
  }

  async chatRoleplay(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    systemPrompt: string,
  ): Promise<string> {
    try {
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        temperature: 0.7,
      });
      return text;
    } catch (error) {
      this.logger.error('Error in chatRoleplay', error);
      throw new Error('Failed to generate chat response from AI provider.');
    }
  }

  async evaluateRoleplaySession(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }> {
    try {
      const systemPrompt = `You are an expert language evaluator.
Review the following roleplay conversation.
The scenario was: "${scenario}"

Please provide a score out of 100 for the user's performance and detailed feedback in JSON format.
Feedback should contain at least:
- grammar: string
- vocabulary: string
- overall: string`;

      const schema = z.object({
        score: z.number().min(0).max(100),
        feedback: z.object({
          grammar: z.string(),
          vocabulary: z.string(),
          overall: z.string(),
        }),
      });

      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: schema as any,
      });

      return object as { score: number; feedback: unknown };
    } catch (error) {
      this.logger.error('Error in evaluateRoleplaySession', error);
      throw new Error('Failed to evaluate roleplay session.');
    }
  }
}
