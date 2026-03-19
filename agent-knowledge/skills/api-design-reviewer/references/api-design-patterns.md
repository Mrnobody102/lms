# API Design Patterns (Deep Reference)

## REST Design Principles

### Resource Naming Conventions

```
Good Examples:
- /api/v1/users
- /api/v1/user-profiles
- /api/v1/orders/123/line-items

Bad Examples:
- /api/v1/getUsers
- /api/v1/user_profiles
- /api/v1/orders/123/lineItems
```

### HTTP Method Usage

| Method | Use For | Safe | Idempotent |
|---|---|---|---|
| GET | Retrieve resources | Yes | Yes |
| POST | Create new resources | No | No |
| PUT | Replace entire resource | No | Yes |
| PATCH | Partial resource updates | No | Varies |
| DELETE | Remove resources | No | Yes |

### URL Structure Patterns

```
Collection Resources:  GET    /api/v1/users
Individual Resources:  GET    /api/v1/users/123
Nested Resources:       GET    /api/v1/users/123/orders
Actions (non-CRUD):    POST   /api/v1/users/123/activate
Filtering:             GET    /api/v1/users?status=active&role=admin
Pagination:            GET    /api/v1/users?offset=0&limit=20
```

## NestJS-Specific Guidelines

### Swagger Documentation

Every controller method must have:
- `@ApiOperation({ summary: '...' })` with a clear action verb
- `@ApiResponse({ status: 200/201/400/404, description: '...' })` for each expected status
- `@ApiBearerAuth()` if the endpoint requires authentication
- `@ApiUnauthorizedResponse()` for guarded endpoints

Every DTO field must have:
- `@ApiProperty({ description: '...', example: '...' })` for required fields
- `@ApiPropertyOptional({ description: '...' })` for optional fields
- `@ApiHideProperty()` for internal fields that should not appear in docs

### Validation Decorators

```
@IsString()        - Field must be a string
@IsEmail()         - Valid email format
@IsUUID()          - Valid UUID format
@MinLength(n)      - Minimum string length
@MaxLength(n)      - Maximum string length
@IsEnum(MyEnum)    - Must be one of the enum values
@IsOptional()      - Field can be omitted
@IsArray()         - Field must be an array
@ValidateNested()  - Validate nested object/class instances
```

### Error Handling Patterns

```typescript
// NotFound - resource does not exist
throw new NotFoundException('User with id 123 not found');

// BadRequest - invalid input
throw new BadRequestException('Invalid email format');

// Conflict - duplicate resource
throw new ConflictException('User with this email already exists');

// Forbidden - insufficient permissions
throw new ForbiddenException('You do not have permission to access this resource');

// Internal errors - always log, return generic message
this.logger.error('Unexpected error', exception);
throw new InternalServerErrorException('An unexpected error occurred');
```

## Versioning Strategies

### URL Versioning (Recommended)

```
/api/v1/users
/api/v2/users
```

**Pros**: Clear, explicit, easy to route and test manually.
**Cons**: URL proliferation, caching complexity over time.

### Header Versioning

```
GET /api/users
Accept: application/vnd.api+json;version=1
```

**Pros**: Clean URLs, content negotiation.
**Cons**: Less visible in logs and tests, harder to debug manually.

### LMS Standard

Use **URL versioning** (`/api/v1/`, `/api/v2/`) for the LMS project. Update the Swagger document base path when releasing a new version.

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

**Use for**: Admin lists, dashboards, filterable tables, small-to-medium datasets.
**Query params**: `?offset=0&limit=20`

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

**Use for**: Activity feeds, chat messages, infinite scroll, large time-ordered datasets.
**Query params**: `?cursor=<base64>&limit=20`

## Standard Error Response Format

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
    "requestId": "req-abc123",
    "timestamp": "2026-03-19T10:00:00.000Z"
  }
}
```

### Error Code Conventions

| Code | Use When |
|---|---|
| VALIDATION_ERROR | DTO validation fails |
| NOT_FOUND | Resource does not exist |
| UNAUTHORIZED | Missing or invalid auth token |
| FORBIDDEN | Authenticated but lacks permission |
| CONFLICT | Duplicate resource (e.g., unique constraint) |
| BAD_REQUEST | Malformed request body |
| INTERNAL_ERROR | Unexpected server error |

## Security Checklist

- JWT Bearer token required for all non-public endpoints
- All input validated via class-validator DTOs
- RolesGuard applied to endpoints requiring specific roles
- No raw SQL queries; use Prisma throughout
- Secrets stored in environment variables, never hardcoded
- Rate limiting applied to auth and write endpoints
- CORS configured to allow only known origins
- Sensitive fields (password, tokens) excluded from response DTOs
