# NestJS Patterns Reference

Deep-dive reference for NestJS patterns used in the LMS API server.

## Module Structure Examples

### Standard Feature Module

```typescript
// src/lesson/lesson.module.ts
import { Module } from "@nestjs/common";
import { LessonController } from "./lesson.controller";
import { LessonService } from "./lesson.service";

@Module({
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}
```

### App Module (Global Setup)

```typescript
// src/app.module.ts
import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";
import { AppThrottlerGuard } from "./common/guards/throttler.guard";
import { PrismaModule } from "./common/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: "../../.env" }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60000, limit: 100 },
      { name: "auth", ttl: 60000, limit: 10 },
    ]),
    PrismaModule,
    // Feature modules...
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: "admin/tenants/(.*)", method: RequestMethod.ALL },
        { path: "auth/(.*)", method: RequestMethod.ALL },
      )
      .forRoutes("*");
  }
}
```

### Global PrismaModule

```typescript
// src/common/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./services/prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## DTO Validation Patterns

### Create DTO

```typescript
// src/auth/dto/register.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsUUID, IsOptional,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "password123", description: "Min 8, max 128 characters" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128, { message: "Password must be at most 128 characters" })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: "+84 123 456 789" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: "uuid-of-tenant" })
  @IsUUID({}, { message: "tenantId must be a valid UUID" })
  @IsNotEmpty()
  tenantId: string;
}
```

### Update DTO

```typescript
// src/course/dto/update-course.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreateCourseDto } from "./create-course.dto";

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
```

### Query DTO

```typescript
// src/admin/dto/admin-user-query.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class AdminUserQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

## Exception Filters

### HttpExceptionFilter

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Interceptors (Response Wrapping)

### ResponseInterceptor

```typescript
// src/common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Skip wrapping if already wrapped or paginated
        if (data && typeof data === "object" && ("success" in data || "meta" in data)) {
          return data;
        }
        return { success: true, data };
      }),
    );
  }
}
```

Register globally in `main.ts`:
```typescript
app.useGlobalInterceptors(new ResponseInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

## Guards

### JwtAuthGuard

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

### RolesGuard

```typescript
// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@repo/database";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### ThrottlerGuard (Global)

```typescript
// src/common/guards/throttler.guard.ts
import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { ExecutionContext } from "@nestjs/common";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(context: ExecutionContext): void {
    throw new ThrottlerException("Too many requests, please slow down");
  }
}
```

## Swagger Decorators Catalog

| Decorator | Use On | Purpose |
|---|---|---|
| `@ApiTags("name")` | Controller | Groups endpoints in Swagger UI |
| `@ApiOperation({ summary: "..." })` | Handler | Endpoint description |
| `@ApiBearerAuth()` | Controller/Handler | Shows lock icon, requires token |
| `@ApiQuery({ name, required, type })` | Handler | Query parameter documentation |
| `@ApiParam({ name, type })` | Handler | Path parameter documentation |
| `@ApiProperty({ example, description })` | DTO field | Field documentation and example |
| `@ApiPropertyOptional({ example, description })` | DTO field | Optional field documentation |
| `@ApiUnauthorizedResponse({ description })` | Handler | Documents 401 response |
| `@ApiForbiddenResponse({ description })` | Handler | Documents 403 response |
| `@ApiNotFoundResponse({ description })` | Handler | Documents 404 response |
| `@ApiBody({ type: DtoClass })` | Handler | Request body documentation |

## Tenant Middleware

```typescript
// src/common/middleware/tenant.middleware.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { NestMiddleware, Request, Response, NextFunction } from "express";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === "OPTIONS") return next();
    const tenantId = req.headers["x-tenant-id"] || this.getTenantFromDomain(req);
    if (!tenantId) throw new BadRequestException("Tenant ID is missing");
    (req as any).tenantId = tenantId;
    next();
  }

  private getTenantFromDomain(req: Request): string | undefined {
    const host = req.headers.host;
    if (!host) return undefined;
    const parts = host.split(".");
    return parts.length > 2 ? parts[0] : undefined;
  }
}
```
