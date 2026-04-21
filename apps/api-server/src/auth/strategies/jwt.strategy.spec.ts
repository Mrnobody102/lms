import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtStrategy, type JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
      },
    };

    strategy = new JwtStrategy(
      {
        get: vi.fn().mockReturnValue('jwt-secret'),
      } as any,
      prisma as any,
    );
  });

  it('should reject when user is inactive or tenant is disabled', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: false,
      tenantId: 'tenant-1',
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
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject when payload tenant does not match user tenant', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: true,
      tenantId: 'tenant-2',
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
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should return the safe user payload when token and tenant are valid', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student User',
      phoneNumber: null,
      avatarUrl: null,
      role: 'STUDENT',
      isActive: true,
      tenantId: 'tenant-1',
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
    } satisfies JwtPayload);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'student@example.com',
        tenantId: 'tenant-1',
      }),
    );
    expect(result).not.toHaveProperty('tenant');
  });
});
