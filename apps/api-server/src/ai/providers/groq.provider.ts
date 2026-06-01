import { Injectable, Logger } from '@nestjs/common';
import type { ModelMessage } from 'ai';
import {
  GenerateExplanationOptions,
  GenerateFlashcardOptions,
  GenerateFlashcardsBulkOptions,
  GeneratePracticeOptions,
  GeneratedPracticeQuestion,
  IAiProvider,
} from '../interfaces/ai-provider.interface';

interface GroqConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
}

interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqChatChoice {
  message?: {
    content?: string;
  };
}

interface GroqChatResponse {
  choices?: GroqChatChoice[];
  error?: {
    message?: string;
  };
}

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

interface RoleplayEvaluation {
  score: number;
  feedback: {
    grammar: string;
    vocabulary: string;
    overall: string;
  };
}

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

@Injectable()
export class GroqProvider implements IAiProvider {
  private readonly logger = new Logger(GroqProvider.name);

  async generateExplanation(options: GenerateExplanationOptions): Promise<string> {
    const { questionPrompt, correctAnswer, userAnswer, skillTags, context } = options;

    const systemPrompt = `You are a friendly, encouraging, and highly effective AI tutor.
Your goal is to explain to the student why their answer is incorrect, based on the provided correct answer.
Keep your explanation concise (1-3 short paragraphs), easy to understand, and focused on the specific mistake.
Use Markdown for formatting.
Language: Vietnamese unless the learning context strictly requires otherwise.

Context: ${context || 'None'}
Skills tested: ${skillTags?.join(', ') || 'General'}`;

    const userPrompt = `Question:
${questionPrompt}

Correct Answer:
${JSON.stringify(correctAnswer)}

Student's Incorrect Answer:
${JSON.stringify(userAnswer)}

Please explain why the student's answer is incorrect and clarify the concept.`;

    return this.chatText([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  }

  async generatePracticeQuestions(
    options: GeneratePracticeOptions,
  ): Promise<GeneratedPracticeQuestion[]> {
    const { topic, context, count, questionType, skillTags } = options;
    const systemPrompt = `You are an expert instructional designer and teacher.
Generate exactly ${count} practice questions about the topic: "${topic}".
The output must be valid JSON only, with no Markdown fences or prose.
Language: Vietnamese.

Context/Reference material:
${context || 'None'}

Target Skills: ${skillTags?.join(', ') || 'General'}`;

    if (questionType === 'MULTIPLE_CHOICE') {
      const payload = await this.chatJson([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Return JSON in this exact shape:
{
  "questions": [
    {
      "prompt": "question text",
      "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
      "correctAnswer": {"optionId":"A"},
      "explanation": "short explanation"
    }
  ]
}`,
        },
      ]);

      const questions = readMultipleChoiceQuestions(payload, count);
      return questions.map((question) => ({
        type: questionType,
        prompt: question.prompt,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        skillTags: skillTags || [],
      }));
    }

    if (questionType === 'FILL_BLANK') {
      const payload = await this.chatJson([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Return JSON in this exact shape:
{
  "questions": [
    {
      "prompt": "question text with one blank represented as ___",
      "correctAnswer": {"words":["correct word"]},
      "explanation": "short explanation"
    }
  ]
}`,
        },
      ]);

      const questions = readFillBlankQuestions(payload, count);
      return questions.map((question) => ({
        type: questionType,
        prompt: question.prompt,
        options: null,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        skillTags: skillTags || [],
      }));
    }

    throw new Error(`Unsupported question type for AI generation: ${questionType}`);
  }

  async generateFlashcard(
    options: GenerateFlashcardOptions,
  ): Promise<{ back: string; phonetics: string; example: string }> {
    const { front, context } = options;
    const payload = await this.chatJson([
      {
        role: 'system',
        content: `You are an expert language teacher and lexicographer.
Return valid JSON only, with no Markdown fences or prose.
Context/Reference material: ${context || 'None'}`,
      },
      {
        role: 'user',
        content: `Vocabulary: "${front}"
Return JSON in this exact shape:
{
  "back": "clear concise definition or translation",
  "phonetics": "IPA transcription if applicable",
  "example": "short natural example sentence"
}`,
      },
    ]);

    return readFlashcard(payload);
  }

  async generateFlashcardsBulk(
    options: GenerateFlashcardsBulkOptions,
  ): Promise<{ front: string; back: string; phonetics: string; example: string }[]> {
    const { topic, count, context } = options;
    const payload = await this.chatJson([
      {
        role: 'system',
        content: `You are an expert language teacher and instructional designer.
Generate exactly ${count} flashcards about the topic: "${topic}".
Return valid JSON only, with no Markdown fences or prose.
Context/Reference material: ${context || 'None'}`,
      },
      {
        role: 'user',
        content: `Return JSON in this exact shape:
{
  "cards": [
    {
      "front": "vocabulary word or phrase",
      "back": "clear concise definition or translation",
      "phonetics": "IPA transcription if applicable",
      "example": "short natural example sentence"
    }
  ]
}`,
      },
    ]);

    return readFlashcards(payload, count);
  }

  async chatRoleplay(messages: ModelMessage[], systemPrompt: string): Promise<string> {
    return this.chatText([
      { role: 'system', content: systemPrompt },
      ...messages
        .map(toGroqMessage)
        .filter((message): message is GroqChatMessage => Boolean(message)),
    ]);
  }

  async evaluateRoleplaySession(
    messages: ModelMessage[],
    scenario: string,
  ): Promise<{ score: number; feedback: unknown }> {
    const payload = await this.chatJson([
      {
        role: 'system',
        content: `You are an expert language evaluator.
Review the following roleplay conversation.
The scenario was: "${scenario}"
Return valid JSON only, with no Markdown fences or prose.`,
      },
      ...messages
        .map(toGroqMessage)
        .filter((message): message is GroqChatMessage => Boolean(message)),
      {
        role: 'user',
        content: `Return JSON in this exact shape:
{
  "score": 0,
  "feedback": {
    "grammar": "feedback",
    "vocabulary": "feedback",
    "overall": "feedback"
  }
}`,
      },
    ]);

    return readRoleplayEvaluation(payload);
  }

  private async chatText(messages: GroqChatMessage[], temperature?: number): Promise<string> {
    try {
      const content = await this.postChatCompletion(messages, false, temperature);
      if (!content.trim()) {
        throw new Error('Groq returned an empty response');
      }
      return content;
    } catch (error) {
      this.logger.error('Error generating text from Groq', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate text from Groq: ${message}`);
    }
  }

  private async chatJson(messages: GroqChatMessage[], temperature = 0.2): Promise<unknown> {
    try {
      const content = await this.postChatCompletion(messages, true, temperature);
      return parseJsonContent(content);
    } catch (error) {
      this.logger.error('Error generating JSON from Groq', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate JSON from Groq: ${message}`);
    }
  }

  private async postChatCompletion(
    messages: GroqChatMessage[],
    jsonMode: boolean,
    temperature?: number,
  ): Promise<string> {
    const config = readGroqConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: temperature ?? config.temperature,
          max_completion_tokens: config.maxOutputTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const providerMessage = readGroqErrorMessage(payload);
        throw new Error(providerMessage || `Groq request failed with status ${response.status}`);
      }

      const content = readGroqContent(payload);
      if (!content) {
        throw new Error('Groq response did not include message content');
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function readGroqConfig(): GroqConfig {
  const apiKey = normalizeOptionalString(process.env.GROQ_API_KEY || process.env.AI_API_KEY);
  if (!apiKey || process.env.AI_PROVIDER === 'off') {
    throw new Error('Groq provider is not configured');
  }

  return {
    apiKey,
    baseUrl: normalizeBaseUrl(process.env.GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL),
    model:
      normalizeOptionalString(process.env.GROQ_MODEL || process.env.AI_MODEL) || DEFAULT_GROQ_MODEL,
    timeoutMs: normalizeNumber(process.env.AI_TIMEOUT_MS, 15000),
    maxOutputTokens: normalizeNumber(process.env.AI_MAX_OUTPUT_TOKENS, 1024),
    temperature: normalizeTemperature(process.env.AI_TEMPERATURE, 0.2),
  };
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeTemperature(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 2 ? parsed : fallback;
}

function toGroqMessage(message: ModelMessage): GroqChatMessage | null {
  if (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'system') {
    return null;
  }

  return {
    role: message.role,
    content: stringifyMessageContent(message.content),
  };
}

function stringifyMessageContent(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  return JSON.stringify(content);
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(withoutFence) as unknown;
}

function readGroqContent(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const response = value as GroqChatResponse;
  return response.choices?.[0]?.message?.content;
}

function readGroqErrorMessage(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const response = value as GroqChatResponse;
  return response.error?.message;
}

function readMultipleChoiceQuestions(
  value: unknown,
  count: number,
): GeneratedMultipleChoiceQuestion[] {
  const questions = readQuestionArray(value, count);
  return questions.map((question) => {
    const prompt = readRequiredString(question.prompt, 'question.prompt');
    const options = readOptions(question.options);
    const correctAnswerRecord = readRequiredRecord(
      question.correctAnswer,
      'question.correctAnswer',
    );
    const optionId = readRequiredString(
      correctAnswerRecord.optionId,
      'question.correctAnswer.optionId',
    );
    const explanation = readRequiredString(question.explanation, 'question.explanation');

    return {
      prompt,
      options,
      correctAnswer: { optionId },
      explanation,
    };
  });
}

function readFillBlankQuestions(value: unknown, count: number): GeneratedFillBlankQuestion[] {
  const questions = readQuestionArray(value, count);
  return questions.map((question) => {
    const prompt = readRequiredString(question.prompt, 'question.prompt');
    const correctAnswerRecord = readRequiredRecord(
      question.correctAnswer,
      'question.correctAnswer',
    );
    const words = readStringArray(correctAnswerRecord.words, 'question.correctAnswer.words');
    const explanation = readRequiredString(question.explanation, 'question.explanation');

    return {
      prompt,
      correctAnswer: { words },
      explanation,
    };
  });
}

function readFlashcard(value: unknown) {
  const record = readRequiredRecord(value, 'flashcard');
  return {
    back: readRequiredString(record.back, 'flashcard.back'),
    phonetics: readRequiredString(record.phonetics, 'flashcard.phonetics'),
    example: readRequiredString(record.example, 'flashcard.example'),
  };
}

function readFlashcards(value: unknown, count: number) {
  const cards = readFlashcardArray(value);
  if (cards.length === 0) {
    throw new Error('Expected at least one flashcard');
  }

  return cards.slice(0, count).map((card) => {
    const cardRecord = readRequiredRecord(card, 'flashcard');
    return {
      front: readRequiredString(cardRecord.front, 'flashcard.front'),
      back: readRequiredString(cardRecord.back, 'flashcard.back'),
      phonetics: readOptionalString(cardRecord.phonetics),
      example: readOptionalString(cardRecord.example),
    };
  });
}

function readFlashcardArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  const record = readRequiredRecord(value, 'flashcards');
  const cards = record.cards ?? record.flashcards;
  if (!Array.isArray(cards)) {
    throw new Error('Expected flashcards response to include a cards array');
  }

  return cards;
}

function readRoleplayEvaluation(value: unknown): RoleplayEvaluation {
  const record = readRequiredRecord(value, 'roleplay evaluation');
  const feedback = readRequiredRecord(record.feedback, 'roleplay evaluation.feedback');
  const score =
    typeof record.score === 'number' && Number.isFinite(record.score) ? record.score : 0;

  return {
    score: Math.min(100, Math.max(0, score)),
    feedback: {
      grammar: readRequiredString(feedback.grammar, 'roleplay evaluation.feedback.grammar'),
      vocabulary: readRequiredString(
        feedback.vocabulary,
        'roleplay evaluation.feedback.vocabulary',
      ),
      overall: readRequiredString(feedback.overall, 'roleplay evaluation.feedback.overall'),
    },
  };
}

function readQuestionArray(value: unknown, count: number) {
  const record = readRequiredRecord(value, 'questions response');
  if (!Array.isArray(record.questions) || record.questions.length !== count) {
    throw new Error(`Expected exactly ${count} questions`);
  }

  return record.questions.map((question) => readRequiredRecord(question, 'question'));
}

function readOptions(value: unknown) {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new Error('Expected exactly 4 answer options');
  }

  return value.map((option) => {
    const record = readRequiredRecord(option, 'question.option');
    return {
      id: readRequiredString(record.id, 'question.option.id'),
      text: readRequiredString(record.text, 'question.option.text'),
    };
  });
}

function readStringArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an array`);
  }

  const strings = value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );
  if (strings.length === 0) {
    throw new Error(`Expected ${label} to contain at least one string`);
  }

  return strings;
}

function readRequiredRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Expected ${label} to be an object`);
  }

  return value;
}

function readRequiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Expected ${label} to be a non-empty string`);
  }

  return value;
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
