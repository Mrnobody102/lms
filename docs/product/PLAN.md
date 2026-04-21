# Kế hoạch triển khai LMS Platform

Cập nhật lần cuối: 2026-04-21

## Mục tiêu

Mục tiêu ngắn hạn của dự án không còn là thêm thật nhiều tính năng mới ngay lập tức, mà là đưa nền tảng hiện tại về trạng thái có thể mở rộng an toàn:

- Multi-tenant đúng nghĩa: tenant isolation được enforce ở phía server, không tin client header như nguồn sự thật.
- Auth và session an toàn hơn: không để JWT hoặc tenant context trong `localStorage` làm authority chính.
- API contract ổn định: frontend, backend, test và docs khớp nhau.
- Build và test chạy được trong workspace thực tế.
- Sau khi nền tảng ổn định mới tiếp tục đẩy nhanh Course Builder và Student Learning Space.

## Đánh giá hiện trạng

Những phần đã có giá trị:

- Monorepo `apps/` + `packages/` khá rõ ràng.
- Backend NestJS đã tách module `auth`, `user`, `admin`, `course`, `lesson`, `progress`.
- Prisma schema đã có nền tảng tenant, course, lesson, progress.
- Ba frontend app đã dùng chung một phần shared packages.

Những điểm chưa thể xem là hoàn thành:

- Auth và tenant management mới ở mức MVP, chưa production-ready.
- Multi-tenancy hiện tại còn phụ thuộc vào `x-tenant-id` từ client.
- Frontend vẫn đang giữ JWT trong `localStorage`.
- Test và tài liệu test đang lệch với code hiện tại.
- `web-admin`, `web-student`, `super-portal` chưa ở trạng thái build ổn định trong workspace hiện tại.

## Nguyên tắc cập nhật roadmap

- Không đánh dấu `done` nếu chưa qua được `build`, `lint`, test phù hợp và verify nghiệp vụ.
- Security và tenancy là blocker cho mọi tính năng tiếp theo.
- Mỗi task phải có đầu ra rõ ràng và cách verify.
- Ưu tiên giảm drift giữa code, docs, test và shared contracts.

## Roadmap ưu tiên

### P0. Security và tenant isolation

Mục tiêu:

- Khóa tenant context theo identity của user/token/cookie ở phía server.
- Loại bỏ khả năng đọc hoặc ghi chéo tenant bằng cách sửa header.
- Giảm bề mặt tấn công của auth flow.

Công việc:

- [ ] Thiết kế lại tenant resolution:
  - `TenantMiddleware` không được tin `x-tenant-id` như authority duy nhất.
  - Nếu user đã authenticate, tenant phải được suy ra và verify từ token hoặc user record.
  - Header tenant, nếu còn dùng, chỉ là input phụ và phải được đối chiếu.
- [ ] Sửa login/register flow theo tenant:
  - Login phải xác định tenant hợp lệ thay vì lookup theo email toàn cục.
  - JWT validation phải reject nếu tenant bị vô hiệu hóa hoặc request tenant không khớp.
- [ ] Chuẩn hóa auth storage:
  - Ưu tiên `HttpOnly` cookie làm session source of truth.
  - Giảm dần và loại bỏ JWT hoặc tenant context khỏi `localStorage`.
- [ ] Review lại tenant lifecycle:
  - Tenant `isActive = false` phải chặn login và các session tiếp tục sử dụng hệ thống.
- [ ] Giảm rủi ro MCP:
  - Không truyền API key qua query string nếu có thể.
  - Hardening compare/check và scope truy cập.

Done khi:

- Student hoặc Admin của tenant A không thể dùng header tenant B để truy cập course, lesson hoặc progress của tenant B.
- User thuộc tenant đã bị disable không thể đăng nhập.
- Frontend không còn cần `localStorage.token` làm cách xác thực chính cho browser flow.

### P1. Ổn định build, runtime và workspace

Mục tiêu:

- Mỗi app hoặc script quan trọng phải chạy được thật trong workspace.
- Loại bỏ các script “trông có vẻ đúng” nhưng thực tế fail.

Công việc:

- [ ] Sửa build pipeline cho ba frontend apps:
  - Xử lý lỗi resolve `autoprefixer` trong `web-admin` và `web-student`.
  - Sửa script `super-portal` vì `next build --webpack` hiện không hợp lệ.
- [ ] Sửa test runtime của backend:
  - `api-server` test hiện fail ở suite MCP vì dependency hoặc runtime setup.
