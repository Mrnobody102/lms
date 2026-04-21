import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@repo/database';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('should reject missing user', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-1',
        }),
      }),
    } as any;

    expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
  });

  it('should reject non-super-admin when tenant does not match', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-2',
        }),
      }),
    } as any;

    expect(() =>
      guard.handleRequest(null, { tenantId: 'tenant-1', role: Role.ADMIN }, null, context),
    ).toThrow(ForbiddenException);
  });

  it('should allow super-admin to access another tenant scope', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-2',
        }),
      }),
    } as any;

    const result = guard.handleRequest(
      null,
      { tenantId: 'tenant-1', role: Role.SUPER_ADMIN },
      null,
      context,
    );

    expect(result).toEqual({
      tenantId: 'tenant-1',
      role: Role.SUPER_ADMIN,
    });
  });

  it('should allow user when request tenant matches', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-1',
        }),
      }),
    } as any;

    const result = guard.handleRequest(
      null,
      { tenantId: 'tenant-1', role: Role.ADMIN },
      null,
      context,
    );

    expect(result).toEqual({
      tenantId: 'tenant-1',
      role: Role.ADMIN,
    });
  });
});
