# Backlog Kỹ Thuật Và Theo Dõi Tiến Độ

Cập nhật lần cuối: 2026-04-27

## Mục tiêu

Tài liệu này dùng để theo dõi backlog kỹ thuật, tiến độ triển khai và trạng thái xác minh của LMS Platform sau giai đoạn audit và hardening.

Nguyên tắc:

- Chỉ đánh dấu hoàn thành khi đã có cách verify rõ ràng.
- Ưu tiên security, tenant boundary, build/runtime reliability trước khi mở rộng feature.
- Mỗi epic cần có đầu ra, rủi ro và bước tiếp theo.

## Trạng thái tổng quan

| Hạng mục                               | Trạng thái           | Ghi chú                                                                                                              |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Cookie-first auth cho browser flow     | Đã làm               | Không còn coi `localStorage` là authority chính                                                                      |
| Tenant-aware auth + business API tests | Đã làm               | Có HTTP integration tests cho auth/course/lesson/progress                                                            |
| Student E2E flow thực tế               | Đã làm               | Đã thay test giả bằng register/login/lesson/progress                                                                 |
| Local release verification             | Đã làm               | Có `build:stable`, `smoke:api`, `test:e2e`, cleanup port                                                             |
| Health/readiness có DB + Redis check   | Đã làm               | Có `live`, `ready` và smoke runtime thật                                                                             |
| CI release-grade checks                | Đã làm               | Đã tách fast/build/e2e/api smoke trong workflow                                                                      |
| Migration hygiene production-safe      | Đã làm               | Có runbook baseline, `db:status`, `db:resolve`, guard `db:push` production                                           |
| Enrollment / access model              | Đang làm             | Đã có DB/API/UI access control, shared policy, DB constraints; đã có reporting theo course và tenant overview cơ bản |
| Student dashboard / continue learning  | Đang làm             | Đã có dashboard shell, streak UI, session count; còn chart và admin reporting                                        |
| Content hierarchy                      | Đã có V1             | `CourseUnit` thuộc course, lesson gắn unit, admin/student UI grouped theo unit                                       |
| Practice engine                        | Đã có Student UI MVP | Question bank, exercise set, submit attempt/scoring, enrollment authorization, admin/student practice UI             |
| Quiz / Exam attempt                    | Đã có Student UI MVP | Exam template, section/question, start/submit attempt, scoring, review, enrollment authorization, admin/student UI   |
| Activation / license code              | Chưa làm             | Phục vụ flow nhập mã kích hoạt                                                                                       |
| AI conversation                        | Chưa làm             | Làm sau usage/reporting                                                                                              |
| Media storage / background jobs        | Chưa làm             | Chỉ nên làm sau hạ tầng release ổn định                                                                              |

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
- [x] Chuẩn hóa baseline migration cho DB hiện hữu.
- [x] Chốt chiến lược production DB:
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
- [x] Bổ sung request id / correlation id trong log
- [x] Bổ sung metrics cơ bản cho auth + business APIs
- [x] Tách response cho monitoring và human-readable docs

### Epic C. CI Production-Style

Mục tiêu:

- PR phải bị chặn nếu hỏng test/build trọng yếu.

Task:

- [x] Đồng bộ `.github/workflows/ci.yml` với script verify mới
- [x] Bổ sung E2E smoke job trên Chromium
- [x] Bổ sung API smoke job với Postgres + Redis service containers
- [x] Tách fast checks và release checks để giữ CI đủ nhanh

### Epic D. Enrollment Và Access Control Mức Product

Mục tiêu:

- Student chỉ thấy course mình được phép học.

Task:

- [x] Thiết kế bảng enrollment
- [x] Admin enroll / unenroll học viên qua API
- [x] Student course list chỉ lấy dữ liệu theo enrollment
- [x] Progress access control theo enrollment
- [x] Test quyền truy cập course chưa được enroll
- [x] Admin UI cho enroll / unenroll
- [x] Centralize course/lesson/progress access policy in `LearningAccessService`
- [x] Add tenant-scoped DB constraints for learning relations
- [x] Move admin enrollment student search to server-side filtering
- [x] Reporting theo enrollment

### Epic L. Codebase Maintainability Hardening

Mục tiêu:

- Giữ codebase dễ hiểu cho dev mới, không để policy quan trọng bị copy/paste rải rác.
- Giữ install/build tái lập được giữa local, CI và production.

Task:

