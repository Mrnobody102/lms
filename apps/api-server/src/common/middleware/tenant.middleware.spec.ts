import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextFunction, Response } from 'express';

import {
  TenantMiddleware,
  clearTenantResolutionCacheForTests,
  invalidateTenantResolutionCacheForTenant,
} from './tenant.middleware';
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
    clearTenantResolutionCacheForTests();
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

  it('should accept production tenant headers only from allowed origins when explicitly enabled', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      if (key === 'CORS_ORIGINS') return 'https://student.vercel.app';
      if (key === 'ALLOW_TENANT_HEADER_IN_PRODUCTION') return true;
      return undefined;
    });
    prisma.tenant.findFirst.mockResolvedValueOnce({ id: 'tenant-1' });

    const request = {
      method: 'POST',
      headers: {
        'x-tenant-id': 'trung-tam-demo',
        origin: 'https://student.vercel.app',
        host: 'api.onrender.com',
      },
    } as unknown as TenantAwareRequest;

    await middleware.use(request, response, next);

    expect(prisma.tenant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ slug: 'trung-tam-demo' }, { domain: 'trung-tam-demo' }],
        }),
      }),
    );
    expect(request.tenantId).toBe('tenant-1');
    expect(request.requestedTenantHint).toBe('trung-tam-demo');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reuse the cached tenant id on repeat requests without hitting the database again', async () => {
    prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-school' });

    const buildRequest = () =>
      ({
        method: 'POST',
        headers: {
          origin: 'https://school.example.com',
          host: 'api.example.com',
        },
      }) as TenantAwareRequest;

    const first = buildRequest();
    await middleware.use(first, response, next);

    const second = buildRequest();
    await middleware.use(second, response, next);

    expect(first.tenantId).toBe('tenant-school');
    expect(second.tenantId).toBe('tenant-school');
    // Only the first request reaches the database; the second is served from
    // the in-process cache.
    expect(prisma.tenant.findFirst).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should keep checking later hints after a cached negative lookup', async () => {
    prisma.tenant.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'tenant-school' });

    const buildRequest = () =>
      ({
        method: 'POST',
        headers: {
          origin: 'https://school.example.com',
          host: 'api.example.com',
        },
      }) as TenantAwareRequest;

    const first = buildRequest();
    await middleware.use(first, response, next);

    const second = buildRequest();
    await middleware.use(second, response, next);

    expect(first.tenantId).toBe('tenant-school');
    expect(second.tenantId).toBe('tenant-school');
    // First request caches the full domain as null and the slug as a hit; the
    // second request must skip the cached null and still use the cached slug.
    expect(prisma.tenant.findFirst).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should cache invalid hints without allowing the request through', async () => {
    prisma.tenant.findFirst.mockResolvedValue(null);

    const buildRequest = () =>
      ({
        method: 'POST',
        headers: {
          origin: 'https://school.example.com',
          host: 'api.example.com',
        },
      }) as TenantAwareRequest;

    await expect(middleware.use(buildRequest(), response, next)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(middleware.use(buildRequest(), response, next)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    // The first request queries every hint candidate (full host, subdomain
    // label, and root domain) and caches each as null. The repeated invalid
    // request is rejected entirely from the cached null values without any
    // further database calls.
    expect(prisma.tenant.findFirst).toHaveBeenCalledTimes(3);
    expect(next).not.toHaveBeenCalled();
  });

  it('should re-check the database after a cached tenant is invalidated', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce({ id: 'tenant-school' });

    const buildRequest = () =>
      ({
        method: 'POST',
        headers: {
          origin: 'https://school.example.com',
          host: 'api.example.com',
        },
      }) as TenantAwareRequest;

    const first = buildRequest();
    await middleware.use(first, response, next);
    expect(first.tenantId).toBe('tenant-school');

    invalidateTenantResolutionCacheForTenant({
      id: 'tenant-school',
      slug: 'school',
      domain: 'school.example.com',
    });
    prisma.tenant.findFirst.mockResolvedValue(null);

    await expect(middleware.use(buildRequest(), response, next)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.tenant.findFirst).toHaveBeenCalledTimes(4);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
