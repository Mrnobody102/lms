import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { extractTenantHint, extractTenantHints } from './tenant-request.util';

function mockRequest(request: Partial<Request>): Request {
  return request as unknown as Request;
}

describe('extractTenantHint', () => {
  it('should accept x-tenant-id outside production for local development', () => {
    expect(
      extractTenantHint(
        mockRequest({
          headers: { 'x-tenant-id': 'tenant-1', host: 'localhost:4000' },
        }),
        { nodeEnv: 'development' },
      ),
    ).toBe('tenant-1');
  });

  it('should ignore x-tenant-id in production unless explicitly allowed', () => {
    expect(
      extractTenantHint(
        mockRequest({
          headers: { 'x-tenant-id': 'tenant-1', host: 'school.example.com' },
        }),
        { nodeEnv: 'production' },
      ),
    ).toBeUndefined();
  });

  it('should prefer the production origin host over the API host', () => {
    expect(
      extractTenantHints(
        mockRequest({
          headers: {
            origin: 'https://school.example.com',
            host: 'api.example.com',
          },
        }),
        { nodeEnv: 'production', allowedOrigins: ['https://school.example.com'] },
      ),
    ).toEqual(['school.example.com', 'school']);
  });

  it('should ignore production origins that are not in the trusted allowlist', () => {
    expect(
      extractTenantHints(
        mockRequest({
          headers: {
            origin: 'https://attacker.example.com',
            host: 'api.example.com',
          },
        }),
        { nodeEnv: 'production', allowedOrigins: ['https://school.example.com'] },
      ),
    ).toEqual([]);
  });

  it('should allow x-tenant-id in production only behind an explicit trusted deployment flag', () => {
    expect(
      extractTenantHint(
        mockRequest({
          headers: { 'x-tenant-id': 'tenant-1', host: 'school.example.com' },
        }),
        { nodeEnv: 'production', allowTenantHeaderInProduction: true },
      ),
    ).toBe('tenant-1');
  });

  it('should use Express hostname as a local fallback when no trusted origin is available', () => {
    expect(
      extractTenantHints(
        mockRequest({
          hostname: 'tenant.example.com',
          headers: { host: 'api.example.com' },
        }),
        { nodeEnv: 'development' },
      ),
    ).toEqual(['tenant.example.com', 'tenant']);
  });
});
