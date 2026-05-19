import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AppThrottlerGuard } from './common/guards/throttler.guard';
import { RedisThrottlerStorage } from './common/throttling/redis-throttler.storage';
import { LoggerService } from './common/services/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { RequestMetricsMiddleware } from './common/metrics/request-metrics.middleware';
import { envSchema } from './config/env.validation';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { AdminReportsModule } from './admin-reports/admin-reports.module';
import { McpModule } from './mcp/mcp.module';
import { LessonModule } from './lesson/lesson.module';
import { CourseModule } from './course/course.module';
import { ProgressModule } from './progress/progress.module';
import { PracticeModule } from './practice/practice.module';
import { ExamModule } from './exam/exam.module';
import { HealthModule } from './common/health/health.module';
import { ActivationModule } from './activation/activation.module';
import { ProgramModule } from './program/program.module';
import { SkillModule } from './skill/skill.module';
import { SrsModule } from './srs/srs.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { MailModule } from './mail/mail.module';
import { AiModule } from './ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from './storage/storage.module';
import { MediaModule } from './media/media.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      validate: (env) => {
        const result = envSchema.safeParse(env);
        if (!result.success) {
          throw new Error(
            `Invalid environment variables:\n${result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`,
          );
        }
        return result.data;
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: configService.get<string>('REDIS_URL')
          ? new RedisThrottlerStorage(configService)
          : undefined,
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('THROTTLER_TTL') ?? 60000,
            limit: configService.get<number>('THROTTLER_LIMIT') ?? 100,
          },
          {
            name: 'auth',
            ttl: 60000,
            limit: 10,
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    AdminModule,
    AdminReportsModule,
    McpModule,
    LessonModule,
    CourseModule,
    ProgressModule,
    PracticeModule,
    ExamModule,
    ActivationModule,
    ProgramModule,
    SkillModule,
    SrsModule,
    MetricsModule,
    HealthModule,
    MailModule,
    AiModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is required for BullModule');
        }
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
    }),
    StorageModule,
    MediaModule,
    JobsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    LoggerService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware, RequestMetricsMiddleware, TenantMiddleware, CsrfMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'mcp/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