- [ ] Bổ sung root scripts còn thiếu:
  - `pnpm test`, `pnpm test:e2e` hoặc cập nhật docs để khớp với script thật.
- [ ] Đồng bộ hướng dẫn test với workspace hiện tại.

Done khi:

- `pnpm --filter api-server test` pass.
- `pnpm --filter web-admin build`, `pnpm --filter web-student build`, `pnpm --filter super-portal build` pass.
- Docs không còn hướng dẫn các lệnh không tồn tại.

### P2. API contract và shared architecture

Mục tiêu:

- Backend và frontend chia sẻ một contract đủ rõ để giảm bug runtime.
- Giảm duplication giữa ba frontend apps.

Công việc:

- [ ] Chuẩn hóa response format:
  - Đăng ký và dùng nhất quán `ResponseInterceptor`, hoặc bỏ hẳn giả định unwrap ở client.
- [ ] Đồng bộ DTO, service và Prisma schema:
  - Loại bỏ field trong docs hoặc API không tồn tại thật, hoặc bổ sung schema cho nó.
  - Ví dụ: `Course.description` hiện có trong DTO nhưng chưa có trong schema hoặc service.
- [ ] Đồng bộ endpoint contract:
  - Frontend không được gọi endpoint không tồn tại.
  - Review lại các route `course`, `lesson`, `progress`.
- [ ] Tiếp tục gom shared logic:
  - `api-client`
  - auth store
  - middleware/security headers
  - locale-aware redirect helpers

Done khi:

- Không còn workaround riêng trong từng app để đoán response shape.
- Frontend và backend khớp route, payload, field và pagination model.

### P3. Test strategy đúng với hệ thống hiện tại

Mục tiêu:

- Có test bắt được các lỗi nghiêm trọng vừa audit.

Công việc:

- [ ] Bổ sung integration tests cho:
  - auth theo tenant
  - tenant isolation
  - RBAC cho course, lesson, admin
  - tenant disable flow
  - progress access control
- [ ] Cập nhật test artifacts:
  - `tests/api-tests.http`
  - sample payloads
  - seed data phục vụ test
- [ ] Có seed hoặc fixture cho:
  - ít nhất hai tenants
  - user roles: `SUPER_ADMIN`, `ADMIN`, `INSTRUCTOR`, `STUDENT`
  - course, lesson, progress chéo tenant
- [ ] Duy trì ít nhất một E2E flow có giá trị:
  - login
  - xem khóa học
  - mở lesson
  - update progress

Done khi:

- Các regression sau được test bắt: forged tenant header, login sai tenant, stale docs payload, route mismatch.

### P4. Product modules sau khi nền tảng ổn định

Chỉ bắt đầu đẩy nhanh phase này sau khi P0-P3 đạt mức chấp nhận được.

#### P4.1 Course Builder

- [ ] Hoàn thiện CRUD khóa học và bài học với contract nhất quán.
- [ ] Hỗ trợ lesson types rõ ràng: `video`, `text`, `quiz`.
- [ ] Xử lý ordering, validation và soft-delete nhất quán.
- [ ] Đánh giá có cần tách “lesson blocks” hay giữ model đơn giản trong phase hiện tại.

#### P4.2 Student Learning Space

- [ ] Sidebar điều hướng bài học.
- [ ] Lesson player cho text, video, quiz.
- [ ] Progress tracking theo user, tenant, course.
- [ ] Error/loading states đúng với contract mới.

#### P4.3 Super Portal và tenant operations

- [ ] Tenant activation/deactivation phải tác động đúng lên auth và session.
- [ ] Tenant settings/branding có contract rõ ràng.
- [ ] Quản lý tenant không phụ thuộc mock data hoặc giả định cũ.

## Việc cần làm tiếp theo

Thứ tự đề xuất:

1. Fix tenant isolation và auth source-of-truth.
2. Sửa build/test/scripts/docs để repo chạy được thật.
3. Chuẩn hóa API contract và bổ sung integration tests.
4. Quay lại hoàn thiện Course Builder và Student Learning Space.

## Các tiêu chí “done” cấp dự án

Chỉ nên xem giai đoạn nền tảng đã ổn khi thỏa các điều kiện sau:

- Build của bốn app chính pass.
- Backend test pass và có integration test cho tenant/auth.
- Frontend không còn phụ thuộc `localStorage` như authority chính cho auth.
- Không còn API hoặc test docs stale so với DTO hiện tại.
- Tài liệu product và architecture đồng bộ với code state thực tế.
