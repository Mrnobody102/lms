import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PassportModule } from '@nestjs/passport';
import { ProgressStatus, Role } from '@repo/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { CourseController } from './course/course.controller';
import { CourseService } from './course/course.service';
import { LessonController } from './lesson/lesson.controller';
import { LessonService } from './lesson/lesson.service';
import { ProgressController } from './progress/progress.controller';
import { ProgressService } from './progress/progress.service';
import { PrismaService } from './common/services/prisma.service';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('Tenant resource HTTP flow', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    course: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    lesson: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
    userLessonProgress: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
  };

  const tenantOneId = '11111111-1111-4111-8111-111111111111';
  const tenantTwoId = '22222222-2222-4222-8222-222222222222';
  const courseOneId = '33333333-3333-4333-8333-333333333333';
  const courseTwoId = '44444444-4444-4444-8444-444444444444';
  const lessonOneId = '55555555-5555-4555-8555-555555555555';
  const lessonTwoId = '66666666-6666-4666-8666-666666666666';

  const currentUser = {
    id: 'user-1',
    email: 'student@example.com',
    password: 'hashed-password',
    fullName: 'Student User',
    phoneNumber: null,
    avatarUrl: null,
    role: Role.STUDENT,
    isActive: true,
    tenantId: tenantOneId,
    createdAt: new Date('2026-04-21T00:00:00.000Z'),
    updatedAt: new Date('2026-04-21T00:00:00.000Z'),
    deletedAt: null,
  };

  const courses = [
    {
      id: courseOneId,
      title: 'HSK 1 Basics',
      slug: 'hsk-1-basics',
      totalDuration: 30,
      tenantId: tenantOneId,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      deletedAt: null,
    },
    {
      id: courseTwoId,
      title: 'Tenant Two Course',
      slug: 'tenant-two-course',
      totalDuration: 45,
      tenantId: tenantTwoId,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      deletedAt: null,
    },
  ];

  const lessons = [
    {
      id: lessonOneId,
      title: 'Lesson 1',
      type: 'text',
      content: 'Lesson content',
      videoUrl: null,
      duration: 10,
      order: 1,
      quiz: null,
      courseId: courseOneId,
      tenantId: tenantOneId,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      deletedAt: null,
    },
    {
      id: lessonTwoId,
      title: 'Lesson T2',
      type: 'text',
      content: 'Tenant 2 lesson',
      videoUrl: null,
      duration: 12,
      order: 1,
      quiz: null,
      courseId: courseTwoId,
      tenantId: tenantTwoId,
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-21T00:00:00.000Z'),
      deletedAt: null,
    },
  ];

  let progressRecords: Array<{
    id: string;
    userId: string;
    lessonId: string;
    tenantId: string;
    status: ProgressStatus;
    updatedAt: Date;
  }>;

  beforeEach(async () => {
    progressRecords = [];

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
            createdAt: currentUser.createdAt,
            updatedAt: currentUser.updatedAt,
            tenant: {
              isActive: true,
            },
          });
        }),
        findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          if (where.id === currentUser.id && where.deletedAt === null) {
            return Promise.resolve({
              id: currentUser.id,
              email: currentUser.email,
              fullName: currentUser.fullName,
              phoneNumber: currentUser.phoneNumber,
              avatarUrl: currentUser.avatarUrl,
              role: currentUser.role,
              isActive: currentUser.isActive,
              tenantId: currentUser.tenantId,
              createdAt: currentUser.createdAt,
              updatedAt: currentUser.updatedAt,
              tenant: {
                isActive: true,
              },
            });
          }

          const matchesLogin =
            where.email === currentUser.email &&
            where.tenantId === currentUser.tenantId &&
            where.deletedAt === null;

          return Promise.resolve(matchesLogin ? currentUser : null);
        }),
      },
      tenant: {
        findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          if ('OR' in where) {
            const hints = Array.isArray(where.OR) ? where.OR : [];
            const matchesTenantOne = hints.some(
              (entry) =>
                entry && typeof entry === 'object' && Object.values(entry).includes(tenantOneId),
            );
            const matchesTenantTwo = hints.some(
              (entry) =>
                entry && typeof entry === 'object' && Object.values(entry).includes(tenantTwoId),
            );

            if (matchesTenantOne) {
              return Promise.resolve({ id: tenantOneId });
            }

            if (matchesTenantTwo) {
              return Promise.resolve({ id: tenantTwoId });
            }

            return Promise.resolve(null);
          }

          if (where.id === tenantOneId && where.isActive === true) {
            return Promise.resolve({ id: tenantOneId });
          }

          if (where.id === tenantTwoId && where.isActive === true) {
            return Promise.resolve({ id: tenantTwoId });
          }

          return Promise.resolve(null);
        }),
      },
      course: {
        findMany: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          const scopedCourses = courses
            .filter((course) => course.tenantId === where.tenantId && course.deletedAt === null)
            .map((course) => ({
              ...course,
              _count: {
                lessons: lessons.filter(
                  (lesson) => lesson.courseId === course.id && lesson.deletedAt === null,
                ).length,
              },
            }));

          return Promise.resolve(scopedCourses);
        }),
        count: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          return Promise.resolve(
            courses.filter(
              (course) => course.tenantId === where.tenantId && course.deletedAt === null,
            ).length,
          );
        }),
        findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          const course = courses.find(
            (entry) =>
              entry.id === where.id &&
              entry.tenantId === where.tenantId &&
              entry.deletedAt === where.deletedAt,
          );

          if (!course) {
            return Promise.resolve(null);
          }

          return Promise.resolve({
            ...course,
            lessons: lessons
              .filter((lesson) => lesson.courseId === course.id && lesson.deletedAt === null)
              .sort((a, b) => a.order - b.order),
          });
        }),
      },
      lesson: {
        findMany: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          return Promise.resolve(
            lessons
              .filter(
                (lesson) =>
                  lesson.courseId === where.courseId &&
                  lesson.tenantId === where.tenantId &&
                  lesson.deletedAt === null,
              )
              .sort((a, b) => a.order - b.order),
          );
        }),
        count: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          return Promise.resolve(
            lessons.filter(
              (lesson) =>
                lesson.courseId === where.courseId &&
                lesson.tenantId === where.tenantId &&
                lesson.deletedAt === null,
            ).length,
          );
        }),
        findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
          const lesson = lessons.find(
            (entry) =>
              entry.id === where.id &&
              entry.tenantId === where.tenantId &&
              (!('deletedAt' in where) || entry.deletedAt === where.deletedAt),
          );

          return Promise.resolve(lesson ?? null);
        }),
      },
      userLessonProgress: {
        findMany: vi.fn().mockImplementation(
          ({
            where,
          }: {
            where: {
              userId: string;
              lesson: { courseId: string; tenantId: string };
            };
          }) => {
            return Promise.resolve(
              progressRecords
                .filter((record) => {
                  const lesson = lessons.find((entry) => entry.id === record.lessonId);
                  return (
                    record.userId === where.userId &&
                    lesson?.courseId === where.lesson.courseId &&
                    lesson?.tenantId === where.lesson.tenantId
                  );
                })
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
            );
          },
        ),
        findFirst: vi.fn().mockImplementation(
          ({
            where,
          }: {
            where: {
              userId: string;
              lessonId: string;
              lesson: { tenantId: string };
            };
          }) => {
            const record = progressRecords.find((entry) => {
              const lesson = lessons.find((lessonEntry) => lessonEntry.id === entry.lessonId);
              return (
                entry.userId === where.userId &&
                entry.lessonId === where.lessonId &&
                lesson?.tenantId === where.lesson.tenantId
              );
            });

            return Promise.resolve(record ?? null);
          },
        ),
        upsert: vi.fn().mockImplementation(
          ({
            where,
            update,
            create,
          }: {
            where: { userId_lessonId: { userId: string; lessonId: string } };
            update: { status: ProgressStatus };
            create: {
              userId: string;
              lessonId: string;
              tenantId: string;
              status: ProgressStatus;
            };
          }) => {
            const existingIndex = progressRecords.findIndex(
              (entry) =>
                entry.userId === where.userId_lessonId.userId &&
                entry.lessonId === where.userId_lessonId.lessonId,
            );

            if (existingIndex >= 0) {
              progressRecords[existingIndex] = {
                ...progressRecords[existingIndex],
                status: update.status,
                updatedAt: new Date('2026-04-21T12:00:00.000Z'),
              };

              return Promise.resolve(progressRecords[existingIndex]);
            }

            const record = {
              id: 'progress-1',
              userId: create.userId,
              lessonId: create.lessonId,
              tenantId: create.tenantId,
              status: create.status,
              updatedAt: new Date('2026-04-21T12:00:00.000Z'),
            };

            progressRecords.push(record);
            return Promise.resolve(record);
          },
        ),
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
      controllers: [AuthController, CourseController, LessonController, ProgressController],
      providers: [
        AuthService,
        CourseService,
        LessonService,
        ProgressService,
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
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    const tenantMiddleware = new TenantMiddleware(prisma as never);
    app.use((req: Request, res: Response, next: NextFunction) => {
      void tenantMiddleware.use(req as never, res as never, next).catch(next);
    });

    await app.init();
    agent = request.agent(app.getHttpServer());
  }, 30000);

  afterEach(async () => {
    await app.close();
  }, 15000);

  async function loginTenantOne() {
    const response = await agent
      .post('/auth/login')
      .set('x-tenant-id', tenantOneId)
      .send({
        email: currentUser.email,
        password: 'Student@123',
      })
      .expect(200);

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('access_token=')]),
    );
  }

  it('should list courses with the authenticated cookie session', async () => {
    await loginTenantOne();

    const response = await agent.get('/courses').set('x-tenant-id', tenantOneId).expect(200);

    expect(response.body).toEqual({
      data: [
        expect.objectContaining({
          id: courseOneId,
          tenantId: tenantOneId,
        }),
      ],
      meta: expect.objectContaining({
        total: 1,
        totalPages: 1,
      }),
    });
  });

  it('should list lessons only inside the authenticated tenant scope', async () => {
    await loginTenantOne();

    const response = await agent
      .get(`/lessons?courseId=${courseOneId}`)
      .set('x-tenant-id', tenantOneId)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        expect.objectContaining({
          id: lessonOneId,
          tenantId: tenantOneId,
          courseId: courseOneId,
        }),
      ],
      meta: expect.objectContaining({
        total: 1,
        totalPages: 1,
      }),
    });
  });

  it('should reject course detail access when the tenant header does not match the session', async () => {
    await loginTenantOne();

    await agent.get(`/courses/${courseOneId}`).set('x-tenant-id', tenantTwoId).expect(403);
  });

  it('should reject lesson detail access when the tenant header does not match the session', async () => {
    await loginTenantOne();

    await agent.get(`/lessons/${lessonOneId}`).set('x-tenant-id', tenantTwoId).expect(403);
  });

  it('should update and read course progress inside the authenticated tenant', async () => {
    await loginTenantOne();

    const updateResponse = await agent
      .post('/progress/update')
      .set('x-tenant-id', tenantOneId)
      .send({
        lessonId: lessonOneId,
        status: ProgressStatus.COMPLETED,
      })
      .expect(201);

    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        lessonId: lessonOneId,
        tenantId: tenantOneId,
        status: ProgressStatus.COMPLETED,
      }),
    );

    const courseProgress = await agent
      .get(`/progress/course/${courseOneId}`)
      .set('x-tenant-id', tenantOneId)
      .expect(200);

    expect(courseProgress.body).toEqual([
      expect.objectContaining({
        lessonId: lessonOneId,
        status: ProgressStatus.COMPLETED,
      }),
    ]);

    const lessonProgress = await agent
      .get(`/progress/lesson/${lessonOneId}`)
      .set('x-tenant-id', tenantOneId)
      .expect(200);

    expect(lessonProgress.body).toEqual(
      expect.objectContaining({
        lessonId: lessonOneId,
        status: ProgressStatus.COMPLETED,
      }),
    );
  });

  it('should reject progress APIs when the tenant header does not match the session', async () => {
    await loginTenantOne();

    await agent
      .post('/progress/update')
      .set('x-tenant-id', tenantTwoId)
      .send({
        lessonId: lessonOneId,
        status: ProgressStatus.COMPLETED,
      })
      .expect(403);

    await agent.get(`/progress/course/${courseOneId}`).set('x-tenant-id', tenantTwoId).expect(403);
  });
});
