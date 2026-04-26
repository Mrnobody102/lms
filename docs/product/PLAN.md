# Kế Hoạch Triển Khai LMS Platform

Cập nhật lần cuối: 2026-04-25

## Định hướng sản phẩm

LMS Platform đang đi theo hướng nền tảng học tập multi-tenant, có thể phục vụ nhiều trung tâm giáo dục. Trục sản phẩm gần nhất là một learning experience giống các hệ thống HSK/language learning hiện đại:

- Học bài theo chương trình, khóa học, chương, bài học.
- Tiếp tục học từ bài gần nhất.
- Luyện tập theo kỹ năng và bộ câu hỏi.
- Kiểm tra/thi thử có chấm điểm và review.
- Theo dõi tiến độ, streak, báo cáo học tập.
- Admin quản lý course, lesson, học viên, enrollment và báo cáo.
- Sau khi nền đủ ổn mới mở AI conversation và module chuyên sâu.

## Hiện trạng

Đã có nền tảng quan trọng:

- Monorepo `apps/` + `packages/`.
- Backend NestJS module hóa: `auth`, `user`, `admin`, `course`, `lesson`, `progress`, health, metrics.
- Cookie-first auth cho browser flow.
- Tenant-aware auth và access checks.
- Course/lesson CRUD cơ bản.
- Enrollment DB/API/UI: admin enroll/unenroll, student chỉ thấy course được enroll.
- Student E2E flow: register/login/course/lesson/progress.
- Release checks, smoke API, health/readiness, request id, metrics.
- Production-safe database migration flow.
- Tenant-scoped database constraints for learning relations.
- Centralized learning access policy for course/lesson/progress.
- Production tenant resolution no longer relies on frontend hardcoded tenant headers.
- Reproducible dependency policy without `"latest"` package specs.

Chưa có hoặc mới ở mức sơ khai:

- Dashboard học tập giống màn hình tổng quan: continue learning, streak, progress chart.
- Content hierarchy rõ hơn cho program/level/book/unit/lesson.
- Practice engine/question bank.
- Exam/test attempt/grading đầy đủ.
- Reporting theo enrollment/progress.
- Activation/license code.
- AI conversation.
- Media storage/background jobs.

## Nguyên tắc roadmap

- Nền tảng auth, tenant boundary, migration và verification phải ổn trước khi mở feature lớn.
- Product feature phải có model dữ liệu, API contract, UI flow và test tương ứng.
- Student chỉ truy cập nội dung qua enrollment/license hợp lệ.
- Progress/reporting phải dựa trên event hoặc trạng thái đủ giàu, không chỉ boolean completed.
- Không trộn practice/test/AI vào `Lesson.quiz` quá lâu; field này chỉ phù hợp MVP.

## Roadmap ưu tiên

### P0. Foundation Hardening

Trạng thái: phần lớn đã hoàn thành.

Đã làm:

- Cookie-first auth.
- Tenant validation trong login/register/JWT strategy.
- Cross-tenant guard cho resource APIs.
- CSRF cho state-changing cookie requests.
- CORS/CSP production hardening.
- Health/readiness với DB + Redis.
- Request id + request metrics.
- CI/release verification.
- Production migration runbook và `db:push` guard.

Còn cần theo dõi:

- Cross-environment deploy guide end-to-end.
- Build trace của Next standalone có thể chậm, cần theo dõi trong CI.

### P1. Course Builder Và Enrollment

Trạng thái: đang làm, backend/API/UI core đã có.

Đã làm:

- Course và lesson CRUD cơ bản.
- Lesson types: `video`, `text`, `quiz` ở mức schema/MVP.
- Enrollment model.
- Admin enroll/unenroll học viên vào course.
- Student course list/detail/lesson/progress bị giới hạn theo enrollment.
- Tenant integrity is enforced in the database for lesson, enrollment, and progress relations.
- Admin enrollment search is server-side.

Còn cần:

- Reporting theo enrollment.
- Admin UX quản lý học viên tốt hơn: filter, bulk enroll, class/cohort.
- Xem trạng thái học viên trong từng course.

