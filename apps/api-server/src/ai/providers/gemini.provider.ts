import { Injectable, Logger } from '@nestjs/common';
import { generateObject, generateText, jsonSchema, type ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import {
  IAiProvider,
  GenerateExplanationOptions,
  GeneratePracticeOptions,
  GeneratedPracticeQuestion,
  GenerateFlashcardOptions,
  GenerateFlashcardsBulkOptions,
} from '../interfaces/ai-provider.interface';

interface GeneratedMultipleChoiceQuestion {
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: { optionId: string };
  explanation: string;
}

interface GeneratedFillBlankQuestion {
  prompt: string;
  correctAnswer: { words: string[] };
  explanation: string;
}

interface GeneratedMultipleChoiceResponse {
  questions: GeneratedMultipleChoiceQuestion[];
}

interface GeneratedFillBlankResponse {
  questions: GeneratedFillBlankQuestion[];
}

interface RoleplayEvaluation {
  score: number;
  feedback: {
    grammar: string;
    vocabulary: string;
    overall: string;
  };
}

function isGeminiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) && process.env.AI_PROVIDER !== 'off';
}

function multipleChoiceQuestionSchema(count: number) {
  return jsonSchema<GeneratedMultipleChoiceResponse>({
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        minItems: count,
        maxItems: count,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['prompt', 'options', 'correctAnswer', 'explanation'],
          properties: {
            prompt: { type: 'string', description: 'The question prompt' },
            options: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              description: 'Exactly 4 options with unique IDs like A, B, C, D',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'text'],
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                },
              },
            },
            correctAnswer: {
              type: 'object',
              additionalProperties: false,
              required: ['optionId'],
              properties: {
                optionId: { type: 'string', description: 'The ID of the correct option' },
              },
            },
            explanation: { type: 'string', description: 'Explanation of the correct answer' },
          },
        },
      },
    },
  });
}

function fillBlankQuestionSchema(count: number) {
  return jsonSchema<GeneratedFillBlankResponse>({
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        minItems: count,
        maxItems: count,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['prompt', 'correctAnswer', 'explanation'],
          properties: {
            prompt: {
              type: 'string',
              description: 'The question prompt with a blank represented as ___',
            },
            correctAnswer: {
              type: 'object',
              additionalProperties: false,
              required: ['words'],
              properties: {
                words: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Correct words to fill in the blank',
                },
              },
            },
            explanation: { type: 'string', description: 'Explanation of the correct answer' },
          },
        },
      },
    },
  });
}

