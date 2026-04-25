import { z } from 'zod';
import { DURATION_PATTERN } from './duration';

const redisUrlSchema = z.string().refine(
  (value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:';
    } catch {
      return false;
    }
  },
  { message: 'REDIS_URL must be a valid redis:// or rediss:// URL' },
);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().min(1),

    // Auth
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z
      .string()
      .regex(DURATION_PATTERN, 'JWT_EXPIRES_IN must use a duration like 15m, 1h, or 7d')
      .default('7d'),

    // CORS
    CORS_ORIGINS: z.string().optional(),

    // Redis
    REDIS_URL: redisUrlSchema.optional(),

    // Throttler (optional overrides)
    THROTTLER_TTL: z.coerce.number().optional(),
    THROTTLER_LIMIT: z.coerce.number().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REDIS_URL'],
        message: 'REDIS_URL is required in production',
      });
    }
  });

export type EnvSchema = z.infer<typeof envSchema>;
