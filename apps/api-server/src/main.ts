import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security and Performance middlewares
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin header)
      if (!origin) {
        return callback(null, true);
      }
      // In development without CORS_ORIGINS set, allow localhost
      if (process.env.NODE_ENV !== "production" && corsOrigins.length === 0) {
        const allowedLocalhost = [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
        ];
        if (allowedLocalhost.includes(origin)) {
          return callback(null, true);
        }
      }
      // Validate against configured origins
      if (!corsOrigins.includes(origin)) {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id", "Cookie"],
  });

  // Set global prefix
  app.setGlobalPrefix("api");

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle("LMS Platform API")
    .setDescription("LMS Platform REST API Document")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== "production") {
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(process.env.PORT || 4000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT || 4000}/api`,
  );
}
bootstrap();