function roleplayEvaluationSchema() {
  return jsonSchema<RoleplayEvaluation>({
    type: 'object',
    additionalProperties: false,
    required: ['score', 'feedback'],
    properties: {
      score: { type: 'number', minimum: 0, maximum: 100 },
      feedback: {
        type: 'object',
        additionalProperties: false,
        required: ['grammar', 'vocabulary', 'overall'],
        properties: {
          grammar: { type: 'string' },
          vocabulary: { type: 'string' },
          overall: { type: 'string' },
        },
      },
    },
  });
}

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  async generateExplanation(options: GenerateExplanationOptions): Promise<string> {
    try {
      if (!isGeminiConfigured()) {
        throw new Error('Gemini provider is not configured');
      }

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

      if (!isGeminiConfigured()) {
        throw new Error('Gemini provider is not configured');
      }

      const systemPrompt = `You are an expert instructional designer and teacher.
Your task is to generate exactly ${count} practice questions about the topic: "${topic}".
Ensure the questions are engaging, accurate, and suitable for the learners.
Language: Vietnamese.

Context/Reference material (use this if provided to base your questions on):
${context || 'None'}

      Target Skills: ${skillTags?.join(', ') || 'General'}`;

      if (questionType === 'MULTIPLE_CHOICE') {
        const { object } = await generateObject({
          model: google('gemini-1.5-flash'),
          system: systemPrompt,
          prompt: `Please generate the questions in the specified JSON schema.`,
          schema: multipleChoiceQuestionSchema(count),
          temperature: 0.5,
        });

        return object.questions.map((question) => ({
          type: questionType,
          prompt: question.prompt,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          skillTags: skillTags || [],
        }));
      } else if (questionType === 'FILL_BLANK') {
        const { object } = await generateObject({
          model: google('gemini-1.5-flash'),
          system: systemPrompt,
          prompt: `Please generate the questions in the specified JSON schema.`,
          schema: fillBlankQuestionSchema(count),
          temperature: 0.5,
        });

        return object.questions.map((question) => ({
          type: questionType,
          prompt: question.prompt,
          options: null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          skillTags: skillTags || [],
        }));
      } else {
        throw new Error(`Unsupported question type for AI generation: ${questionType}`);
      }
    } catch (error) {
      this.logger.error('Error generating practice questions from Gemini', error);
      throw new Error('Failed to generate practice questions from AI provider.');
    }
  }

  async generateFlashcard(
    options: GenerateFlashcardOptions,
  ): Promise<{ back: string; phonetics: string; example: string }> {
    try {
      if (!isGeminiConfigured()) {
        throw new Error('Gemini provider is not configured');
      }

      const { front, context } = options;

      const systemPrompt = `You are an expert language teacher and lexicographer.
The user will provide a vocabulary word or phrase (in any language).
Your task is to generate flashcard data for this vocabulary.
You must provide:
1. "back": A clear, concise explanation/definition. If the input is in Vietnamese, provide the explanation/translation in English. If the input is in English, provide the explanation/translation in Vietnamese. Keep it under 2 sentences.
2. "phonetics": The IPA transcription of the word/phrase (if applicable).
3. "example": A short, natural example sentence using the vocabulary word correctly (in the target language).

Ensure the output is accurate, educational, and formatting is plain text.
Context/Reference material: ${context || 'None'}`;

      const flashcardSchema = jsonSchema<{ back: string; phonetics: string; example: string }>({
        type: 'object',
        additionalProperties: false,
        required: ['back', 'phonetics', 'example'],
        properties: {
          back: { type: 'string', description: 'Vietnamese explanation or definition' },
          phonetics: { type: 'string', description: 'IPA phonetics' },
          example: { type: 'string', description: 'English example sentence' },
        },
      });

      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        prompt: `Vocabulary: "${front}"\nPlease generate the flashcard data.`,
        schema: flashcardSchema,
        temperature: 0.3,
      });

      return object;
    } catch (error) {
      this.logger.error('Error generating flashcard from Gemini', error);
      throw new Error('Failed to generate flashcard from AI provider.');
    }
  }

  async generateFlashcardsBulk(
    options: GenerateFlashcardsBulkOptions,
  ): Promise<{ front: string; back: string; phonetics: string; example: string }[]> {
    try {
      if (!isGeminiConfigured()) {
        throw new Error('Gemini provider is not configured');
      }

      const { topic, count, context } = options;

      const systemPrompt = `You are an expert language teacher and instructional designer.
Your task is to generate exactly ${count} flashcards about the topic: "${topic}".
Each flashcard must contain:
1. "front": The vocabulary word or phrase.
2. "back": A clear, concise explanation/definition (in Vietnamese if "front" is English, or English if "front" is Vietnamese).
3. "phonetics": The IPA transcription of the word/phrase.
4. "example": A short, natural example sentence using the vocabulary word correctly.

Ensure the output is accurate, educational, and suitable for the learners.
Context/Reference material: ${context || 'None'}`;

      const bulkFlashcardSchema = jsonSchema<{
        cards: { front: string; back: string; phonetics: string; example: string }[];
      }>({
        type: 'object',
        additionalProperties: false,
        required: ['cards'],
        properties: {
          cards: {
            type: 'array',
            minItems: count,
            maxItems: count,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['front', 'back', 'phonetics', 'example'],
              properties: {
                front: { type: 'string', description: 'Vocabulary word or phrase' },
                back: { type: 'string', description: 'Explanation or definition' },
                phonetics: { type: 'string', description: 'IPA phonetics' },
                example: { type: 'string', description: 'Example sentence' },
              },
            },
          },
        },
      });

      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        prompt: `Please generate the ${count} flashcards for topic: "${topic}".`,
        schema: bulkFlashcardSchema,
        temperature: 0.5,
      });

      return object.cards;
    } catch (error) {
      this.logger.error('Error generating bulk flashcards from Gemini', error);
      throw new Error('Failed to generate bulk flashcards from AI provider.');
    }
  }

  async chatRoleplay(messages: ModelMessage[], systemPrompt: string): Promise<string> {
    try {
      if (!isGeminiConfigured()) {
        throw new Error('Gemini provider is not configured');
      }

      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        messages,
        temperature: 0.7,
      });
      return text;
    } catch (error) {
      this.logger.error('Error in chatRoleplay', error);
      throw new Error('Failed to generate chat response from AI provider.');
    }
  }

  async evaluateRoleplaySession(
    messages: ModelMessage[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }> {
    try {
      if (!isGeminiConfigured()) {
        throw new Error('Gemini provider is not configured');
      }

      const systemPrompt = `You are an expert language evaluator.
Review the following roleplay conversation.
The scenario was: "${scenario}"

Please provide a score out of 100 for the user's performance and detailed feedback in JSON format.
Feedback should contain at least:
- grammar: string
- vocabulary: string
- overall: string`;

      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        messages,
        schema: roleplayEvaluationSchema(),
      });

      return object;
    } catch (error) {
      this.logger.error('Error in evaluateRoleplaySession', error);
      throw new Error('Failed to evaluate roleplay session.');
    }
  }
}
