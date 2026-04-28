import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';

function parseCorsOrigin(origin: string): string {
  try {
    const parsed = new URL(origin);

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error();
    }

    return parsed.origin;
  } catch {
    throw new Error(`Invalid CORS origin "${origin}". Use an exact http(s) origin.`);
  }
}

function getCorsOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map(parseCorsOrigin)
    : [];

  if (process.env.NODE_ENV === 'production') {
    if (configuredOrigins.length === 0) {
      throw new Error('CORS_ORIGINS is required in production');
    }

    return [...new Set(configuredOrigins)];
  }

  return [
    ...new Set([
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      ...configuredOrigins,
    ]),
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.enableShutdownHooks();

  // Security and Performance middlewares
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'Cookie',
      'x-api-key',
      'x-csrf-token',
    ],
    exposedHeaders: ['set-cookie'],
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('LMS Platform API')
    .setDescription('LMS Platform REST API Document')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  const publicUrl = process.env.APP_PUBLIC_URL ?? `http://localhost:${port}`;
  logger.info(`Application is running on: ${publicUrl}/api`, {
    context: 'Bootstrap',
  });
}
bootstrap();
