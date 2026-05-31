export function getApiErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  return typeof response.status === 'number' ? response.status : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error)) return fallback;

  const response = error.response;
  if (isRecord(response)) {
    const data = response.data;
    if (isRecord(data)) {
      const message = data.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) {
        return message.join('\n');
      }
    }
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
