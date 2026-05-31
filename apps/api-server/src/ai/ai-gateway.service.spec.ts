import { afterEach, describe, expect, it, vi } from 'vitest';
import { PracticeQuestionType } from '@repo/database';
import { AiGatewayService } from './ai-gateway.service';

describe('AiGatewayService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('should keep gateway disabled by default', () => {
    const service = new AiGatewayService();

    expect(service.getRuntimeConfig({} as NodeJS.ProcessEnv)).toEqual({
      provider: 'off',
      endpointUrl: undefined,
      apiKey: undefined,
      model: undefined,
      timeoutMs: 15000,
      maxOutputTokens: 512,
      temperature: 0.2,
      enabled: false,
    });
  });

  it('should enable gateway runtime config when endpoint exists', () => {
    const service = new AiGatewayService();

    expect(
      service.getRuntimeConfig({
        AI_PROVIDER: 'gateway',
        AI_ENDPOINT_URL: 'https://ai.example.com/evaluate',
        AI_API_KEY: 'secret-key',
        AI_MODEL: 'gpt-test',
        AI_TIMEOUT_MS: '3000',
        AI_MAX_OUTPUT_TOKENS: '256',
        AI_TEMPERATURE: '0.7',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      provider: 'gateway',
      endpointUrl: 'https://ai.example.com/evaluate',
      apiKey: 'secret-key',
      model: 'gpt-test',
      timeoutMs: 3000,
      maxOutputTokens: 256,
      temperature: 0.7,
      enabled: true,
    });
  });

  it('should enable Groq runtime config from Groq env values', () => {
    const service = new AiGatewayService();

    expect(
      service.getRuntimeConfig({
        AI_PROVIDER: 'groq',
        GROQ_API_KEY: 'groq-secret-key',
        GROQ_MODEL: 'llama-3.3-70b-versatile',
        GROQ_BASE_URL: 'https://api.groq.com/openai/v1/',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      provider: 'groq',
      endpointUrl: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: 'groq-secret-key',
      model: 'llama-3.3-70b-versatile',
      timeoutMs: 15000,
      maxOutputTokens: 512,
      temperature: 0.2,
      enabled: true,
    });
  });

  it('should normalize OpenAI-style gateway payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"matched":true,"transcript":"Gateway transcript","summary":"Gateway summary","confidence":0.83}',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('AI_PROVIDER', 'gateway');
    vi.stubEnv('AI_ENDPOINT_URL', 'https://ai.example.com/evaluate');
    vi.stubEnv('AI_API_KEY', 'secret-key');
    vi.stubEnv('AI_MODEL', 'gpt-test');
    vi.stubEnv('AI_TIMEOUT_MS', '3000');

    const service = new AiGatewayService();

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'Hello',
        questionPrompt: 'Say hello',
      }),
    ).resolves.toEqual({
      matched: true,
      transcript: 'Gateway transcript',
      summary: 'Gateway summary',
      confidence: 0.83,
      provider: 'gateway',
      model: 'gpt-test',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai.example.com/evaluate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          authorization: 'Bearer secret-key',
        }),
      }),
    );
  });

  it('should return null when gateway rejects response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );
    vi.stubEnv('AI_PROVIDER', 'gateway');
    vi.stubEnv('AI_ENDPOINT_URL', 'https://ai.example.com/evaluate');

    const service = new AiGatewayService();

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'Hello',
      }),
    ).resolves.toBeNull();
  });

  it('should send OpenAI-compatible practice evaluation requests to Groq', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"matched":true,"transcript":"Hello","summary":"Câu trả lời đúng.","confidence":0.92}',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'groq-secret-key');
    vi.stubEnv('GROQ_MODEL', 'llama-3.3-70b-versatile');

    const service = new AiGatewayService();

    await expect(
      service.evaluatePracticeAnswer({
        type: PracticeQuestionType.AI_EVALUATED_TEXT,
        answer: 'Hello',
        correctAnswer: 'Hello',
        questionPrompt: 'Say hello',
      }),
    ).resolves.toEqual({
      matched: true,
      transcript: 'Hello',
      summary: 'Câu trả lời đúng.',
      confidence: 0.92,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });
  });
});