### P2. Student Dashboard V1

Mục tiêu: tạo màn hình học tập chính gần với sản phẩm mục tiêu.

Trạng thái: đã có bước đầu.

Đã làm:

- `GET /api/progress/summary` cho active course, continue lesson, completion percentage.
- Trang home của student khi đã login hiển thị dashboard học tập thay vì hero marketing.
- E2E cover register/login/lesson/progress và dashboard summary.

Phạm vi:

- Course/program selector.
- Continue learning card.
- Completion percentage theo course.
- Daily activity/streak.
- Progress chart đơn giản.
- Empty states khi chưa được enroll hoặc chưa có nội dung.

Data cần bổ sung:

- `lastAccessedAt` hoặc learning activity event.
- Learning activity event để streak/reporting chính xác hơn.
- Streak/activity calculation.

### P3. Content Hierarchy

Mục tiêu: tránh để mọi thứ chỉ là `Course -> Lesson` khi sản phẩm có HSK/book/unit.

Mô hình đề xuất:

- `Program` hoặc `Track`: HSK, IELTS, Coding...
- `Level`: HSK 1, HSK 2...
- `Course` hoặc `Book`: khóa/chương trình cụ thể.
- `Unit` hoặc `Chapter`.
- `Lesson`.

Quyết định cần chốt:

- Giữ `Course` làm book/course chính, thêm `Unit`.
- Hay thêm `Program/Level` trước rồi course thuộc level.

### P4. Practice Engine

Mục tiêu: phục vụ menu "Luyện tập".

Phạm vi:

- Question bank.
- Exercise set.
- Question types: multiple choice, fill blank, matching, ordering, listening.
- Practice attempt.
- Skill tags: vocabulary, grammar, reading, listening, writing.
- Immediate feedback.

Không nên nhét lâu dài vào `Lesson.quiz`; cần tách domain practice.

### P5. Exam/Test Engine

Mục tiêu: phục vụ menu "Kiểm tra".

Phạm vi:

- Exam template.
- Sections.
- Timer.
- Attempt lifecycle: started, submitted, graded.
- Answer snapshot.
- Score, pass/fail, review.
- Authorization theo enrollment/license.

### P6. Reporting

Mục tiêu: phục vụ menu "Báo cáo" cho student và admin.

Student reports:

- Completion by course/unit.
- Streak/activity calendar.
- Accuracy by skill.
- Recent attempts.

Admin reports:

- Course completion.
- Student activity.
- Enrollment progress.
- Practice/exam performance.

### P7. Activation Và Licensing

Mục tiêu: phục vụ flow "Nhập mã kích hoạt".

Phạm vi:

- Activation code.
- License grant: course/program access.
- Redemption history.
- Expiration/usage limits.
- Mapping activation -> enrollment hoặc entitlement.

### P8. AI Conversation

Mục tiêu: phục vụ menu "AI Convo".

Chỉ nên làm sau khi auth, enrollment, usage tracking và basic reports ổn.

Phạm vi:

- Conversation scenarios.
- AI session/messages.
- Usage quota.
- Safety/system prompts.
- Optional feedback/scoring.

## Thứ tự làm tiếp đề xuất

1. Student Dashboard V1: continue learning, completion percentage, last accessed lesson.
2. Progress aggregate/reporting theo enrollment.
3. Content hierarchy: thêm `Unit/Chapter` trước.
4. Practice engine MVP.
5. Exam/test engine MVP.
6. Activation/license.
7. AI conversation.

## Definition Of Done Cấp Dự Án

Một phase chỉ được xem là xong khi:

- Có migration/schema tương ứng nếu có dữ liệu mới.
- API có authorization theo tenant/enrollment/license.
- Frontend dùng contract thật, không mock hoặc hardcode tenant/course.
- Có test phù hợp với rủi ro của feature.
- `pnpm --filter api-server test`, build app liên quan và lint pass.
- Docs product/API/backlog được cập nhật cùng thay đổi code.
