import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().optional(),

  // Throttler (optional overrides)
  THROTTLER_TTL: z.coerce.number().optional(),
  THROTTLER_LIMIT: z.coerce.number().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;
