# Feature Map LMS Platform

Cập nhật lần cuối: 2026-04-25

## Mục tiêu

Tài liệu này mô tả feature map cấp sản phẩm. Trạng thái chi tiết theo sprint/engineering nằm trong [ENGINEERING-BACKLOG.md](ENGINEERING-BACKLOG.md), còn thứ tự phase nằm trong [PLAN.md](PLAN.md).

## Trạng thái tổng quan

| Module             | Trạng thái | Ghi chú                                                                |
| ------------------ | ---------- | ---------------------------------------------------------------------- |
| Multi-tenant auth  | Đã có nền  | Cookie-first, tenant-aware, còn cần tiếp tục verify khi mở feature mới |
| Course builder     | Đang làm   | CRUD course/lesson, admin edit UI đã có                                |
| Enrollment/access  | Đang làm   | DB/API/UI đã có, còn reporting/bulk/class                              |
| Student learning   | MVP        | Course list, lesson view, mark completed                               |
| Student dashboard  | MVP shell  | Continue learning + completion %, còn streak/chart                     |
| Practice           | Chưa làm   | Cần question bank/exercise set                                         |
| Exam/Test          | Chưa làm   | Cần attempt/grading/timer                                              |
| Reports            | Chưa làm   | Cần aggregate progress/activity                                        |
| Activation/license | Chưa làm   | Cần code redemption/entitlement                                        |
| AI Convo           | Chưa làm   | Làm sau usage/reporting                                                |

## Actor: Student

### Học bài

Đã có:

- Xem danh sách course được enroll.
- Mở lesson.
- Text/video/quiz lesson type ở mức MVP.
- Mark lesson completed.

Cần làm tiếp:

- Continue learning.
- Completion percentage.
- Last accessed lesson event chi tiết.
- Sidebar/course overview giống dashboard học tập.
- Unit/chapter navigation.

### Luyện tập

Chưa có domain riêng.

Feature cần có:

- Question bank.
- Exercise set theo course/unit/skill.
- Question types:
  - multiple choice
  - fill blank
  - matching
  - ordering
  - listening prompt
- Practice attempt.
- Feedback ngay sau câu trả lời.

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
- Tạo/sửa/xóa lesson.
- Preview bài học đầu tiên.

Cần làm tiếp:

- Unit/chapter.
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
- `Lesson`
- `CourseEnrollment`
- `UserLessonProgress`

Cần bổ sung theo thứ tự ưu tiên:

1. `LearningActivity` hoặc mở rộng progress để lưu last accessed/time spent.
2. `Unit` hoặc `Chapter`.
3. `Question`, `QuestionOption`, `ExerciseSet`, `PracticeAttempt`.
4. `Exam`, `ExamSection`, `ExamAttempt`, `ExamAnswer`.
5. `ActivationCode`, `Entitlement` hoặc `LicenseGrant`.
6. `AiConversation`, `AiMessage`, `UsageQuota`.

## Feature Ưu Tiên Gần Nhất

1. Student Dashboard V1.
2. Progress aggregate theo enrollment.
3. Unit/chapter hierarchy.
4. Practice MVP.
5. Exam MVP.
