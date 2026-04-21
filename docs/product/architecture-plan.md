# LMS Platform - Architecture Review và Roadmap Production Readiness

Cập nhật lần cuối: 2026-04-21

## 1. Tổng quan

Review lại codebase hiện tại cho thấy:

- Nền tảng monorepo và cách chia module backend là hợp lý.
- Hệ thống đã có auth, tenant management, course, lesson, progress ở mức MVP.
- Tuy nhiên, production readiness vẫn đang bị chặn bởi bốn nhóm vấn đề lớn:
  - tenant isolation chưa đúng boundary
  - auth/session architecture chưa an toàn
  - build/test/docs đang drift
  - contract backend/frontend chưa nhất quán

Kết luận:

- Chưa nên coi hệ thống hiện tại là production-ready.
- Nhiều task trong kế hoạch cũ đã được đánh dấu xong hoặc mô tả sai so với code hiện tại.
- Ưu tiên kiến trúc tiếp theo phải là security + correctness, không phải mở rộng feature breadth.

## 2. Review lại tài liệu cũ

Những điểm trong version trước cần sửa nhận định:

- RBAC cho course/lesson không còn là issue chính; code hiện tại đã có guard và decorator.
- Pagination cho course/lesson đã có ở backend.
- `AdminService` god class không còn là hướng review chính; code đã tách `UserAdminService` và `TenantAdminService`.
- `ResponseInterceptor` đã tồn tại nhưng chưa được wire vào app; vì vậy vấn đề hiện tại là contract drift, không phải thiếu implementation hoàn toàn.
- `TenantMiddleware` không nên được ghi là “đã xử lý isolation”; đây mới chỉ là cơ chế gắn tenant context, chưa phải enforcement an toàn.
- Phần CSRF/JWT trong bản cũ chưa đặt đúng thứ tự ưu tiên; vấn đề lớn hơn hiện tại là session source-of-truth và forged tenant context.
- Các checklist `done` trước đó không phản ánh đúng runtime state vì build/test/doc scripts vẫn đang fail hoặc stale.

## 3. Tóm tắt issue hiện tại

### Critical

- Tenant isolation có thể bị vô hiệu hóa vì server vẫn tin `x-tenant-id` từ client.
- Login chưa ràng theo tenant; user đang bị lookup theo email toàn cục.
- JWT validation chưa đối chiếu tenant của request với tenant của user/session.

### High

- Frontend vẫn giữ JWT và tenant context trong `localStorage`.
- Tenant bị disable chưa chặn được auth/session.
- Build/test workspace chưa ổn:
  - `api-server` test fail
  - `web-admin` build fail
  - `web-student` build fail
  - `super-portal` build script sai
- Docs test và sample payload không còn khớp DTO hiện tại.

### Medium

- Response shape giữa backend và frontend chưa nhất quán.
- Frontend còn duplication và workaround contract.
- Course DTO/service/schema đang drift ở field `description`.
- MCP auth vẫn cho API key qua query string.

## 4. Kiến trúc đề xuất sau audit

### Workstream A - Tenant boundary đúng nghĩa

Mục tiêu:

- Tenant phải là một phần của server-side authorization boundary.

Cần đạt:

- Request anonymous:
  - tenant có thể đến từ domain/subdomain hoặc input explicit.
  - server phải validate tenant tồn tại và đang active.
- Request authenticated:
  - tenant context phải khớp với user session/token.
  - client không thể “switch tenant” bằng header nếu không có quyền hợp lệ.
- Controller/service:
  - không lấy tenant authority từ request header một cách mù quáng.
  - ưu tiên tenant context đã được resolve/verify sẵn.

Task:

- [ ] Refactor `TenantMiddleware` thành tenant resolver + tenant verifier rõ vai trò.
- [ ] Bổ sung check tenant active trong auth flow và JWT strategy.
- [ ] Xác định quy tắc login theo tenant:
  - email global hay email unique per tenant
  - nếu giữ email global, login vẫn phải có tenant context hợp lệ
- [ ] Viết integration tests cho cross-tenant access.

### Workstream B - Auth và session architecture

Mục tiêu:

- Session an toàn hơn và dễ revoke/quản lý hơn.

Cần đạt:

- Cookie `HttpOnly` là cơ chế chính cho browser session.
- Không đưa `tenantId` và bearer token trong `localStorage` làm authority.
- Có logout/session invalidation rõ ràng.
- Nếu thêm refresh token, phải làm sau khi tenant boundary đã đúng.

Task:

- [ ] Chuyển frontend sang cookie-first auth.
- [ ] Giảm hoặc loại bỏ dependency vào `Authorization` header từ `localStorage`.
- [ ] Cập nhật auth store để kiểm tra auth qua session state thay vì chỉ decode token local.
- [ ] Đánh giá có cần refresh token ở phase này hay để phase sau.

