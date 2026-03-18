# NestJS Standards

**Tier:** POWERFUL  
**Category:** Engineering / Backend  
**Maintainer:** LMS Agent Team

---

## Overview

Best practices and architectural standards for the `api-server` (NestJS) application.

## Core Capabilities

- **modular_architecture**: Structuring features into isolated modules (e.g., AuthModule, UserModule).
- **dto_validation**: Enforcing strict input validation using `class-validator` and `ValidationPipe`.
- **exception_filtering**: Handling errors gracefully with built-in and custom exception filters.
- **interceptor_patterns**: Using interceptors for response wrapping and cross-cutting concerns.

## Dependency Injection

1. Logic belongs in **Services**, not Controllers.
2. Use **Interfaces** for abstraction where possible.
3. Keep Controllers thin and focused on request routing.

## Validation & DTOs

- Use `@IsString()`, `@IsEmail()`, `@IsOptional()`, etc.
- DTO fields must have `@ApiProperty()` for Swagger documentation.
- Enable `whitelist: true` and `forbidNonWhitelisted: true` in `ValidationPipe`.

## Multi-Tenancy Integration

- Every service method requiring tenant isolation should accept `tenantId`.
- Use the `TenantMiddleware` to extract `tenantId` from the request and pass it down.
