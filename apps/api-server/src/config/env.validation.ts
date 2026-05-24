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
          return (
            (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
            parsed.pathname === '/' &&
            !parsed.search &&
            !parsed.hash
          );
        } catch {
          return false;
        }
      }),
  { message: 'Must be a comma-separated list of exact http(s) origins' },
);

const publicUrlSchema = z.string().url().optional();

const booleanEnvSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === 'true');

const trustProxySchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === 'false') return false;
    if (normalized === 'true') return true;
    if (/^\d+$/.test(normalized)) return Number(normalized);
    return normalized;
  },
  z
    .union([z.boolean(), z.number().int().min(0), z.enum(['loopback', 'linklocal', 'uniquelocal'])])
    .default(false),
);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).default(4000),
    APP_PUBLIC_URL: publicUrlSchema,
    NEXT_PUBLIC_WEB_STUDENT_URL: publicUrlSchema,
    DATABASE_URL: z.string().min(1),

    // Auth
    JWT_SECRET: z.string().min(32),
    JWT_RESET_SECRET: z.string().min(32).optional(),
    JWT_EXPIRES_IN: z
      .string()
      .regex(DURATION_PATTERN, 'JWT_EXPIRES_IN must use a duration like 15m, 1h, or 7d')
      .default('7d'),
    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(DURATION_PATTERN, 'JWT_REFRESH_EXPIRES_IN must use a duration like 7d or 30d')
      .default('30d'),

    // CORS
    CORS_ORIGINS: commaSeparatedUrlSchema.optional(),
    TRUST_PROXY: trustProxySchema,
    ALLOW_TENANT_HEADER_IN_PRODUCTION: booleanEnvSchema.default(true),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_IDS: z.string().optional(),

    // Redis
    REDIS_URL: redisUrlSchema.optional(),

    // AI gateway. Keep disabled until an endpoint/API key is configured.
    AI_PROVIDER: z.enum(['off', 'gateway']).default('off'),
    AI_ENDPOINT_URL: z.string().url().optional(),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    AI_TIMEOUT_MS: z.coerce.number().min(1000).max(120000).default(15000),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().min(1).max(8192).default(512),
    AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),

    // MCP
    MCP_ENABLED: booleanEnvSchema,
    MCP_API_KEY: z.string().min(32).optional(),
    MCP_ALLOW_QUERY_API_KEY: booleanEnvSchema,
    MCP_PROJECT_ROOT: z.string().optional(),
    MCP_TENANT_ID: z.string().uuid().optional(),

    // Throttler (optional overrides)
    THROTTLER_TTL: z.coerce.number().optional(),
    THROTTLER_LIMIT: z.coerce.number().optional(),

    // Mail
    MAIL_ENABLED: booleanEnvSchema,
    MAIL_HOST: z.string().optional(),
    MAIL_PORT: z.coerce.number().optional(),
    MAIL_USER: z.string().optional(),
    MAIL_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),

    // S3 Storage
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_PUBLIC_URL: z.string().url().optional(),

    // System alerts
    SLACK_ALERT_WEBHOOK_URL: z.string().url().optional(),
    TELEGRAM_ALERT_BOT_TOKEN: z.string().optional(),
    TELEGRAM_ALERT_CHAT_ID: z.string().optional(),
    SYSTEM_ALERT_MEMORY_MB: z.coerce.number().min(128).optional(),
    SYSTEM_ALERT_LATENCY_MS: z.coerce.number().min(100).optional(),
    SYSTEM_ALERT_TENANT_REQUESTS: z.coerce.number().min(10).optional(),
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

    if (env.AI_PROVIDER === 'gateway' && !env.AI_ENDPOINT_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_ENDPOINT_URL'],
        message: 'AI_ENDPOINT_URL is required when AI_PROVIDER=gateway',
      });
    }

    if (env.NODE_ENV === 'production' && env.MCP_ENABLED && !env.MCP_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MCP_API_KEY'],
        message: 'MCP_API_KEY is required when MCP is enabled in production',
      });
    }

    if (env.NODE_ENV === 'production' && !env.JWT_RESET_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_RESET_SECRET'],
        message: 'JWT_RESET_SECRET is required in production',
      });
    }

    if (env.MAIL_ENABLED) {
      if (!env.MAIL_HOST || !env.MAIL_PORT || !env.MAIL_USER || !env.MAIL_PASS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MAIL_ENABLED'],
          message:
            'SMTP credentials (host, port, user, pass) are required when MAIL_ENABLED is true',
        });
      }

      if (!env.NEXT_PUBLIC_WEB_STUDENT_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['NEXT_PUBLIC_WEB_STUDENT_URL'],
          message: 'NEXT_PUBLIC_WEB_STUDENT_URL is required when MAIL_ENABLED is true',
        });
      }
    }
  });

export type EnvSchema = z.infer<typeof envSchema>;
