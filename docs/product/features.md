# Feature Map LMS Platform

Cập nhật lần cuối: 2026-04-27

## Mục tiêu

Tài liệu này mô tả feature map cấp sản phẩm. Trạng thái chi tiết theo sprint/engineering nằm trong [ENGINEERING-BACKLOG.md](ENGINEERING-BACKLOG.md), còn thứ tự phase nằm trong [PLAN.md](PLAN.md).

## Trạng thái tổng quan

| Module             | Trạng thái   | Ghi chú                                                                       |
| ------------------ | ------------ | ----------------------------------------------------------------------------- |
| Multi-tenant auth  | Đã có nền    | Cookie-first, tenant-aware, còn cần tiếp tục verify khi mở feature mới        |
| Course builder     | Đang làm     | CRUD course/unit/lesson, admin edit UI đã có                                  |
| Enrollment/access  | Đang làm     | DB/API/UI đã có, còn reporting/bulk/class                                     |
| Student learning   | MVP          | Course list, lesson view, mark completed                                      |
| Student dashboard  | MVP shell    | Continue learning, completion %, streak/session summary đã có                 |
| Practice           | Admin UI MVP | Question bank, exercise set, attempt/scoring API và admin management UI đã có |
| Exam/Test          | Chưa làm     | Cần attempt/grading/timer                                                     |
| Reports            | Chưa làm     | Cần aggregate progress/activity                                               |
| Activation/license | Chưa làm     | Cần code redemption/entitlement                                               |
| AI Convo           | Chưa làm     | Làm sau usage/reporting                                                       |

## Actor: Student

### Học bài

Đã có:

- Xem danh sách course được enroll.
- Mở lesson.
- Text/video/quiz lesson type ở mức MVP.
- Mark lesson completed.
- Unit/chapter navigation trong lesson sidebar.

Cần làm tiếp:

- Course overview giàu hơn theo unit.
- Progress chart/activity calendar.

### Luyện tập

Đã có backend domain riêng.

Đã có:

- Question bank.
- Exercise set theo course/unit/skill.
- Question types MVP: multiple choice, fill blank.
- Practice attempt.
- Feedback ngay sau câu trả lời.
- Authorization theo enrollment.
- Admin UI quản lý question bank/exercise set.

Cần làm tiếp:

- Student UI làm bài practice và xem feedback.
- Question types mở rộng: matching, ordering, listening prompt.

### Kiểm tra

Chưa có exam engine.

Feature cần có:

- Exam template.
- Section/timer.
- Attempt lifecycle.
- Submit answers.
- Grading.
- Review result.
- Authorization theo enrollment/license.

### Báo cáo cá nhân

Chưa có.

Feature cần có:

- Daily streak.
- Activity calendar.
- Completion by course/unit.
- Accuracy by skill.
- Recent attempts.

### AI Convo

Chưa có.

Feature cần có:

- Conversation scenario.
- Chat session/messages.
- Usage quota.
- Safety prompt.
- Feedback/scoring nếu cần.

## Actor: Admin / Center Owner

### Course Manager

Đã có:

- Tạo/sửa/xóa course.
- Tạo/sửa/xóa unit/chapter trong course.
- Tạo/sửa/xóa lesson.
- Gán lesson vào unit/chapter.
- Preview bài học đầu tiên.

Cần làm tiếp:

- Lesson ordering tốt hơn.
- Lesson content blocks.
- Media upload/storage.

### Student & Enrollment

Đã có:

- Admin API xem users.
- Enroll/unenroll student vào course qua API/UI.
- Student chỉ thấy course được enroll.
- Server-side student search in enrollment UI.
- Shared backend policy and tenant-scoped DB constraints protect enrollment access.

Cần làm tiếp:

- Student management page hoàn chỉnh.
- Search/filter nâng cao.
- Bulk enroll.
- Class/cohort.
- Enrollment report.

### Reports

Chưa có.

Feature cần có:

- Completion by course.
- Student activity.
- Progress by enrollment.
- Practice/exam performance.

## Actor: Super Admin

Đã có nền:

- Tenant/admin modules ở mức MVP.

Cần làm tiếp:

- Tenant lifecycle UI đầy đủ.
- Domain/branding/settings.
- Plan/billing/module entitlement.
- Platform-level usage metrics.

## Domain Model Đề Xuất Cho Giai Đoạn Tới

Hiện tại:

- `Tenant`
- `User`
- `Course`
- `CourseUnit`
- `Lesson`
- `CourseEnrollment`
- `UserLessonProgress`
- `LearningActivity`
- `PracticeQuestion`
- `PracticeExerciseSet`
- `PracticeAttempt`
- `PracticeAnswer`

Cần bổ sung theo thứ tự ưu tiên:

1. `Exam`, `ExamSection`, `ExamAttempt`, `ExamAnswer`.
2. `ActivationCode`, `Entitlement` hoặc `LicenseGrant`.
3. `Program`/`Level` nếu cần phân cấp cao hơn course.
4. `AiConversation`, `AiMessage`, `UsageQuota`.

## Feature Ưu Tiên Gần Nhất

1. Student UI làm bài practice.
2. Exam MVP.
3. Reporting nâng cao theo unit/practice/exam.
4. Activation/license.
