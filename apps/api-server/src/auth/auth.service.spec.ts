import { BadRequestException, ConflictException } from '@nestjs/common';
import { CSRF_COOKIE_NAME } from '@repo/shared';
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
      update: ReturnType<typeof vi.fn>;
    };
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    refreshToken: {
      create: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
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
        update: vi.fn(),
      },
      tenant: {
        findFirst: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
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

    const mailService = {
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    };

    const auditLog = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
      mailService as never,
      auditLog as never,
    );
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
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should normalize email before creating the user without starting a session', async () => {
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
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(response.cookie).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
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
        CSRF_COOKIE_NAME,
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

    it('should default production cookies to cross-site compatible SameSite none', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
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

      try {
        await service.login(
          {
            email: 'student@example.com',
            password: 'Student@123',
          },
          'tenant-1',
          response,
        );

        expect(response.cookie).toHaveBeenCalledWith(
          'access_token',
          'signed-jwt-token',
          expect.objectContaining({
            secure: true,
            sameSite: 'none',
          }),
        );
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('loginWithGoogle', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '7d';
        if (key === 'GOOGLE_CLIENT_ID') return 'google-client-id';
        return undefined;
      });

      Object.defineProperty(service, 'googleClient', {
        value: {
          verifyIdToken: vi.fn().mockResolvedValue({
            getPayload: () => ({
              sub: 'google-subject-1',
              email: 'Student@Example.com',
              email_verified: true,
              name: 'Student Google',
              picture: 'https://example.com/avatar.png',
            }),
          }),
        },
      });
    });

    it('should auto-provision student accounts from verified Google credentials', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('random-password-hash' as never);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        password: 'random-password-hash',
        googleSubject: 'google-subject-1',
        googleEmailVerified: true,
        fullName: 'Student Google',
        phoneNumber: null,
        avatarUrl: 'https://example.com/avatar.png',
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        tokenVersion: 0,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      });

      const result = await service.loginWithGoogle(
        { credential: 'valid-google-id-token', portal: 'student' },
        'tenant-1',
        response,
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'student@example.com',
            googleSubject: 'google-subject-1',
            googleEmailVerified: true,
            role: 'STUDENT',
            tenantId: 'tenant-1',
          }),
        }),
      );
      expect(result.user).toEqual(
        expect.objectContaining({
          id: 'user-1',
          email: 'student@example.com',
          tenantId: 'tenant-1',
        }),
      );
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('googleSubject');
    });

    it('should reject Google login into the admin portal for student accounts', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', isActive: true });
      prisma.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        password: 'hashed-password',
        googleSubject: null,
        googleEmailVerified: false,
        fullName: 'Student User',
        phoneNumber: null,
        avatarUrl: null,
        role: 'STUDENT',
        isActive: true,
        tenantId: 'tenant-1',
        tokenVersion: 0,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date('2026-04-21T00:00:00.000Z'),
        updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      });

      await expect(
        service.loginWithGoogle(
          { credential: 'valid-google-id-token', portal: 'admin' },
          'tenant-1',
          response,
        ),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear the auth cookie', async () => {
      const result = await service.logout({}, response, 'user-1', 'tenant-1');

      expect(response.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(response.clearCookie).toHaveBeenCalledWith(
        CSRF_COOKIE_NAME,
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
