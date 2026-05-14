# Architecture Plan Và Product Readiness

Cập nhật lần cuối: 2026-04-25

## Mục tiêu

Tài liệu này nối phần kiến trúc kỹ thuật với roadmap sản phẩm. Chi tiết feature nằm ở [features.md](features.md), còn tiến độ task nằm ở [ENGINEERING-BACKLOG.md](ENGINEERING-BACKLOG.md).

## Kiến trúc hiện tại

### Apps

- `apps/api-server`: NestJS API.
- `apps/web-student`: trải nghiệm học viên.
- `apps/web-admin`: quản trị trung tâm.
- `apps/super-portal`: quản trị platform/tenant.

### Packages

- `@repo/database`: Prisma schema/client/seed.
- `@repo/api-client`: Axios client cookie-first, CSRF header, tenant hint.
- `@repo/shared`: shared auth/state helpers.
- `@repo/ui`: shared UI primitives.

### Backend modules chính

- `auth`
- `user`
- `admin`
- `course`
- `lesson`
- `progress`
- `practice`
- `exam`
- `health`
- `metrics`
- `mcp`

## Trạng thái readiness

Đã hoàn thành:

- Cookie-first auth.
- Tenant-aware login/register/JWT validation.
- Cross-tenant resource tests.
- Course/lesson/progress tenant scoping.
- Course enrollment model và access control.
- Admin enroll/unenroll UI.
- Centralized `LearningAccessService` for course/lesson/progress enrollment policy.
- Tenant-scoped database constraints for course, lesson, enrollment, and lesson progress relations.
- Health/readiness với DB + Redis.
- Request id + basic request metrics.
- Per-session MCP SSE transport handling and timing-safe MCP API key comparison.
- Pinned dependency versions for reproducible installs.
- Production-safe Prisma migration flow.
- CI/release verification workflow.
- Practice backend/admin/student MVP.
- Exam backend MVP với template, section/question, attempt, answer snapshot, scoring, review, admin template UI và student exam UI.

Còn cần trước khi scale feature lớn:

- Content hierarchy strategy (Course -> Unit -> Lesson).
- API contract standardization (Global TransformInterceptor).
- Production-safe middleware (Next.js Middleware instead of Proxy).

## Product Domain Hiện Tại

Hiện schema có:

- `Tenant`
- `User`
- `Course`
- `Lesson`
- `CourseEnrollment`
- `UserLessonProgress`
- `LearningActivity`
- `PracticeQuestion`
- `PracticeExerciseSet`
- `PracticeAttempt`
- `PracticeAnswer`
- `Exam`
- `ExamSection`
- `ExamQuestion`
- `ExamAttempt`
- `ExamAnswer`

Domain này đủ cho MVP:

- Admin tạo khóa học/bài học.
- Admin enroll học viên.
- Student học bài được enroll.
- Student mark progress.
- Student làm practice và nhận feedback.
- Student start/submit exam attempt qua API.

Domain này chưa đủ cho:

- Activation/license code.
- Exam/admin/student UI hoàn chỉnh.
- Practice/exam reporting aggregate.
- AI conversation.

## Hướng mở rộng domain

### 1. Progress và activity

Cần bổ sung trước dashboard:

- last accessed lesson.
- completion percentage.
- time spent hoặc session count.
- daily activity/streak.

Có hai hướng:

- Mở rộng `UserLessonProgress` cho MVP nhanh.
- Thêm `LearningActivity` để lưu event học tập, phù hợp reporting hơn.

Khuyến nghị: dùng `LearningActivity` nếu muốn báo cáo/streak chính xác; có thể cache aggregate sau.

### 2. Content hierarchy

Hiện hệ thống đã chuyển từ `Course -> Lesson` sang `Course -> CourseUnit -> Lesson`.

Đã chốt ở phase gần:

- Thêm `CourseUnit` làm unit/chapter thuộc `Course`.
- `Lesson` giữ `courseId` và có `unitId` nullable để migrate dữ liệu cũ an toàn.
- Course detail API trả cả `units` grouped và `lessons` phẳng để giữ backward compatibility.
- Sau đó mới cân nhắc `Program/Level` nếu cần HSK 1/2/3 rõ ràng.

### 3. Practice và exam

Không nên tiếp tục mở rộng `Lesson.quiz` thành mọi thứ.

Đã tách:

- `PracticeQuestion`
- `PracticeExerciseSet`
- `PracticeAttempt`
- `Exam`
- `ExamSection`
- `ExamQuestion`
- `ExamAttempt`
- `ExamAnswer`

Practice ưu tiên feedback nhanh; exam ưu tiên attempt lifecycle, timer, score và review. Backend exam MVP đã có lifecycle `STARTED`/`SUBMITTED` và timer enforcement theo `startedAt + durationMinutes`; start attempt sẽ resume attempt còn hạn, submit quá hạn bị reject. Student-facing practice/exam reads không trả đáp án hoặc giải thích trước submit. Cả hai domain đều đã có recent attempts/review route riêng để chuẩn bị cho reporting sâu hơn.

### 4. Activation/license

Activation code nên cấp quyền qua entitlement rõ ràng:

- code -> entitlement/license grant.
- entitlement -> course/program access.
- enrollment có thể được tạo tự động sau redeem.

Không nên để code activation ghi trực tiếp nhiều nơi mà không có audit log.

### 5. AI conversation

AI nên đi sau khi có:

- authenticated student identity.
- tenant/enrollment/license boundary.
- usage quota.
- logging/reporting cơ bản.

Domain đề xuất:

- `AiConversation`
- `AiMessage`
- `AiUsage`
- optional `AiFeedback`

## Quy tắc kiến trúc khi thêm feature

- Mọi read/write student-facing phải check tenant và enrollment/license.
- Không duplicate enrollment predicates across services; use `LearningAccessService`.
- Admin route phải check role và tenant scope.
- Migration phải đi cùng schema change.
- Tenant boundary should be enforced in both service logic and database constraints when relations cross tenant-owned records.
- Seed nên giữ flow demo chạy được.
- Feature lớn phải có test bắt authorization regression.
- Frontend không hardcode tenant/course IDs. `NEXT_PUBLIC_TENANT_ID` is a local/dev hint; production should resolve tenant from host/domain by default.
- Do not use `"latest"` in package manifests; pin exact versions or intentional semver ranges.
- Docs API/product/backlog phải cập nhật cùng PR.
- **Mandatory Response Shape**: All API server endpoints MUST return `{ success: true, data: ..., timestamp: ... }`.
- **Next.js Middleware**: Use root `middleware.ts` for auth/tenant routing. Do not use legacy proxies.

## Roadmap kiến trúc gần nhất

1. Activation/license.
2. Reporting drill-down/export nếu cần chi tiết hơn.
3. Program/level hierarchy nếu cần.
4. AI conversation.

## Definition Of Done

Một module mới chỉ được xem là production-ready khi:

- Schema/API/UI/test/docs cùng hoàn thành.
- Authorization đã cover tenant + enrollment/license.
- Có migration production-safe.
- Có verify local tối thiểu:
  - `pnpm --filter api-server test`
  - build app liên quan
  - lint app liên quan
- Có trạng thái trong `ENGINEERING-BACKLOG.md`.
