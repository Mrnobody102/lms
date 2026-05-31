import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { TenantMiddleware } from '../common/middleware/tenant.middleware';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { LoggerService } from '../common/services/logger.service';
import { PrismaService } from '../common/services/prisma.service';
import { PublicCatalogController } from './public-catalog.controller';
import { PublicCatalogService } from './public-catalog.service';

describe('Public catalog HTTP flow', () => {
  let app: INestApplication;
  let prisma: {
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    course: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findFirst: vi.fn().mockResolvedValue({ id: 'tenant-1' }),
      },
      course: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'course-1',
            title: 'IELTS Foundations',
            slug: 'ielts-foundations',
            description: 'Build core IELTS skills.',
            coverImageUrl: null,
            totalDuration: 90,
            level: null,
            _count: { lessons: 1, units: 1 },
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-1',
          title: 'IELTS Foundations',
          slug: 'ielts-foundations',
          description: 'Build core IELTS skills.',
          coverImageUrl: null,
          totalDuration: 90,
          level: null,
          _count: { lessons: 1, units: 1 },
          units: [
            {
              id: 'unit-1',
              title: 'Getting Started',
              description: null,
              order: 1,
              lessons: [
                {
                  id: 'lesson-1',
                  title: 'Introduction',
                  type: 'video',
                  duration: 10,
                  order: 1,
                },
              ],
            },
          ],
          lessons: [],
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [PublicCatalogController],
      providers: [
        PublicCatalogService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: LoggerService,
          useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), log: vi.fn() },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(app.get(LoggerService)));

    const tenantMiddleware = new TenantMiddleware(prisma as never);
    app.use((req: Request, res: Response, next: NextFunction) => {
      tenantMiddleware.use(req, res, next).catch(next);
    });

    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should list public courses without authentication and wrap the response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/public/courses')
      .set('x-tenant-id', 'tenant-one')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        data: [
          {
            id: 'course-1',
            title: 'IELTS Foundations',
            lessonCount: 1,
            unitCount: 1,
          },
        ],
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      },
    });
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', isActive: true, deletedAt: null },
      }),
    );
  });

  it('should return public course detail without private lesson fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/public/courses/33333333-3333-4333-8333-333333333333')
      .set('x-tenant-id', 'tenant-one')
      .expect(200);

    expect(response.body.data.units[0].lessons[0]).toEqual({
      id: 'lesson-1',
      title: 'Introduction',
      type: 'video',
      duration: 10,
      order: 1,
    });
    expect(JSON.stringify(response.body)).not.toContain('videoUrl');
    expect(JSON.stringify(response.body)).not.toContain('aiPrompt');
    expect(JSON.stringify(response.body)).not.toContain('content');
  });

  it('should reject public catalog requests without tenant context', async () => {
    const response = await request(app.getHttpServer()).get('/api/public/courses').expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Tenant context is required',
      statusCode: 400,
    });
  });

  it('should reject invalid tenant context before querying courses', async () => {
    prisma.tenant.findFirst.mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .get('/api/public/courses')
      .set('x-tenant-id', 'missing-tenant')
      .expect(400);

    expect(response.body.message).toBe('Invalid or inactive tenant context');
    expect(prisma.course.findMany).not.toHaveBeenCalled();
  });
});
