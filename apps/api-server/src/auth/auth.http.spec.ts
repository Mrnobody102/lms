import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PassportModule } from '@nestjs/passport';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { PrismaService } from '../common/services/prisma.service';
import { TenantMiddleware } from '../common/middleware/tenant.middleware';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('Auth HTTP flow', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  const currentUser = {
    id: 'user-1',
    email: 'student@example.com',
    password: 'hashed-password',
    fullName: 'Student User',
    phoneNumber: null,
    avatarUrl: null,
    role: 'STUDENT',
    isActive: true,
    tenantId: 'tenant-1',
    tokenVersion: 0,
    createdAt: new Date('2026-04-21T00:00:00.000Z'),
    updatedAt: new Date('2026-04-21T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id !== currentUser.id) {
            return Promise.resolve(null);
          }

          return Promise.resolve({
            id: currentUser.id,
            email: currentUser.email,
            fullName: currentUser.fullName,
            phoneNumber: currentUser.phoneNumber,
            avatarUrl: currentUser.avatarUrl,
            role: currentUser.role,
            isActive: currentUser.isActive,
            tenantId: currentUser.tenantId,
            tokenVersion: currentUser.tokenVersion,
            createdAt: currentUser.createdAt,
            updatedAt: currentUser.updatedAt,
            tenant: {
              isActive: true,
            },
          });
        }),
        findFirst: vi
          .fn()
          .mockImplementation(
            ({
              where,
              select,
            }: {
              where: Record<string, unknown>;
              select?: Record<string, unknown>;
            }) => {
              if (where.email) {
                const email =
                  typeof where.email === 'object' && where.email !== null && 'equals' in where.email
                    ? (where.email.equals as string)
                    : where.email;
                const matchesLogin =
                  email === currentUser.email &&
                  where.tenantId === currentUser.tenantId &&
                  where.deletedAt === null;
                return Promise.resolve(matchesLogin ? currentUser : null);
              }

              if (where.id === currentUser.id && where.deletedAt === null) {
                if (select?.tenant) {
                  return Promise.resolve({
                    id: currentUser.id,
                    email: currentUser.email,
                    fullName: currentUser.fullName,
                    phoneNumber: currentUser.phoneNumber,
                    avatarUrl: currentUser.avatarUrl,
                    role: currentUser.role,
                    isActive: currentUser.isActive,
                    tenantId: currentUser.tenantId,
                    tokenVersion: currentUser.tokenVersion,
                    createdAt: currentUser.createdAt,
                    updatedAt: currentUser.updatedAt,
                    tenant: {
                      id: currentUser.tenantId,
                      name: 'Tenant One',
                      slug: 'tenant-one',
                      isActive: true,
                    },
                  });
                }

                return Promise.resolve(currentUser);
              }

              return Promise.resolve(null);
            },
          ),
        create: vi.fn(),
        update: vi
          .fn()
          .mockImplementation(
            ({ data }: { data: { password?: string; tokenVersion?: { increment?: number } } }) => {
              if (typeof data.password === 'string') {
                currentUser.password = data.password;
              }

              const tokenVersionIncrement = data.tokenVersion?.increment ?? 0;
              if (tokenVersionIncrement > 0) {
                currentUser.tokenVersion += tokenVersionIncrement;
              }

              return Promise.resolve({
                id: currentUser.id,
                email: currentUser.email,
                fullName: currentUser.fullName,
                phoneNumber: currentUser.phoneNumber,
                avatarUrl: currentUser.avatarUrl,
                role: currentUser.role,
                isActive: currentUser.isActive,
                tenantId: currentUser.tenantId,
                tokenVersion: currentUser.tokenVersion,
                createdAt: currentUser.createdAt,
                updatedAt: currentUser.updatedAt,
              });
            },
          ),
      },
      tenant: {
        findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          if ('OR' in where) {
            const hints = Array.isArray(where.OR) ? where.OR : [];
            const matchesTenantOne = hints.some(
              (entry) =>
                entry &&
                typeof entry === 'object' &&
                ('id' in entry || 'slug' in entry || 'domain' in entry) &&
                Object.values(entry).includes('tenant-1'),
            );
            const matchesTenantTwo = hints.some(
              (entry) =>
                entry &&
                typeof entry === 'object' &&
                ('id' in entry || 'slug' in entry || 'domain' in entry) &&
                Object.values(entry).includes('tenant-2'),
            );

            if (matchesTenantOne) {
              return Promise.resolve({ id: 'tenant-1' });
            }

            if (matchesTenantTwo) {
              return Promise.resolve({ id: 'tenant-2' });
            }

            return Promise.resolve(null);
          }

          if (where.id === 'tenant-1' && where.isActive === true) {
            return Promise.resolve({ id: 'tenant-1' });
          }

          if (where.id === 'tenant-2' && where.isActive === true) {
            return Promise.resolve({ id: 'tenant-2' });
          }

          return Promise.resolve(null);
        }),
      },
    };

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [AuthController, UserController],
      providers: [
        AuthService,
        UserService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'test-jwt-secret';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());

    const tenantMiddleware = new TenantMiddleware(prisma as any);
    app.use((req: Request, res: Response, next: NextFunction) => {
      void tenantMiddleware.use(req as any, res as any, next).catch(next);
    });

    await app.init();
    agent = request.agent(app.getHttpServer());
  }, 30000);

  afterEach(async () => {
    await app.close();
  }, 15000);

  it('should login with tenant context and set the auth cookie', async () => {
    const response = await agent
      .post('/auth/login')
      .set('x-tenant-id', 'tenant-1')
      .send({
        email: 'student@example.com',
        password: 'Student@123',
      })
      .expect(200);

    expect(response.body).toEqual({
      user: expect.objectContaining({
        id: 'user-1',
        email: 'student@example.com',
        tenantId: 'tenant-1',
      }),
    });
    expect(response.body).not.toHaveProperty('token');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('access_token=')]),
    );
  });

  it('should use the cookie session to read /users/me', async () => {
    await agent
      .post('/auth/login')
      .set('x-tenant-id', 'tenant-1')
      .send({
        email: 'student@example.com',
        password: 'Student@123',
      })
      .expect(200);

    const response = await agent.get('/users/me').set('x-tenant-id', 'tenant-1').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'student@example.com',
        tenantId: 'tenant-1',
        tenant: expect.objectContaining({
          id: 'tenant-1',
          slug: 'tenant-one',
        }),
      }),
    );
  });

  it('should reject the same session when request tenant does not match', async () => {
    await agent
      .post('/auth/login')
      .set('x-tenant-id', 'tenant-1')
      .send({
        email: 'student@example.com',
        password: 'Student@123',
      })
      .expect(200);

    await agent.get('/users/me').set('x-tenant-id', 'tenant-2').expect(403);
  });

  it('should logout and invalidate the cookie session', async () => {
    await agent
      .post('/auth/login')
      .set('x-tenant-id', 'tenant-1')
      .send({
        email: 'student@example.com',
        password: 'Student@123',
      })
      .expect(200);

    const logoutResponse = await agent
      .post('/auth/logout')
      .set('x-tenant-id', 'tenant-1')
      .expect(200);

    expect(logoutResponse.body).toEqual({
      success: true,
      message: 'Logged out successfully',
    });
    expect(logoutResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('access_token=')]),
    );

    await agent.get('/users/me').set('x-tenant-id', 'tenant-1').expect(401);
  });

  it('should invalidate the old session after password change', async () => {
    await agent
      .post('/auth/login')
      .set('x-tenant-id', 'tenant-1')
      .send({
        email: 'student@example.com',
        password: 'Student@123',
      })
      .expect(200);

    await agent
      .put('/users/change-password')
      .set('x-tenant-id', 'tenant-1')
      .send({
        currentPassword: 'Student@123',
        newPassword: 'NewPassword123!',
      })
      .expect(200);

    await agent.get('/users/me').set('x-tenant-id', 'tenant-1').expect(401);
  });

  it('should reject login without tenant context', async () => {
    await agent
      .post('/auth/login')
      .send({
        email: 'student@example.com',
        password: 'Student@123',
      })
      .expect(400);
  });
});
