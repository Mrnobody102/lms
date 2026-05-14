# Tài liệu API LMS Platform

Cập nhật lần cuối: 2026-05-14

## Tổng quan

API hiện tại dùng mô hình xác thực theo `HttpOnly` cookie cho browser flow và áp dụng một lớp Interceptor toàn cục để chuẩn hóa phản hồi.

### Standardized Response Format

Tất cả các phản hồi thành công từ API sẽ được wrap trong cấu trúc sau thông qua `TransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-05-14T14:30:00.000Z"
}
```

Trong trường hợp lỗi, `HttpExceptionFilter` sẽ trả về:

```json
{
  "success": false,
  "message": "Thông báo lỗi",
  "statusCode": 400,
  "timestamp": "2024-05-14T14:30:00.000Z"
}
```

## Xác thực & Tenant Context

- **Xác thực**: Dùng `access_token` trong `HttpOnly` cookie. Chấp nhận `Authorization: Bearer <token>` cho các công cụ test.
- **Tenant Context**: Bắt buộc gửi header `x-tenant-id` (slug hoặc UUID) để xác định không gian dữ liệu.
- Sau khi đã authenticate, server sẽ tiếp tục đối chiếu tenant của session với tenant của request.
- Browser clients only send `x-tenant-id` automatically on local hosts by default. Production tenant resolution should come from domain/subdomain unless a trusted deployment explicitly opts in to sending the tenant header.

## Technical Schema (for AI Agents)

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string; // ISO8601
}

interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Paginated Responses
interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 1. Auth

#### Đăng nhập

`POST /api/auth/login`

- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "STUDENT", ... }
  },
  "timestamp": "..."
}
```

#### Đăng xuất

`POST /api/auth/logout`

- **Response**: `{ "success": true, "data": { "message": "Logged out successfully" }, ... }`

### 2. Courses & Lessons

#### Lấy danh sách khóa học

`GET /api/courses`

- **Response**:

```json
{
  "success": true,
  "data": {
    "data": [{ "id": "...", "title": "..." }],
    "meta": { "total": 1, "page": 1, "limit": 10 }
  },
  "timestamp": "..."
}
```

#### Lấy chi tiết bài học

`GET /api/lessons/:id`

- **Response**:

```json
{
  "success": true,
  "data": { "id": "...", "title": "...", "content": "..." },
  "timestamp": "..."
}
```

### 3. Progress

#### Cập nhật tiến độ học tập

`POST /api/progress/update`

- **Body**: `{ "lessonId": "...", "status": "COMPLETED" }`
- **Response**:

```json
{
  "success": true,
  "data": { "lessonId": "...", "status": "COMPLETED" },
  "timestamp": "..."
}
```

#### Dashboard Summary

`GET /api/progress/summary`

- **Response**: Trả về thông tin khóa học đang học, bài học tiếp theo, và tỷ lệ hoàn thành.

## Ghi chú cho Developer & AI Agent

- **Pagination**: Mọi API trả về danh sách nên có object `meta` chứa `total`, `totalPages`.
- **RBAC**: Admin route bắt đầu bằng `/api/admin/` yêu cầu role `ADMIN` hoặc `SUPER_ADMIN`.
- **Tenant Isolation**: Tuyệt đối không trả về dữ liệu của tenant khác. Mỗi request được intercept bởi `TenantMiddleware` để gán `tenantId` vào request object.
