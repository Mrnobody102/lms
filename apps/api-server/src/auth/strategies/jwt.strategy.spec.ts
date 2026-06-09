import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  invalidateAuthUser,
  invalidateAuthUsersForTenant,
} from '../../common/cache/auth-user-cache';
import { JwtStrategy, clearJwtUserCacheForTests, type JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    clearJwtUserCacheForTests();
    prisma = {
      user: {
        findFirst: vi.fn(),
      },
    };

    strategy = new JwtStrategy(
      {
        get: vi.fn().mockReturnValue('jwt-secret'),
      } as never,
      prisma as never,
    );
  });

  it('should reject when user is inactive or tenant is disabled', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: false,
      tenantId: 'tenant-1',
      tokenVersion: 0,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      tenant: {
        isActive: true,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'student@example.com',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        tokenVersion: 0,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject when payload tenant does not match user tenant', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: true,
      tenantId: 'tenant-2',
      tokenVersion: 0,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      tenant: {
        isActive: true,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'student@example.com',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        tokenVersion: 0,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject when the token version is stale', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: true,
      tenantId: 'tenant-1',
      tokenVersion: 2,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      tenant: {
        isActive: true,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'student@example.com',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        tokenVersion: 1,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should return the safe user payload when token and tenant are valid', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: true,
      tenantId: 'tenant-1',
      tokenVersion: 0,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      tenant: {
        isActive: true,
      },
    });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'student@example.com',
      role: 'STUDENT',
      tenantId: 'tenant-1',
      tokenVersion: 0,
    } satisfies JwtPayload);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'student@example.com',
        tenantId: 'tenant-1',
      }),
    );
    expect(result).not.toHaveProperty('tenant');
    expect(result).not.toHaveProperty('tokenVersion');
  });

  it('should serve a repeat request from cache without a second database lookup', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: true,
      tenantId: 'tenant-1',
      tokenVersion: 0,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      tenant: { isActive: true },
    });

    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'student@example.com',
      role: 'STUDENT',
      tenantId: 'tenant-1',
      tokenVersion: 0,
    };

    await strategy.validate(payload);
    await strategy.validate(payload);

    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
  });

  it('should re-validate against the database after a token version bump', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        tokenVersion: 0,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
        tenant: { isActive: true },
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        tokenVersion: 1,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
        tenant: { isActive: true },
      });

    const oldToken: JwtPayload = {
      sub: 'user-1',
      email: 'student@example.com',
      role: 'STUDENT',
      tenantId: 'tenant-1',
      tokenVersion: 0,
    };

    // Prime the hot-path cache with the old token before the password change.
    await strategy.validate(oldToken);

    // Password change/reset invalidates the per-user auth cache immediately,
    // forcing the next request to compare the old token with the DB version.
    invalidateAuthUser('user-1');

    await expect(strategy.validate(oldToken)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
  });

  it('should re-validate tenant users after tenant cache invalidation', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        tokenVersion: 0,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
        tenant: { isActive: true },
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        tokenVersion: 0,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
        tenant: { isActive: false },
      });

    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'student@example.com',
      role: 'STUDENT',
      tenantId: 'tenant-1',
      tokenVersion: 0,
    };

    await strategy.validate(payload);
    invalidateAuthUsersForTenant('tenant-1');

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
  });
});
