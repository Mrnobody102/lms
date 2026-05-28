export function getApiErrorMessage(error: unknown, fallback: string, serverFallback?: string) {
  const response = getRecordProperty(error, 'response');
  const status = getNumberProperty(response, 'status');
  const data = getRecordProperty(response, 'data');
  const message = getMessage(data);

  if (status !== null && status >= 500) {
    return serverFallback ?? fallback;
  }

  if (message && message !== 'Internal server error') {
    return message;
  }

  return fallback;
}

function getRecordProperty(value: unknown, property: string): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || !(property in value)) {
    return null;
  }

  const propertyValue = (value as Record<string, unknown>)[property];
  return propertyValue && typeof propertyValue === 'object'
    ? (propertyValue as Record<string, unknown>)
    : null;
}

function getNumberProperty(value: Record<string, unknown> | null, property: string) {
  if (!value) {
    return null;
  }

  const propertyValue = value[property];
  return typeof propertyValue === 'number' ? propertyValue : null;
}

function getMessage(data: Record<string, unknown> | null) {
  if (!data) {
    return null;
  }

  const message = data.message;
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string').join(' ');
  }

  return typeof message === 'string' ? message : null;
}
