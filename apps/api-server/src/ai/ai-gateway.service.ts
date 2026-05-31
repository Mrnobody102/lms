import { Injectable } from '@nestjs/common';
import { PracticeQuestionType } from '@repo/database';

export type AiProviderMode = 'off' | 'gateway' | 'groq';

export interface AiGatewayRuntimeConfig {
  provider: AiProviderMode;
  endpointUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  enabled: boolean;
}

export interface AiPracticeEvaluationRequest {
  type: PracticeQuestionType;
  questionPrompt?: string;
  answer: string;
  correctAnswer: unknown;
  skillTags?: string[];
  courseTitle?: string;
  courseAiSettings?: unknown;
}

export interface AiPracticeEvaluationResponse {
  matched?: boolean;
  transcript?: string;
  summary?: string;
  confidence?: number;
  provider?: string;
  model?: string;
}

@Injectable()
export class AiGatewayService {
  getRuntimeConfig(env: NodeJS.ProcessEnv = process.env): AiGatewayRuntimeConfig {
    const provider = normalizeProvider(env.AI_PROVIDER);
    const endpointUrl = resolveEndpointUrl(provider, env);
    const apiKey = resolveApiKey(provider, env);
    const model = resolveModel(provider, env);
    const timeoutMs = normalizeNumber(env.AI_TIMEOUT_MS, 15000);
    const maxOutputTokens = normalizeNumber(env.AI_MAX_OUTPUT_TOKENS, 512);
    const temperature = normalizeNumber(env.AI_TEMPERATURE, 0.2);

    return {
      provider,
      endpointUrl,
      apiKey,
      model,
      timeoutMs,
      maxOutputTokens,
      temperature,
      enabled:
        provider === 'gateway' ? Boolean(endpointUrl) : provider === 'groq' && Boolean(apiKey),
    };
  }

  async evaluatePracticeAnswer(
    input: AiPracticeEvaluationRequest,
  ): Promise<AiPracticeEvaluationResponse | null> {
    const config = this.getRuntimeConfig();
    if (!config.enabled || !config.endpointUrl) {
      return null;
    }

    const payload =
      config.provider === 'groq'
        ? buildGroqPracticeEvaluationPayload(input, config)
        : {
            task: 'practice-evaluation',
            model: config.model,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
            input: {
              questionType: input.type,
              questionPrompt: input.questionPrompt,
              studentAnswer: input.answer,
              referenceAnswer: input.correctAnswer,
              skillTags: input.skillTags ?? [],
              courseTitle: input.courseTitle,
              courseAiSettings: input.courseAiSettings,
            },
            outputContract: {
              matched: 'boolean',
              transcript: 'string',
              summary: 'string',
              confidence: 'number from 0 to 1',
            },
          };

    const response = await this.postJson(config, payload);
    return normalizeGatewayResponse(response, config);
  }

  private async postJson(config: AiGatewayRuntimeConfig, payload: unknown): Promise<unknown> {
    if (!config.endpointUrl) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      return response.json().catch(() => null);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeProvider(value: string | undefined): AiProviderMode {
  if (value === 'gateway') return 'gateway';
  if (value === 'groq') return 'groq';
  return 'off';
}

function resolveEndpointUrl(provider: AiProviderMode, env: NodeJS.ProcessEnv) {
  if (provider === 'groq') {
    const baseUrl = normalizeOptionalString(env.GROQ_BASE_URL) ?? 'https://api.groq.com/openai/v1';
    return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }

  return normalizeOptionalString(env.AI_ENDPOINT_URL);
}

function resolveApiKey(provider: AiProviderMode, env: NodeJS.ProcessEnv) {
  if (provider === 'groq') {
    return normalizeOptionalString(env.GROQ_API_KEY) ?? normalizeOptionalString(env.AI_API_KEY);
  }

  return normalizeOptionalString(env.AI_API_KEY);
}

function resolveModel(provider: AiProviderMode, env: NodeJS.ProcessEnv) {
  if (provider === 'groq') {
    return normalizeOptionalString(env.GROQ_MODEL) ?? normalizeOptionalString(env.AI_MODEL);
  }

  return normalizeOptionalString(env.AI_MODEL);
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildGroqPracticeEvaluationPayload(
  input: AiPracticeEvaluationRequest,
  config: AiGatewayRuntimeConfig,
) {
  return {
    model: config.model ?? 'llama-3.3-70b-versatile',
    temperature: config.temperature,
    max_completion_tokens: config.maxOutputTokens,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an LMS practice evaluator.
Return valid JSON only with this shape:
{
  "matched": true,
  "transcript": "student answer transcript",
  "summary": "short Vietnamese feedback",
  "confidence": 0.0
}`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          questionType: input.type,
          questionPrompt: input.questionPrompt,
          studentAnswer: input.answer,
          referenceAnswer: input.correctAnswer,
          skillTags: input.skillTags ?? [],
          courseTitle: input.courseTitle,
          courseAiSettings: input.courseAiSettings,
        }),
      },
    ],
  };
}

function normalizeGatewayResponse(
  value: unknown,
  config: AiGatewayRuntimeConfig,
): AiPracticeEvaluationResponse | null {
  const candidate = unwrapGatewayPayload(value);
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  return {
    matched: typeof record.matched === 'boolean' ? record.matched : undefined,
    transcript: typeof record.transcript === 'string' ? record.transcript : undefined,
    summary: typeof record.summary === 'string' ? record.summary : extractTextSummary(record),
    confidence: normalizeConfidence(record.confidence),
    provider: typeof record.provider === 'string' ? record.provider : config.provider,
    model: typeof record.model === 'string' ? record.model : config.model,
  };
}

function unwrapGatewayPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const record = value as Record<string, unknown>;
  const nested =
    record.result ??
    record.data ??
    record.output ??
    record.evaluation ??
    extractOpenAiStyleContent(record);

  if (typeof nested === 'string') {
    return parseJsonOrSummary(nested);
  }

  return nested ?? value;
}

function extractOpenAiStyleContent(record: Record<string, unknown>) {
  const choices = record.choices;
  if (!Array.isArray(choices)) {
    return undefined;
  }

  const first = choices[0];
  if (!first || typeof first !== 'object') {
    return undefined;
  }

  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') {
    return undefined;
  }

  const content = (message as Record<string, unknown>).content;
  return typeof content === 'string' ? content : undefined;
}

function parseJsonOrSummary(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return { summary: value };
  }
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function extractTextSummary(record: Record<string, unknown>) {
  const text = record.text ?? record.output_text;
  return typeof text === 'string' ? text : undefined;
}