Ghi chú:

- Refresh token là việc cần cân nhắc, nhưng không nên đặt cao hơn tenant isolation.

### Workstream C - API contract và package boundaries

Mục tiêu:

- Mỗi app dùng cùng một contract đủ rõ.

Cần đạt:

- Response wrapper nhất quán.
- Route names nhất quán.
- DTO, Prisma schema và frontend types khớp nhau.
- Shared packages thực sự là nơi chứa logic dùng chung, không chỉ tách file hình thức.

Task:

- [ ] Quyết định một response convention cho API.
- [ ] Đăng ký `ResponseInterceptor` nếu chọn wrapper format.
- [ ] Loại bỏ frontend-side special cases cho từng endpoint.
- [ ] Fix endpoint mismatch ở lesson APIs.
- [ ] Review lại shared packages:
  - `@repo/api-client`
  - `@repo/shared`
  - common middleware helpers

### Workstream D - Testability và workspace reliability

Mục tiêu:

- Repo phải “tự chạy được” trước khi mở rộng product scope.

Task:

- [ ] Sửa `api-server` test failure và bổ sung integration tests.
- [ ] Sửa frontend build failures.
- [ ] Sửa `super-portal` build script.
- [ ] Thêm/chuẩn hóa root scripts `test`, `test:e2e` nếu docs tiếp tục hướng dẫn sử dụng.
- [ ] Đồng bộ `docs/guides/testing.md`, `tests/api-tests.http`, sample payloads với code thực tế.

Verification tối thiểu:

- `pnpm --filter api-server test`
- `pnpm --filter api-server build`
- `pnpm --filter web-admin build`
- `pnpm --filter web-student build`
- `pnpm --filter super-portal build`

### Workstream E - Product modules trên nền tảng đã ổn

Chỉ đẩy nhanh sau khi A-D ở mức chấp nhận được.

Task:

- [ ] Hoàn thiện Course Builder contract và UI.
- [ ] Hoàn thiện Student Learning Space và progress flow.
- [ ] Mở rộng tenant settings và branding.
- [ ] Đánh giá lesson block architecture sau khi MVP lesson flow ổn định.

## 5. Roadmap theo phase

### Phase 0 - Blocking fixes

- [ ] Fix tenant isolation end-to-end.
- [ ] Fix auth source-of-truth trên frontend.
- [ ] Fix build/test blockers.
- [ ] Cập nhật stale docs/test assets.

### Phase 1 - Contract consolidation

- [ ] Standardize API response model.
- [ ] Fix DTO/schema drift.
- [ ] Fix route mismatch và duplicated client logic.
- [ ] Bổ sung integration tests cho auth/tenant/course/lesson/progress.

### Phase 2 - Operational hardening

- [ ] Logout/session invalidation.
- [ ] Tenant disable enforcement.
- [ ] MCP auth hardening.
- [ ] Observability cho auth, tenant và security events.

### Phase 3 - Feature acceleration

- [ ] Course Builder.
- [ ] Student Learning Space.
- [ ] Super Portal operational workflows.

## 6. Checklist cập nhật

### Đã có nhưng chưa đủ để xem là done

- [x] NestJS modules auth/user/admin/course/lesson/progress
- [x] JWT issue và cookie set cơ bản
- [x] RBAC decorator/guards cho course và lesson mutation
- [x] Pagination cơ bản cho course/lesson
- [x] Shared `@repo/api-client`
- [x] Shared auth store cơ bản
- [x] Health endpoint/module có tồn tại

### Chưa đạt

- [ ] Tenant isolation an toàn
- [ ] Login/JWT validation ràng tenant đúng
- [ ] Frontend cookie-first auth
- [ ] Build ba frontend apps pass trong workspace hiện tại
- [ ] Backend test suite pass
- [ ] Docs testing khớp với scripts thật
- [ ] API contract nhất quán giữa backend và frontend
- [ ] Course DTO/schema alignment

## 7. Việc nên làm tiếp theo

Thứ tự thực thi đề xuất:

1. Sửa tenant isolation và auth flow.
2. Sửa build/test/scripts/docs drift.
3. Chuẩn hóa API contract và shared boundaries.
4. Thêm integration tests để bắt regression.
5. Quay lại mở rộng Course Builder và Student Learning Space.

## 8. Definition of done cho architecture roadmap

Chỉ nên chuyển trọng tâm sang roadmap feature khi:

- Cross-tenant access tests pass.
- Workspace build/test chạy được ở các app chính.
- Frontend không còn dựa vào `localStorage` để mang authority auth/tenant.
- Docs product và docs testing phản ánh đúng code state hiện tại.
- Không còn mismatch lớn giữa DTO, service, schema và frontend client.
