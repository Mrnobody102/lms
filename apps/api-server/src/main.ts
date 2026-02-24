import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security and Performance middlewares
  app.use(helmet());
  app.use(compression());

  // Enable CORS
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix("api");

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle("LMS Platform API")
    .setDescription("LMS Platform REST API Document")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT || 4000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT || 4000}/api`,
  );
}
bootstrap();