- [x] Remove unused response interceptor contract.
- [x] Pin package manifests instead of using `"latest"`.
- [x] Scope shared package tests to `src` to avoid duplicate `dist` test execution.
- [x] Harden MCP auth and per-session SSE transport handling.
- [x] Make frontend tenant header local/dev by default; production resolves by host/domain.
- [x] Allow CSP `unsafe-inline` scripts and `unsafe-eval` only in non-production Next dev so browser E2E can hydrate under webpack.
- [ ] Add cross-environment deployment guide with concrete domain examples.

### Epic E. Progress Và Learning Experience

Mục tiêu:

- Progress không chỉ là `COMPLETED`, mà có giá trị vận hành và sản phẩm.
- Tạo nền cho dashboard học tập: tiếp tục học, % hoàn thành, streak, biểu đồ tiến độ.

Task:

- [x] Completion percentage theo course
- [x] Resume learning / continue lesson summary
- [x] Student dashboard V1 shell trên trang home khi đã login
- [x] Last accessed lesson event chi tiết qua `LearningActivity`
- [x] Time spent hoặc session count
- [x] Daily learning streak foundation trong summary API
- [x] Daily learning streak hiển thị trên UI
- [x] Admin dashboard cơ bản theo tiến độ

### Epic F. Content Hierarchy

Task:

- [x] Thiết kế `CourseUnit` thuộc course
- [x] Lesson thuộc unit/chapter nhưng vẫn migrate được dữ liệu hiện tại
- [x] Admin UI quản lý unit/chapter
- [x] Student lesson sidebar theo unit/chapter
- [x] Test ordering và soft-delete ở service level
- [ ] Drag/drop reorder unit và lesson trong admin UI
- [ ] Progress/reporting aggregate theo unit

### Epic G. Practice Engine

Task:

- [x] Thiết kế question bank
- [x] Thiết kế exercise set theo course/unit/skill
- [x] Hỗ trợ question types MVP: multiple choice, fill blank
- [x] Practice attempt submit + scoring
- [x] Lưu answer snapshot và feedback
- [x] Test authorization theo enrollment ở service level
- [x] Admin UI quản lý question bank/exercise set
- [x] Student UI làm bài practice và xem feedback
- [ ] Practice report theo unit/skill

### Epic H. Quiz / Exam Attempt Và Grading

Task:

- [x] Tách exam template khỏi `Lesson.quiz`
- [x] Thiết kế `Exam`, `ExamSection`, `ExamQuestion`, `ExamAttempt`, `ExamAnswer`
- [x] Start exam attempt
- [x] Submit exam attempt và chấm điểm
- [x] Lưu score / answers / submittedAt
- [x] Review kết quả attempt
- [x] Test scoring + authorization ở service level
- [x] Admin UI quản lý exam template
- [x] Student UI làm exam và review kết quả

### Epic I. Reporting

Task:

- [ ] Student activity calendar
- [ ] Course completion report
- [ ] Enrollment progress report
- [ ] Practice/exam accuracy report
- [ ] Admin report dashboard cơ bản

### Epic J. Activation Và License

Task:

- [ ] Thiết kế activation code
- [ ] Redeem code
- [ ] Mapping code sang entitlement/enrollment
- [ ] Expiration/usage limit
- [ ] Redemption audit log

### Epic K. AI Conversation

Task:

- [ ] Thiết kế conversation scenario
- [ ] Lưu AI session/messages
- [ ] Usage quota/rate limit
- [ ] Safety/system prompt theo tenant
- [ ] Feedback/scoring nếu cần

## Bước tiếp theo đề xuất

Thứ tự nên làm tiếp:

1. Bổ sung Practice/Exam report theo unit/skill từ dữ liệu attempt.
2. Sau đó mở activation/license nếu cần kiểm soát entitlement.
3. Bổ sung timer enforcement cho exam attempt.
4. Mở rộng question types: matching, ordering, listening.

## Checklist xác minh gần nhất

Đã xác minh local:

- [x] `pnpm test`
- [x] `pnpm lint`
- [x] `pnpm run build:stable`
- [x] `pnpm run smoke:api`
- [x] `pnpm test:e2e`
- [x] `pnpm --filter web-admin lint`
- [x] `pnpm --filter web-admin build`
- [x] `pnpm --filter web-student lint`
- [x] `pnpm --filter web-student build`
- [x] `pnpm --filter @repo/database build`
- [x] `pnpm --filter api-server test`
- [x] `pnpm --filter api-server lint`
- [x] `pnpm --filter api-server build`
- [x] `pnpm --filter web-admin lint`
- [x] `pnpm --filter web-admin build`
- [x] `pnpm --filter web-student lint`
- [x] `pnpm --filter web-student build`

Chưa xác minh xong:

- [x] CI workflow mới
- [x] Production migration runbook
- [ ] Cross-environment deploy guide end-to-end
