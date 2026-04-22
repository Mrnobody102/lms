# Backlog Kỹ Thuật Và Theo Dõi Tiến Độ

Cập nhật lần cuối: 2026-04-22

## Mục tiêu

Tài liệu này dùng để theo dõi backlog kỹ thuật, tiến độ triển khai và trạng thái xác minh của LMS Platform sau giai đoạn audit và hardening.

Nguyên tắc:

- Chỉ đánh dấu hoàn thành khi đã có cách verify rõ ràng.
- Ưu tiên security, tenant boundary, build/runtime reliability trước khi mở rộng feature.
- Mỗi epic cần có đầu ra, rủi ro và bước tiếp theo.

## Trạng thái tổng quan

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| Cookie-first auth cho browser flow | Đã làm | Không còn coi `localStorage` là authority chính |
| Tenant-aware auth + business API tests | Đã làm | Có HTTP integration tests cho auth/course/lesson/progress |
| Student E2E flow thực tế | Đã làm | Đã thay test giả bằng register/login/lesson/progress |
| Local release verification | Đã làm | Có `build:stable`, `smoke:api`, `test:e2e`, cleanup port |
| Health/readiness có DB + Redis check | Đã làm | Có `live`, `ready` và smoke runtime thật |
| CI release-grade checks | Đang làm | Cần đồng bộ workflow với release flow mới |
| Migration hygiene production-safe | Chưa làm xong | Vẫn cần baseline/migrate strategy rõ ràng |
| Enrollment / access model | Chưa làm | Epic lớn tiếp theo |
| Quiz attempt / grading | Chưa làm | Nên đi sau progress/enrollment |
| Media storage / background jobs | Chưa làm | Chỉ nên làm sau hạ tầng release ổn định |

## Những gì đã hoàn thành

### 1. Nền tảng bảo mật và tenant isolation

- [x] Login/register yêu cầu tenant context hợp lệ.
- [x] JWT validation đối chiếu tenant của token với tenant của user.
- [x] Guard chặn tenant mismatch cho non-super-admin.
- [x] Auth browser flow dùng cookie `HttpOnly`.
- [x] Logout xóa session cookie đúng cách.

### 2. Test và verify có giá trị thực tế

- [x] Unit + integration tests cho auth/tenant/resource access.
- [x] Manual API collection trong `tests/api-tests.http` được cập nhật theo flow mới.
- [x] Student Playwright E2E đi qua register/login/course/lesson/progress.
- [x] Smoke API local với Postgres + Redis thật.

### 3. Release verification và local ops

- [x] `ports:free` chỉ dọn process thuộc repo này.
- [x] `build:stable` cho Windows khi parallel build không ổn định.
- [x] `smoke:api` cho runtime check gần production nhưng vẫn gọn.
- [x] `release:check` gom build/test/smoke/e2e.
- [x] `api-server` build tự clean `dist` để tránh artifact cũ.

## Epic đang mở

### Epic A. Release Và Deploy Hygiene

Mục tiêu:

- Tách rõ local/dev convenience với flow release thật.
- Không dùng script có khả năng phá dữ liệu trong verify path.

Task:

- [x] Thêm `build:stable`, `smoke:api`, `release:check`.
- [x] Tách `db:deploy` khỏi `smoke:api`; smoke không được tự ý mutate schema.
- [x] Làm `seed` chạy lặp lại được.
- [ ] Chuẩn hóa baseline migration cho DB hiện hữu.
- [ ] Chốt chiến lược production DB:
  - Chỉ `migrate deploy`
  - Không dùng `db push`
  - Có runbook rollback rõ ràng

### Epic B. Runtime Observability Và Health Model

Mục tiêu:

- Biết app “sống” hay “sẵn sàng phục vụ” một cách rõ ràng.

Task:

- [x] Tách `GET /api/health/live`
- [x] Tách `GET /api/health/ready`
- [x] Readiness có DB check
- [x] Readiness có Redis connectivity check
- [ ] Bổ sung request id / correlation id trong log
- [ ] Bổ sung metrics cơ bản cho auth + business APIs
- [ ] Tách response cho monitoring và human-readable docs

### Epic C. CI Production-Style

Mục tiêu:

- PR phải bị chặn nếu hỏng test/build trọng yếu.

Task:

- [ ] Đồng bộ `.github/workflows/ci.yml` với script verify mới
- [ ] Bổ sung E2E smoke job trên Chromium
- [ ] Bổ sung API smoke job với Postgres + Redis service containers
- [ ] Tách fast checks và release checks để giữ CI đủ nhanh

### Epic D. Enrollment Và Access Control Mức Product

Mục tiêu:

- Student chỉ thấy course mình được phép học.

Task:

- [ ] Thiết kế bảng enrollment
- [ ] Admin enroll / unenroll học viên
- [ ] Student course list chỉ lấy dữ liệu theo enrollment
- [ ] Progress/reporting theo enrollment
- [ ] Test quyền truy cập course chưa được enroll

### Epic E. Progress Và Learning Experience

Mục tiêu:

- Progress không chỉ là `COMPLETED`, mà có giá trị vận hành và sản phẩm.

Task:

- [ ] Completion percentage theo course
- [ ] Last accessed lesson
- [ ] Resume learning
- [ ] Time spent hoặc session count
- [ ] Admin dashboard cơ bản theo tiến độ

### Epic F. Quiz Attempt Và Grading

Task:

- [ ] Tách lesson quiz config khỏi user attempt
- [ ] Submit quiz attempt
- [ ] Lưu score / answers / submittedAt
- [ ] Review kết quả
- [ ] Test scoring + authorization

## Bước tiếp theo đề xuất

Thứ tự nên làm tiếp:

1. Chốt CI release-grade cho `test + lint + build + smoke + e2e`.
2. Làm migration/baseline strategy cho DB production-safe.
3. Bắt đầu Epic D: enrollment model.
4. Sau đó mới mở rộng progress và quiz.

## Checklist xác minh gần nhất

Đã xác minh local:

- [x] `pnpm test`
- [x] `pnpm lint`
- [x] `pnpm run build:stable`
- [x] `pnpm run smoke:api`
- [x] `pnpm test:e2e`

Chưa xác minh xong:

- [ ] CI workflow mới
- [ ] Production migration runbook
- [ ] Cross-environment deploy guide end-to-end
