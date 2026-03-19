# Senior Backend: API Design Patterns

## REST Resource Naming

```
GET    /api/v1/courses              # List courses
POST   /api/v1/courses              # Create course
GET    /api/v1/courses/:id          # Get course
PUT    /api/v1/courses/:id          # Full update
PATCH  /api/v1/courses/:id          # Partial update
DELETE /api/v1/courses/:id          # Delete course

GET    /api/v1/courses/:id/lessons  # List lessons in course
POST   /api/v1/courses/:id/lessons  # Create lesson in course
```

## NestJS Response Wrapping

```typescript
// Response interceptor
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: context.switchToHttp().getRequest().id,
        },
      }))
    );
  }
}
```

## Standard Success Response

```json
{
  "data": {
    "id": "uuid",
    "title": "Course Title",
    "lessons": []
  },
  "meta": {
    "timestamp": "2026-03-19T10:00:00.000Z",
    "requestId": "req-abc123"
  }
}
```

## Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "must be a valid email address"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-03-19T10:00:00.000Z",
    "requestId": "req-abc123"
  }
}
```

## Pagination Response

```json
{
  "data": [{}, {}, {}],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Cursor-Based Pagination

```json
{
  "data": [{}, {}, {}],
  "pagination": {
    "nextCursor": "eyJpZCI6IjEyMyJ9",
    "hasMore": true
  }
}
```

## NestJS Swagger Decorators

```typescript
// DTO
export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to React', description: 'Course title' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'A comprehensive intro course' })
  @IsOptional()
  @IsString()
  description?: string;
}

// Controller
@ApiOperation({ summary: 'Create a new course' })
@ApiResponse({ status: 201, description: 'Course created successfully' })
@ApiResponse({ status: 400, description: 'Validation error' })
@Post()
async create(@Body() dto: CreateCourseDto) {
  return this.courseService.create(dto);
}
```

## Prisma Query Patterns

```typescript
// Standard CRUD with tenant isolation
async findAll(tenantId: string, dto: PaginationQueryDto) {
  const { page = 1, limit = 10 } = dto;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.course.findMany({
      where: { tenantId },
      skip,
      take: limit,
      include: {
        category: true,
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.course.count({ where: { tenantId } }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// N+1 prevention with include
async getCourseWithDetails(id: string, tenantId: string) {
  return this.prisma.course.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      lessons: {
        include: { attachments: true },
        orderBy: { order: 'asc' },
      },
      instructor: { select: { id: true, fullName: true, email: true } },
    },
  });
}
```
