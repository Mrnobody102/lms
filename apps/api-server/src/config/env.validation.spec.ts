import { describe, expect, it } from 'vitest';
import { envSchema } from './env.validation';

const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/lms',
  JWT_SECRET: 'x'.repeat(32),
};

describe('envSchema AI configuration', () => {
  it('should accept Groq when a Groq API key is configured', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      AI_PROVIDER: 'groq',
      GROQ_API_KEY: 'groq-secret-key',
    });

    expect(result.success).toBe(true);
  });

  it('should reject Groq when no provider API key is configured', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      AI_PROVIDER: 'groq',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['GROQ_API_KEY'],
        }),
      ]),
    );
  });
});
