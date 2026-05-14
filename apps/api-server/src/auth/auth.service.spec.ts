import { BadRequestException, ConflictException } from '@nestjs/common';
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
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

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

    it('should normalize email before creating the user and sign a token', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValue(null);
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
          email: ' Student@Example.com ',
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
        tokenVersion: 0,
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
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
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

    it('should map unique constraint errors to a conflict response', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      prisma.user.create.mockRejectedValue({ code: 'P2002' });

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
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject invalid passwords with the generic login failure message', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        password: 'hashed-password',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        isActive: true,
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login(
          {
            email: 'student@example.com',
            password: 'Student@123',
          },
          'tenant-1',
          response,
        ),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should look up users with normalized email addresses', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        password: 'hashed-password',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        isActive: true,
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
        deletedAt: null,
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.login(
        {
          email: ' Student@Example.com ',
          password: 'Student@123',
        },
        'tenant-1',
        response,
      );

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: {
              equals: 'student@example.com',
              mode: 'insensitive',
            },
            tenantId: 'tenant-1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should reject inactive users with the generic login failure message', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        password: 'hashed-password',
        role: 'STUDENT',
        tenantId: 'tenant-1',
        isActive: false,
      });

      await expect(
        service.login(
          {
            email: 'student@example.com',
            password: 'Student@123',
          },
          'tenant-1',
          response,
        ),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return the user without password and set the auth cookie', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
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
        tokenVersion: 0,
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
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
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
      expect(result.user).not.toHaveProperty('tokenVersion');
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
      expect(response.clearCookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.objectContaining({
          httpOnly: false,
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
