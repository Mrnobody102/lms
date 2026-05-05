import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextFunction, Response } from 'express';
import { TenantMiddleware } from './tenant.middleware';
import type { TenantAwareRequest } from '../utils/tenant-request.util';

describe('TenantMiddleware', () => {
  let prisma: {
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  let configService: {
    get: ReturnType<typeof vi.fn>;
  };
  let middleware: TenantMiddleware;
  let next: NextFunction;
  let response: Response;

  beforeEach(() => {
    prisma = {
      tenant: {
        findFirst: vi.fn(),
      },
    };

    configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'CORS_ORIGINS') return 'https://school.example.com';
        if (key === 'ALLOW_TENANT_HEADER_IN_PRODUCTION') return false;
        return undefined;
      }),
    };

    middleware = new TenantMiddleware(prisma as never, configService as never);
    next = vi.fn();
    response = {} as Response;
  });

  it('should resolve the exact tenant domain before falling back to the slug', async () => {
    prisma.tenant.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'tenant-school' });

    const request = {
      method: 'POST',
      headers: {
        origin: 'https://school.example.com',
        host: 'api.example.com',
      },
    } as TenantAwareRequest;

    await middleware.use(request, response, next);

    expect(prisma.tenant.findFirst).toHaveBeenCalledTimes(2);
    expect(request.tenantId).toBe('tenant-school');
    expect(request.requestedTenantHint).toBe('school.example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reject production origins that are not in the allowlist', async () => {
    const request = {
      method: 'POST',
      headers: {
        origin: 'https://attacker.example.com',
        host: 'api.example.com',
      },
    } as TenantAwareRequest;

    await middleware.use(request, response, next);

    expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
    expect(request.tenantId).toBeUndefined();
    expect(request.requestedTenantHint).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
