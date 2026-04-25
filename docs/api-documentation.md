# Tài liệu API LMS Platform

Cập nhật lần cuối: 2026-04-25

## Tổng quan

API hiện tại dùng mô hình xác thực theo `HttpOnly` cookie cho browser flow.

- Endpoint auth sẽ set cookie `access_token` sau khi đăng nhập hoặc đăng ký thành công.
- Frontend web không cần giữ JWT trong `localStorage`.
- Với công cụ test API hoặc server-to-server client, API vẫn chấp nhận `Authorization: Bearer <token>` vì `JwtStrategy` đọc được cả header lẫn cookie.

## Tenant context

Một số endpoint yêu cầu tenant context hợp lệ.

- Ưu tiên hiện tại:
  1. `x-tenant-id`
  2. domain hoặc subdomain
- Tenant hint chỉ được dùng để resolve tenant đang active.
- Sau khi đã authenticate, server sẽ tiếp tục đối chiếu tenant của session với tenant của request.

Ví dụ header:

```http
x-tenant-id: your-tenant-id-or-slug
```

## Xác thực

### Đăng ký

```http
POST /api/auth/register
Content-Type: application/json
x-tenant-id: your-tenant-id-or-slug

{
  "email": "student@example.com",
  "password": "Student@123",
  "fullName": "Nguyen Van A",
  "phoneNumber": "+84901234567"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "Nguyen Van A",
    "phoneNumber": "+84901234567",
    "avatarUrl": null,
    "role": "STUDENT",
    "isActive": true,
    "tenantId": "tenant-id",
    "createdAt": "2026-04-21T00:00:00.000Z",
    "updatedAt": "2026-04-21T00:00:00.000Z"
  }
}
```

Ghi chú:

- JWT được set vào cookie `access_token`.
- Response không còn trả `token` cho browser flow.

### Đăng nhập

```http
POST /api/auth/login
Content-Type: application/json
x-tenant-id: your-tenant-id-or-slug

{
  "email": "student@example.com",
  "password": "Student@123"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "Nguyen Van A",
    "phoneNumber": "+84901234567",
    "avatarUrl": null,
    "role": "STUDENT",
    "isActive": true,
    "tenantId": "tenant-id",
    "createdAt": "2026-04-21T00:00:00.000Z",
    "updatedAt": "2026-04-21T00:00:00.000Z"
  }
}
```

### Đăng xuất

```http
POST /api/auth/logout
```

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

Ghi chú:

- Endpoint này sẽ clear cookie `access_token`.

## Hồ sơ người dùng

Các endpoint dưới đây yêu cầu xác thực.

- Browser flow: gửi cookie tự động.
- API tool: có thể dùng `Authorization: Bearer <token>` nếu cần.

### Lấy thông tin người dùng hiện tại

```http
GET /api/users/me
```

Hoặc:

```http
GET /api/users/me
Authorization: Bearer your-token
```

### Cập nhật hồ sơ

```http
PUT /api/users/me
Content-Type: application/json

{
  "fullName": "Nguyen Van B",
  "phoneNumber": "+84987654321",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Đổi mật khẩu

```http
PUT /api/users/change-password
Content-Type: application/json

{
  "currentPassword": "Student@123",
  "newPassword": "Student@456"
}
```

## Nhóm endpoint quản trị

### Admin

Các route quản trị người dùng yêu cầu `ADMIN` hoặc `SUPER_ADMIN`.

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`

Query thường dùng để lấy học viên:

```http
GET /api/admin/users?role=STUDENT&isActive=true&page=1&limit=100
```

### Super Admin

Các route quản trị tenant yêu cầu `SUPER_ADMIN`.

- `POST /api/admin/tenants`

## Course, Lesson Và Enrollment

Các endpoint dưới đây yêu cầu xác thực.

### Course

```http
GET /api/courses
GET /api/courses/:id
POST /api/courses
PATCH /api/courses/:id
DELETE /api/courses/:id
```

Quy tắc access:

- `ADMIN` và `SUPER_ADMIN` xem/quản trị course trong tenant scope hợp lệ.
- `STUDENT` chỉ thấy course đang có enrollment `ACTIVE`.
- Course bị soft-delete hoặc inactive không xuất hiện trong learning flow.

### Enrollment

Các endpoint enrollment yêu cầu `ADMIN` hoặc `SUPER_ADMIN`.

```http
POST /api/courses/:id/enrollments
Content-Type: application/json

{
  "userId": "student-user-id"
}
```

```http
DELETE /api/courses/:id/enrollments/:userId
```

Quy tắc:

- Chỉ enroll được user role `STUDENT`, active, chưa bị soft-delete và cùng tenant scope.
- Enroll lại một enrollment đã revoked sẽ chuyển về `ACTIVE`.
- Unenroll chuyển enrollment sang `REVOKED`, không xóa cứng lịch sử.

### Lesson

```http
GET /api/lessons?courseId=:courseId
GET /api/lessons/:id
POST /api/lessons
PATCH /api/lessons/:id
DELETE /api/lessons/:id
```

Quy tắc access:

- Student chỉ đọc được lesson của course đã enroll.
- Admin mutation vẫn yêu cầu RBAC.

## Progress

```http
POST /api/progress/update
Content-Type: application/json

{
  "lessonId": "lesson-id",
  "status": "COMPLETED"
}
```

```http
GET /api/progress/course/:courseId
GET /api/progress/lesson/:lessonId
```

Quy tắc:

- Progress được tenant-scoped.
- Student chỉ update/read progress của lesson thuộc course đã enroll.
- Roadmap tiếp theo sẽ mở rộng progress từ trạng thái `IN_PROGRESS`/`COMPLETED` sang completion percentage, last accessed lesson, streak và reporting.
- `PUT /api/admin/tenants/:tenantId`

## Ghi chú bảo mật

- Password được hash bằng bcrypt trước khi lưu.
- JWT vẫn tồn tại ở phía server, nhưng browser không nên coi JWT là source of truth ở client.
- Cookie auth đang dùng:
  - `HttpOnly`
  - `SameSite=Lax`
  - `Secure` trong production
- Tenant bị disable sẽ không thể tiếp tục dùng session hợp lệ.
- Non-super-admin không thể chuyển tenant bằng cách đổi `x-tenant-id`.

## Ví dụ test bằng curl với cookie jar

### Đăng nhập và lưu cookie

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -c cookies.txt \
  -d '{
    "email": "admin@lms.com",
    "password": "admin123"
  }'
```

### Gọi profile bằng cookie session

CSRF token for state-changing cookie requests:

```bash
CSRF_TOKEN=$(awk '$0 ~ /csrf_token/ { print $7 }' cookies.txt | tail -1)
```

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -b cookies.txt
```

### Đăng xuất

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -b cookies.txt \
  -c cookies.txt
```

## Khi nào còn dùng Bearer token?

`Authorization: Bearer` vẫn hữu ích cho:

- test thủ công ngoài browser
- integration với service khác
- script CI hoặc debug cục bộ

Nhưng với web app của dự án, flow chuẩn hiện tại là cookie-first.
