# Kế Hoạch Triển Khai LMS Platform

Cập nhật lần cuối: 2026-04-27

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
- Course unit/chapter V1: schema/API/admin UI/student sidebar theo `CourseUnit`.
- Enrollment DB/API/UI: admin enroll/unenroll, student chỉ thấy course được enroll.
- Student E2E flow: register/login/course/lesson/progress.
- Release checks, smoke API, health/readiness, request id, metrics.
- Production-safe database migration flow.
- Tenant-scoped database constraints for learning relations.
- Centralized learning access policy for course/lesson/progress.
- `LearningActivity` foundation cho lesson opened/completed để summary/reporting không phụ thuộc hoàn toàn vào `UserLessonProgress`.
- Production tenant resolution no longer relies on frontend hardcoded tenant headers.
- Reproducible dependency policy without `"latest"` package specs.

Chưa có hoặc mới ở mức sơ khai:

- Dashboard học tập giống màn hình tổng quan: continue learning, streak, progress chart.
- Program/level hierarchy cao hơn `CourseUnit` nếu nội dung HSK cần nhiều cấp hơn.
- Practice backend, admin UI và student attempt UI MVP đã có.
- Exam/test backend MVP, admin template UI và student exam UI đã có.
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

- Reporting theo enrollment ở mức course detail đã có; dashboard tổng hợp theo tenant đã có bước đầu, còn thiếu phần theo class/cohort và filtering nâng cao.
- Admin UX quản lý học viên đã có search + active/inactive filter + status toggle; còn bulk enroll, class/cohort và bulk action.
- Xem trạng thái học viên trong từng course.

### P2. Student Dashboard V1

Mục tiêu: tạo màn hình học tập chính gần với sản phẩm mục tiêu.

Trạng thái: đã có bước đầu.

Đã làm:

- `GET /api/progress/summary` cho active course, continue lesson, completion percentage.
- Trang home của student khi đã login hiển thị dashboard học tập thay vì hero marketing.
- E2E cover register/login/lesson/progress và dashboard summary.
- `LearningActivity` event foundation cho `lastAccessedLesson`, `lastActivityAt` và reporting về sau.
- Dashboard summary hiển thị current streak, study session count và latest opened lesson.

Phạm vi:

- Course/program selector.
- Continue learning card.
- Completion percentage theo course.
- Daily activity/streak.
- Progress chart đơn giản.
- Empty states khi chưa được enroll hoặc chưa có nội dung.

Data cần bổ sung:

- Time spent đủ tin cậy.
- Aggregate/reporting query cho admin theo enrollment.

### P3. Content Hierarchy

Mục tiêu: tránh để mọi thứ chỉ là `Course -> Lesson` khi sản phẩm có HSK/book/unit.

Trạng thái: đã có nền V1.

Đã làm:

- Thêm model `CourseUnit` thuộc `Course`, có tenant-scoped relation và soft-delete.
- `Lesson` có thể thuộc `CourseUnit`; migration backfill lesson hiện tại vào unit mặc định.
- Course detail API trả cả `units` grouped và `lessons` phẳng để giữ backward compatibility.
- Admin course editor tạo/sửa/xóa unit và thêm/sửa lesson theo unit.
- Student lesson sidebar hiển thị curriculum theo unit/chapter.
- Unit soft-delete giữ lesson lại trong course dưới nhóm chưa xếp unit.

Mô hình hiện tại:

- `Program` hoặc `Track`: HSK, IELTS, Coding...
- `Level`: HSK 1, HSK 2...
- `Course` hoặc `Book`: khóa/chương trình cụ thể.
- `CourseUnit`: unit/chapter trong course.
- `Lesson`.

Quyết định đã chốt:

- Giữ `Course` làm book/course chính, thêm `CourseUnit` trước.
- Chưa thêm `Program/Level`; để sau khi practice/exam/report cần phân cấp cao hơn.

### P4. Practice Engine

Mục tiêu: phục vụ menu "Luyện tập".

Trạng thái: backend MVP, admin management UI và student attempt UI đã có.

Đã làm:

- Question bank.
- Exercise set theo course/unit.
- Question types MVP: multiple choice, fill blank.
- Submit practice attempt, lưu answer snapshot, chấm điểm và trả feedback ngay.
- Authorization theo enrollment/license nền hiện tại.
- Demo seed có một exercise set mẫu.
- Admin UI `/practice` quản lý question bank và exercise set theo course/unit.
- Student UI `/practice` làm bài và xem feedback ngay sau khi nộp.

Còn cần:

- Question types mở rộng: matching, ordering, listening.
- Skill tags: vocabulary, grammar, reading, listening, writing.

Không nên nhét lâu dài vào `Lesson.quiz`; cần tách domain practice.

### P5. Exam/Test Engine

Mục tiêu: phục vụ menu "Kiểm tra".

Trạng thái: backend MVP, admin template UI và student exam UI đã có.

Đã làm:

- Exam template.
- Sections.
- Question types MVP: multiple choice, fill blank.
- Attempt lifecycle: started, submitted.
- Answer snapshot.
- Score, pass/fail, review.
- Authorization theo enrollment/license.
- Demo seed có một exam mẫu.
- Admin UI `/exams` tạo và list exam template theo course/unit.
- Student UI `/exams` start attempt, submit answers và review score/pass-fail.

Còn cần:

- Timer enforcement.
- Question types mở rộng: matching, ordering, listening.

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

1. Practice/Exam report theo unit/skill từ attempt.
2. Reporting nâng cao theo unit/practice/exam.
3. Activation/license.
4. Program/level hierarchy nếu nội dung HSK cần nhiều cấp hơn.
5. AI conversation.

## Definition Of Done Cấp Dự Án

Một phase chỉ được xem là xong khi:

- Có migration/schema tương ứng nếu có dữ liệu mới.
- API có authorization theo tenant/enrollment/license.
- Frontend dùng contract thật, không mock hoặc hardcode tenant/course.
- Có test phù hợp với rủi ro của feature.
- `pnpm --filter api-server test`, build app liên quan và lint pass.
- Docs product/API/backlog được cập nhật cùng thay đổi code.
