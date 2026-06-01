import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { PracticeQuestionType } from '@repo/database';
import { GroqProvider } from './groq.provider';

describe('GroqProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('should generate a flashcard through the Groq chat completions API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"back":"xin chào","phonetics":"/həˈloʊ/","example":"Hello, nice to meet you."}',
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'groq-secret-key');
    vi.stubEnv('GROQ_MODEL', 'llama-3.3-70b-versatile');

    const provider = new GroqProvider();

    await expect(provider.generateFlashcard({ front: 'hello' })).resolves.toEqual({
      back: 'xin chào',
      phonetics: '/həˈloʊ/',
      example: 'Hello, nice to meet you.',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer groq-secret-key',
          'content-type': 'application/json',
        }),
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });
  });

  it('should generate multiple choice practice questions from valid Groq JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  questions: [
                    {
                      prompt: 'Chọn nghĩa đúng của hello.',
                      options: [
                        { id: 'A', text: 'Xin chào' },
                        { id: 'B', text: 'Tạm biệt' },
                        { id: 'C', text: 'Cảm ơn' },
                        { id: 'D', text: 'Xin lỗi' },
                      ],
                      correctAnswer: { optionId: 'A' },
                      explanation: 'Hello nghĩa là xin chào.',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'groq-secret-key');

    const provider = new GroqProvider();

    await expect(
      provider.generatePracticeQuestions({
        topic: 'Greetings',
        count: 1,
        questionType: PracticeQuestionType.MULTIPLE_CHOICE,
      }),
    ).resolves.toEqual([
      {
        type: PracticeQuestionType.MULTIPLE_CHOICE,
        prompt: 'Chọn nghĩa đúng của hello.',
        options: [
          { id: 'A', text: 'Xin chào' },
          { id: 'B', text: 'Tạm biệt' },
          { id: 'C', text: 'Cảm ơn' },
          { id: 'D', text: 'Xin lỗi' },
        ],
        correctAnswer: { optionId: 'A' },
        explanation: 'Hello nghĩa là xin chào.',
        skillTags: [],
      },
    ]);
  });

  it('should tolerate extra bulk flashcards and optional missing fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [
                    {
                      front: 'mitigate',
                      back: 'làm giảm mức độ nghiêm trọng',
                    },
                    {
                      front: 'substantial',
                      back: 'đáng kể',
                      phonetics: '/səbˈstænʃəl/',
                      example: 'The course made substantial progress.',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'groq-secret-key');

    const provider = new GroqProvider();

    await expect(
      provider.generateFlashcardsBulk({ topic: 'IELTS vocabulary', count: 1 }),
    ).resolves.toEqual([
      {
        front: 'mitigate',
        back: 'làm giảm mức độ nghiêm trọng',
        phonetics: '',
        example: '',
      },
    ]);
  });

  it('should fail clearly when Groq is selected without an API key', async () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.stubEnv('AI_PROVIDER', 'groq');

    const provider = new GroqProvider();

    await expect(provider.generateFlashcard({ front: 'hello' })).rejects.toThrow(
      'Groq provider is not configured',
    );

    errorSpy.mockRestore();
  });
});
