# API Design Reviewer

**Tier:** POWERFUL  
**Category:** Engineering / Architecture  
**Maintainer:** Claude Skills Team

---

## Overview

The API Design Reviewer skill provides comprehensive analysis and review of API designs, focusing on REST conventions, best practices, and industry standards. This skill helps engineering teams build consistent, maintainable, and well-designed APIs through automated linting, breaking change detection, and design scorecards.

## Core Capabilities

### 1. API Linting and Convention Analysis

- **Resource Naming Conventions**: Enforces kebab-case for resources, camelCase for fields.
- **HTTP Method Usage**: Validates proper use of GET, POST, PUT, PATCH, DELETE.
- **URL Structure**: Analyzes endpoint patterns for consistency and RESTful design.
- **Status Code Compliance**: Ensures appropriate HTTP status codes are used.
- **Error Response Formats**: Validates consistent error response structures.
- **Documentation Coverage**: Checks for missing descriptions and documentation gaps.

### 2. Breaking Change Detection

- **Endpoint Removal**: Detects removed or deprecated endpoints.
- **Response Shape Changes**: Identifies modifications to response structures.
- **Field Removal**: Tracks removed or renamed fields in API responses.
- **Type Changes**: Catches field type modifications that could break clients.
- **Required Field Additions**: Flags new required fields that could break existing integrations.
- **Status Code Changes**: Detects changes to expected status codes.

### 3. API Design Scoring and Assessment

- **Consistency Analysis** (30%): Evaluates naming conventions, response patterns, and structural consistency.
- **Documentation Quality** (20%): Assesses completeness and clarity of API documentation.
- **Security Implementation** (20%): Reviews authentication, authorization, and security headers.
- **Usability Design** (15%): Analyzes ease of use, discoverability, and developer experience.
- **Performance Patterns** (15%): Evaluates caching, pagination, and efficiency patterns.

## REST Design Principles

### Resource Naming Conventions

```
✅ Good Examples:
- /api/v1/users
- /api/v1/user-profiles
- /api/v1/orders/123/line-items

❌ Bad Examples:
- /api/v1/getUsers
- /api/v1/user_profiles
- /api/v1/orders/123/lineItems
```

### HTTP Method Usage

- **GET**: Retrieve resources (safe, idempotent).
- **POST**: Create new resources (not idempotent).
- **PUT**: Replace entire resources (idempotent).
- **PATCH**: Partial resource updates (not necessarily idempotent).
- **DELETE**: Remove resources (idempotent).

### URL Structure Best Practices

```
Collection Resources: /api/v1/users
Individual Resources: /api/v1/users/123
Nested Resources: /api/v1/users/123/orders
Actions: /api/v1/users/123/activate (POST)
Filtering: /api/v1/users?status=active&role=admin
```

## NestJS Specific Guidelines (Project Customization)

When reviewing or designing APIs for this LMS project (NestJS), adhere to these rules:

1. **Swagger Documentation**:
   - Every Controller/Method must have `@ApiOperation` and `@ApiResponse`.
   - Every DTO field must have `@ApiProperty` or `@ApiPropertyOptional`.
2. **Validation**:
   - Use `class-validator` decorators in DTOs (e.g., `@IsString`, `@IsEmail`, `@MinLength`).
   - Always use a global `ValidationPipe`.
3. **Dependency Injection**:
   - Ensure business logic resides in Services, not Controllers.
4. **Error Handling**:
   - Use NestJS's built-in `HttpException` (e.g., `new NotFoundException()`).
   - Avoid returning raw errors to the client.

## Versioning Strategies

### 1. URL Versioning (Recommended)

```
/api/v1/users
/api/v2/users
```

**Pros**: Clear, explicit, easy to route.  
**Cons**: URL proliferation, caching complexity.

### 2. Header Versioning

```
GET /api/users
Accept: application/vnd.api+json;version=1
```

**Pros**: Clean URLs, content negotiation.  
**Cons**: Less visible, harder to test manually.

## Pagination Patterns

### Offset-Based Pagination

```json
{
  "data": [...],
  "pagination": {
    "offset": 20,
    "limit": 10,
    "total": 150,
    "hasMore": true
  }
}
```

### Cursor-Based Pagination

```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "hasMore": true
  }
}
```

## Error Response Formats

### Standard Error Structure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email address is not valid"
      }
    ],
    "requestId": "req-123456",
    "timestamp": "2024-02-16T13:00:00Z"
  }
}
```

## Security Best Practices

- **Authentication**: Use JWT with Bearer tokens.
- **Input Validation**: Never trust client input; always validate against DTOs.
- **Principle of Least Privilege**: Ensure endpoints are guarded by the appropriate guards (e.g., `RolesGuard`).

## Conclusion

The API Design Reviewer skill provides a comprehensive framework for building, reviewing, and maintaining high-quality REST APIs. By following these guidelines and using the provided tools, development teams can create APIs that are consistent, well-documented, secure, and maintainable.
