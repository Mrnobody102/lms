import { type INestApplication, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requestContext = context.switchToHttp().getRequest<{
      user?: { id: string; tenantId: string };
    }>();
    requestContext.user = { id: 'student-1', tenantId: 'tenant-1' };
    return true;
  }
}

describe('NotificationController', () => {
  let app: INestApplication;
  const notification = {
    id: 'notification-1',
    tenantId: 'tenant-1',
    userId: 'student-1',
    title: 'Welcome',
    content: 'You have a new course.',
    type: 'SUCCESS',
    actionUrl: '/courses/course-1',
    readAt: null,
    createdAt: new Date('2026-05-31T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const prisma = {
      notification: {
        findMany: vi.fn().mockResolvedValue([notification]),
        count: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1),
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('wraps the notification list exactly once', async () => {
    const response = await request(app.getHttpServer()).get('/notifications').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        notifications: [
          {
            id: 'notification-1',
            title: 'Welcome',
            type: 'SUCCESS',
            actionUrl: '/courses/course-1',
            readAt: null,
          },
        ],
        unreadCount: 1,
        meta: {
          skip: 0,
          take: 20,
          total: 1,
          hasMore: false,
        },
      },
    });
    expect(response.body.data.success).toBeUndefined();
  });
});
