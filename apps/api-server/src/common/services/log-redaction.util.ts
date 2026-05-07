const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|cookie|api[-_]?key)/i;

function isPlainObject(value: object): value is Record<string, unknown> {
  return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date || value instanceof RegExp || value instanceof URL) {
    return value;
  }

  if (seen.has(value)) {
    return REDACTED_VALUE;
  }

  seen.add(value);
  try {
    if (value instanceof Error) {
      const safeError: Record<string, unknown> = {
        name: value.name,
        message: value.message,
      };

      if (value.stack) {
        safeError.stack = value.stack;
      }

      if ('cause' in value && value.cause !== undefined) {
        safeError.cause = redactValue(value.cause, seen);
      }

      return safeError;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => redactValue(entry, seen));
    }

    if (!isPlainObject(value)) {
      return value;
    }

    const redacted: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      redacted[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED_VALUE : redactValue(entry, seen);
    }

    return redacted;
  } finally {
    seen.delete(value);
  }
}

export function redactLogMeta<T>(meta: T): T {
  return redactValue(meta, new WeakSet<object>()) as T;
}
