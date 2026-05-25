import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '@repo/shared';

export { REQUEST_ID_HEADER };

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function resolveRequestId(headerValue: string | string[] | undefined): string {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (candidate && REQUEST_ID_PATTERN.test(candidate)) {
    return candidate;
  }

  return randomUUID();
}
