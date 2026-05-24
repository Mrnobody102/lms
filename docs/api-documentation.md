# Tài liệu API LMS Platform

Cập nhật lần cuối: 2026-05-24

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

### 4. Practice

#### Danh sách exercise set

`GET /api/practice/exercise-sets?skill=VOCABULARY,GRAMMAR`

- `skill` là optional CSV uppercase skill code. Backend lọc bằng logic "match any" (`hasSome`).
- Student request yêu cầu auth và chỉ trả nội dung trong tenant/enrollment hợp lệ.

#### AI-generated practice review flow

- `POST /api/practice/ai-generations` tạo generation job/drafts cho admin/instructor.
- `GET /api/practice/ai-generations` và `GET /api/practice/ai-generations/:id` trả job metadata, provider/model/prompt metadata và drafts.
- `PATCH /api/practice/ai-drafts/:id` cho phép edit draft trước khi duyệt.
- `POST /api/practice/ai-drafts/:id/approve` tạo `PracticeQuestion` approved.
- `POST /api/practice/ai-drafts/:id/reject` lưu rejection reason.
- `POST /api/practice/ai-drafts/bulk-approve` và `/bulk-reject` hỗ trợ review nhiều draft.

Student-facing practice chỉ đọc `PracticeQuestion` đã approved; draft pending/rejected không xuất hiện trong exercise set.

### 5. SRS / Vocabulary

#### Custom vocabulary cards

- `GET /api/srs/cards/custom`
- `POST /api/srs/cards/custom`
- `PUT /api/srs/cards/custom/:cardId`
- `DELETE /api/srs/cards/custom/:cardId`

Các route này dùng `ReviewCardSource.CUSTOM`, tenant-scoped theo user hiện tại và được dùng bởi student `/vocabulary`.

#### Micro-card activity and SRS promotion

- `POST /api/lessons/:id/micro-card-events`
  - Role: `STUDENT`
  - Body: `{ "cardKey": "card-1", "eventType": "MICRO_CARD_FLIPPED", "durationMs": 1200 }`
  - `eventType` chỉ nhận `MICRO_CARD_VIEWED`, `MICRO_CARD_FLIPPED`, `MICRO_CARD_COMPLETED`.
  - Dùng `LearningAccessService.lessonWhere` để đảm bảo tenant/enrollment.
- `POST /api/lessons/:id/micro-cards/:cardKey/add-to-review`
  - Role: `STUDENT`
  - Upsert custom SRS card từ nội dung micro-card.

### 6. Roleplay

#### Admin scenario management

- `POST /api/roleplay/scenarios`
- `GET /api/roleplay/scenarios`
- `GET /api/roleplay/scenarios/:id`
- `PATCH /api/roleplay/scenarios/:id`
- `DELETE /api/roleplay/scenarios/:id`
- `POST /api/roleplay/scenarios/:id/publish`
- `POST /api/roleplay/scenarios/:id/unpublish`

Scenario bắt buộc thuộc tenant/course hợp lệ; `unitId` nếu có phải thuộc cùng course/tenant. Mode hợp lệ: `TEXT`, `AUDIO`, `MIXED`.

#### Student session flow

- `GET /api/roleplay/scenarios/available?courseId=&unitId=&mode=`
  - Trả published scenarios mà student có quyền học.
- `POST /api/roleplay/sessions`
  - Body scenario-based: `{ "scenarioId": "...", "mode": "TEXT" }`
  - Legacy body vẫn hỗ trợ: `{ "scenario": "free text", "mode": "TEXT" }`
- `GET /api/roleplay/sessions?page=1&limit=10`
- `GET /api/roleplay/sessions/:id`
- `POST /api/roleplay/sessions/:id/messages`
- `POST /api/roleplay/sessions/:id/messages/audio`
  - Body: `{ "mediaAssetId": "...", "expectedText": "optional", "content": "optional" }`
  - Reject nếu session mode là `TEXT`.
  - Validate media asset audio/ready/tenant trước khi tạo message.
  - Tạo `PronunciationAssessment` trạng thái `QUEUED` và enqueue BullMQ job `pronunciation-assessment`.
- `GET /api/roleplay/sessions/:id/pronunciation`
- `POST /api/roleplay/sessions/:id/complete`

Provider pronunciation mặc định chỉ deterministic trong test; ngoài test trả failure rõ ràng nếu chưa cấu hình provider production.

### 7. Admin Reports

Base path: `/api/admin/reports`

- `GET /programs`, `/programs/:programId`, `/levels/:levelId`, `/courses/:courseId/units`, `/courses/:courseId/students`, `/skills`
  - Rollup và drill-down hiện có, hỗ trợ `cohortId` ở các route report chính.
- `GET /activity-trend?days=30&cohortIds=a,b`
- `GET /mastery-trend?days=30&cohortIds=a,b`
- `GET /risk-flags?courseId=&cohortId=&severity=&flag=&page=&limit=`
  - Trả risk rows gồm `severity`, `score`, `flags`, `reasons`, `computedAt`.
  - Risk rule defaults hiện hỗ trợ `NO_ACTIVITY`, `FALLING_BEHIND`, `LOW_MASTERY`, `OVERDUE_SRS`, `DECLINING_SCORE`.
  - Tenant có thể override/disable rule qua `ReportingRiskRule`.
- `POST /risk-flags/recompute`
  - Recompute và lưu `StudentRiskSnapshot` cho filter hiện tại.
- `GET /cohort-comparison?courseId=&cohortIds=&startDate=&endDate=`
  - Trả completion, activity sessions, practice/exam accuracy, mastery, overdue SRS, rank và delta completion.

### 8. Super Portal Tenant Management

`GET /api/admin/tenants?includeInactive=true`

- Yêu cầu role `SUPER_ADMIN`.
- `includeInactive=true` trả cả tenant inactive để super portal có thể restore.
- `PUT /api/admin/tenants/:id` hỗ trợ cập nhật `name`, `slug`, `domain`, `settings`, `isActive`.
- `DELETE /api/admin/tenants/:id` soft-deactivate tenant; `PATCH /api/admin/tenants/:id/restore` restore.

## Ghi chú cho Developer & AI Agent

- **Pagination**: Mọi API trả về danh sách nên có object `meta` chứa `total`, `totalPages`.
- **RBAC**: Admin route bắt đầu bằng `/api/admin/` yêu cầu role `ADMIN` hoặc `SUPER_ADMIN`.
- **Tenant Isolation**: Tuyệt đối không trả về dữ liệu của tenant khác. Mỗi request được intercept bởi `TenantMiddleware` để gán `tenantId` vào request object.
