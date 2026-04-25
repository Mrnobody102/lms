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

const commaSeparatedUrlSchema = z.string().refine(
  (value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .every((origin) => {
        try {
          const parsed = new URL(origin);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      }),
  { message: 'Must be a comma-separated list of http(s) origins' },
);

const booleanEnvSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === 'true');

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
    CORS_ORIGINS: commaSeparatedUrlSchema.optional(),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    AUTH_COOKIE_DOMAIN: z.string().optional(),

    // Redis
    REDIS_URL: redisUrlSchema.optional(),

    // MCP
    MCP_ENABLED: booleanEnvSchema,
    MCP_API_KEY: z.string().min(32).optional(),
    MCP_ALLOW_QUERY_API_KEY: booleanEnvSchema,
    MCP_PROJECT_ROOT: z.string().optional(),

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

    if (env.NODE_ENV === 'production' && !env.CORS_ORIGINS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS is required in production',
      });
    }

    if (env.NODE_ENV === 'production' && env.MCP_ENABLED && !env.MCP_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MCP_API_KEY'],
        message: 'MCP_API_KEY is required when MCP is enabled in production',
      });
    }
  });

export type EnvSchema = z.infer<typeof envSchema>;
