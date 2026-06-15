export type AiProviderFailureCategory =
  | 'configuration'
  | 'invalid_response'
  | 'provider'
  | 'rate_limit'
  | 'timeout'
  | 'transient'
  | 'unknown';

export interface AiProviderFailureSnapshot {
  category: AiProviderFailureCategory;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

interface AiProviderErrorOptions {
  cause?: unknown;
  retryable?: boolean;
  statusCode?: number;
}

export class AiProviderError extends Error {
  readonly category: AiProviderFailureCategory;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(
    category: AiProviderFailureCategory,
    message: string,
    options: AiProviderErrorOptions = {},
  ) {
    super(message);
    this.name = 'AiProviderError';
    this.category = category;
    this.retryable = options.retryable ?? isRetryableCategory(category);
    this.statusCode = options.statusCode;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function classifyAiProviderError(error: unknown): AiProviderFailureSnapshot {
  if (error instanceof AiProviderError) {
    return {
      category: error.category,
      message: error.message,
      retryable: error.retryable,
      statusCode: error.statusCode,
    };
  }

  if (isAbortError(error)) {
    return {
      category: 'timeout',
      message: 'AI provider request timed out',
      retryable: true,
    };
  }

  if (isFetchNetworkError(error)) {
    return {
      category: 'transient',
      message: error.message,
      retryable: true,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      category: 'invalid_response',
      message: error.message,
      retryable: false,
    };
  }

  if (error instanceof Error) {
    return {
      category: 'unknown',
      message: error.message,
      retryable: false,
    };
  }

  return {
    category: 'unknown',
    message: String(error),
    retryable: false,
  };
}

export function createAiProviderHttpError(
  statusCode: number,
  providerMessage?: string,
): AiProviderError {
  if (statusCode === 401 || statusCode === 403) {
    return new AiProviderError(
      'configuration',
      providerMessage || `AI provider rejected credentials with status ${statusCode}`,
      { retryable: false, statusCode },
    );
  }

  if (statusCode === 429) {
    return new AiProviderError(
      'rate_limit',
      providerMessage || 'AI provider rate limit was reached',
      { retryable: true, statusCode },
    );
  }

  if (statusCode >= 500) {
    return new AiProviderError(
      'transient',
      providerMessage || `AI provider returned status ${statusCode}`,
      { retryable: true, statusCode },
    );
  }

  return new AiProviderError(
    'provider',
    providerMessage || `AI provider returned status ${statusCode}`,
    { retryable: false, statusCode },
  );
}

export function normalizeAiTimeoutMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeAiMaxRetries(value: string | undefined, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, 3);
}

export async function waitForAiRetry(attempt: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.min(100 * attempt, 300)));
}

function isRetryableCategory(category: AiProviderFailureCategory): boolean {
  return category === 'rate_limit' || category === 'timeout' || category === 'transient';
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isFetchNetworkError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error instanceof TypeError && error.message === 'fetch failed') {
    return true;
  }

  const cause = readErrorCause(error);
  const code = typeof cause.code === 'string' ? cause.code : undefined;
  return Boolean(
    code && ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(code),
  );
}

function readErrorCause(error: Error): Record<string, unknown> {
  const cause = error.cause;
  return cause && typeof cause === 'object' && !Array.isArray(cause)
    ? (cause as Record<string, unknown>)
    : {};
}
