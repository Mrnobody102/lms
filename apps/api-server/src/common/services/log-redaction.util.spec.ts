import { describe, expect, it } from 'vitest';
import { redactLogMeta } from './log-redaction.util';

describe('redactLogMeta', () => {
  it('redacts sensitive keys recursively while preserving safe fields', () => {
    const meta = redactLogMeta({
      method: 'POST',
      path: '/api/auth/login',
      password: 'secret-password',
      headers: {
        authorization: 'Bearer token',
        cookie: 'access_token=abc',
        userAgent: 'Mozilla/5.0',
      },
      nested: {
        apiKey: 'super-secret',
        profile: {
          refreshToken: 'refresh-token',
          tenantId: 'tenant-1',
        },
      },
    }) as Record<string, unknown>;

    expect(meta.password).toBe('[REDACTED]');
    expect((meta.headers as Record<string, unknown>).authorization).toBe('[REDACTED]');
    expect((meta.headers as Record<string, unknown>).cookie).toBe('[REDACTED]');
    expect((meta.headers as Record<string, unknown>).userAgent).toBe('Mozilla/5.0');
    expect((meta.nested as Record<string, unknown>).apiKey).toBe('[REDACTED]');
    expect(
      ((meta.nested as Record<string, unknown>).profile as Record<string, unknown>).refreshToken,
    ).toBe('[REDACTED]');
    expect(
      ((meta.nested as Record<string, unknown>).profile as Record<string, unknown>).tenantId,
    ).toBe('tenant-1');
  });

  it('reduces errors to a safe summary', () => {
    const error = new Error('boom');
    (error as Error & { password?: string }).password = 'secret';

    const meta = redactLogMeta({ error }) as Record<string, unknown>;
    const safeError = meta.error as Record<string, unknown>;

    expect(safeError.name).toBe('Error');
    expect(safeError.message).toBe('boom');
    expect(safeError.stack).toEqual(expect.any(String));
    expect(safeError.password).toBeUndefined();
  });

  it('handles circular references without recursing forever', () => {
    const meta: Record<string, unknown> = { label: 'cycle' };
    meta.self = meta;
    meta.items = [meta];

    const redacted = redactLogMeta(meta) as Record<string, unknown>;

    expect(redacted.label).toBe('cycle');
    expect(redacted.self).toBe('[REDACTED]');
    expect((redacted.items as unknown[])[0]).toBe('[REDACTED]');
  });
});
