import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { AuthService } from './auth.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  let jwtService: {
    sign: ReturnType<typeof vi.fn>;
  };
  let configService: {
    get: ReturnType<typeof vi.fn>;
  };
  let response: Response;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      tenant: {
        findFirst: vi.fn(),
      },
    };

    jwtService = {
      sign: vi.fn().mockReturnValue('signed-jwt-token'),
    };

    configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '7d';
        return undefined;
      }),
    };

    response = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    service = new AuthService(prisma as any, jwtService as any, configService as any);
  });

  describe('register', () => {
    it('should reject registration without tenant context', async () => {
      await expect(
        service.register(
          {
            email: 'student@example.com',
            password: 'Student@123',
            fullName: 'Student User',
          },
          undefined,
          response,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject registration when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register(
          {
            email: 'student@example.com',
            password: 'Student@123',
            fullName: 'Student User',
          },
          'tenant-1',
          response,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should create the user, sign a token, and set the auth cookie', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.create.mockResolvedValue({
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
      });
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

      const result = await service.register(
        {
          email: 'student@example.com',
          password: 'Student@123',
          fullName: 'Student User',
        },
        'tenant-1',
        response,
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'student@example.com',
            password: 'hashed-password',
            tenantId: 'tenant-1',
          }),
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'student@example.com',
        role: 'STUDENT',
        tenantId: 'tenant-1',
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user-1',
          email: 'student@example.com',
          tenantId: 'tenant-1',
        }),
      });
    });
  });

  describe('login', () => {
    it('should reject login without tenant context', async () => {
      await expect(
        service.login(
          {
            email: 'student@example.com',
            password: 'Student@123',
          },
          undefined,
          response,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject login when tenant is inactive', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        password: 'hashed-password',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        isActive: true,
      });
      prisma.tenant.findFirst.mockResolvedValue(null);

      await expect(
        service.login(
          {
            email: 'student@example.com',
            password: 'Student@123',
          },
          'tenant-1',
          response,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return the user without password and set the auth cookie', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        password: 'hashed-password',
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
        deletedAt: null,
      });
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(
        {
          email: 'student@example.com',
          password: 'Student@123',
        },
        'tenant-1',
        response,
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'student@example.com',
        role: 'STUDENT',
        tenantId: 'tenant-1',
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user-1',
          email: 'student@example.com',
          tenantId: 'tenant-1',
        }),
      });
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('logout', () => {
    it('should clear the auth cookie', () => {
      const result = service.logout(response);

      expect(response.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});
