import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';

function getCorsOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  if (process.env.NODE_ENV === 'production') {
    return configuredOrigins;
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...configuredOrigins,
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

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

  await app.listen(process.env.PORT || 4000);
  logger.info(`Application is running on: http://localhost:${process.env.PORT || 4000}/api`, {
    context: 'Bootstrap',
  });
}
bootstrap();
