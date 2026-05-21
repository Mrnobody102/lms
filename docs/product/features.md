# Feature Map LMS Platform

Cập nhật lần cuối: 2026-05-21 (Batch P10.1 — Listening audio prompt)

## Mục tiêu

Tài liệu này mô tả feature map cấp sản phẩm. Trạng thái chi tiết theo sprint/engineering nằm trong [ENGINEERING-BACKLOG.md](ENGINEERING-BACKLOG.md), thứ tự phase nằm trong [PLAN.md](PLAN.md), và tầm nhìn AI/Hybrid learning nằm trong [interactive-learning-plan.md](interactive-learning-plan.md).

## Trạng thái tổng quan

| Module                      | Trạng thái     | Ghi chú                                                                                                                                                 |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-tenant auth           | Ổn định        | Cookie-first, tenant-aware, full interceptor support.                                                                                                   |
| Course builder              | Đang làm       | CRUD course/unit/lesson, admin edit UI đã có. Còn drag/drop reorder.                                                                                    |
| Program/Level hierarchy     | Đã có V1       | Schema, API, admin UI và hierarchical reporting.                                                                                                        |
| Enrollment/access           | Đang làm       | DB/API/UI + bulk enroll/unenroll đã có. Còn thiếu audit log cho bulk + class/cohort.                                                                    |
| Student learning            | MVP            | Course list, lesson view, mark completed, sidebar theo unit.                                                                                            |
| Student dashboard           | MVP shell      | Continue learning, completion %, streak/session summary, activity calendar, daily review và "next best item" recommendation đã có.                      |
| Practice                    | Student UI MVP | Question bank, exercise set, attempt/scoring, admin UI và student UI đã có. Question types: MC, fill-blank, matching, ordering, listening audio prompt. |
| Exam/Test                   | Student UI MVP | Exam template, section/question, attempt lifecycle, scoring/review, timer, resume. Cùng bộ question types như practice, có listening audio prompt.      |
| Reports                     | MVP            | Student/admin report, drill-down Program → Level → Course → Unit/Skills, CSV export. Còn time-series và cohort.                                         |
| Activation/license          | MVP            | Activation code redemption, license grant, expiration/usage limit.                                                                                      |
| Skill mastery / SRS         | Đã làm (MVP)   | Skill catalog + `SkillMastery` EWMA. Đã hoàn thành SRS Core (`ReviewCard`, SM-2, daily review, practice integration).                                   |
| AI in-context tutor (P8a)   | Đã làm         | Giải thích lỗi practice/exam, từ vựng trong lesson. Đã hoàn thành MVP.                                                                                  |
| AI-generated practice (P8b) | Chưa làm       | Sinh question từ skill yếu, admin duyệt.                                                                                                                |
| AI Conversation (P8c)       | Chưa làm       | Roleplay scenario, audio scoring (cần media pipeline).                                                                                                  |
| Media storage / jobs        | Đã có core     | S3-compatible storage, presigned upload, MediaAsset, BullMQ jobs; đã dùng cho listening audio prompt.                                                   |

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

Đã có backend domain riêng, admin UI và student attempt UI MVP.

Đã có:

- Question bank.
- Exercise set theo course/unit/skill.
- Question types MVP: multiple choice, fill blank.
- Practice attempt.
- Feedback ngay sau câu trả lời.
- Authorization theo enrollment.
- Student-facing reads không lộ đáp án/giải thích trước submit.
- Admin UI quản lý question bank/exercise set.
- Student UI làm bài practice và xem feedback.
- Student UI xem recent attempts và review practice attempt đã nộp.
- Listening audio prompt: admin gắn audio, student nghe bằng player có replay limit trong attempt/review/SRS.

Cần làm tiếp:

- Skill filter trên student practice UI (luyện theo kỹ năng yếu).

### Kiểm tra

Đã có backend MVP, admin template UI và student exam UI:

- Exam template.
- Section/question.
- Attempt lifecycle started/submitted.
- Submit answers.
- Grading.
- Review result.
- Authorization theo enrollment/license.
- Student-facing reads không lộ đáp án/giải thích trước submit.
- Timer enforcement với countdown/resume attempt còn hạn.
- Admin UI quản lý exam template.
- Student UI làm exam và review kết quả.
- Student UI xem recent attempts, resume exam đang dở và review exam attempt đã nộp.

Cần làm tiếp:

- Reporting accuracy theo unit/skill và recent activity/reporting tổng hợp.

### Báo cáo cá nhân

Đã có nền từ P6 (Reporting). Cần mở rộng theo P9 (SRS + SkillMastery).

Đã có:

- Daily streak.
- Activity calendar.
- Completion by course/unit.
- Accuracy by skill (snapshot).
- Recent attempts.

Cần làm tiếp:

- Skill mastery chart (time-series, dựa trên `SkillMastery`).
- Daily review card (SRS queue due count).
- "Next best item" recommendation.

### AI Features

Chia làm 3 track theo giá trị giáo dục (xem [PLAN.md](PLAN.md) P8a/b/c):

#### P8a. AI In-Context Tutor

Giải thích lỗi sai trong practice/exam review ngay tại chỗ — không phải chat free-form.

Đã có foundation:

- Practice/exam answer snapshot + explanation field.

Cần thêm:

- "Giải thích" button gắn vào từng câu sai.
- AI call với context (lesson content, skill, correct answer).
- Per-tenant AI settings (`Course.aiSettings`).
- Usage quota.

#### P8b. AI-Generated Practice

Sinh thêm câu hỏi cho skill/unit yếu — admin duyệt trước khi dùng.

Cần thêm:

- AI generation pipeline từ skill content.
- Admin review queue.
- Integration với question bank.

#### P8c. AI Conversation Roleplay

Roleplay tình huống bằng AI chat/voice.

Cần thêm:

- Conversation scenario theo course.
- AI session/messages.
- Audio scoring (cần media pipeline P10).
- Safety prompt theo tenant.

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
- Bulk enroll/unenroll với DTO validation và transaction.
- Student chỉ thấy course được enroll.
- Server-side student search in enrollment UI.
- Shared backend policy and tenant-scoped DB constraints protect enrollment access.

Cần làm tiếp:

- Audit log cho bulk enroll/unenroll và hành động enrollment nhạy cảm.
- Surface bulk result (skippedCount, duplicateCount) lên admin UI thay vì chỉ success/error toast.
- Class/cohort model.
- Enrollment trend report.

### Reports

Đã có MVP:

- Course completion.
- Student activity.
- Progress by enrollment.
- Practice/exam performance.
- Drill-down Program → Level → Course → Unit/Skills.
- CSV export.

Cần làm tiếp:

- Time-series trends (week/month).
- Cohort/class drill-down (sau khi có cohort model).
- Skill mastery trend dựa trên `SkillMastery` table (sau khi P9 có).

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
- `Program` (đã có V1)
- `Level` (đã có V1, thuộc Program)
- `Course` (thuộc Level)
- `CourseUnit` (thuộc Course)
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
- `ActivationCode`
- `Entitlement`
- `Skill`
- `SkillMastery`
- `ReviewCard` (SRS, batch P9.2)

Cần bổ sung theo thứ tự ưu tiên:

1. `AiConversation`, `AiMessage` (cho P8c roleplay).
2. `AiUsageQuota(tenantId, used, limit, resetAt)` — cho P8a/b/c quota management.
3. `MediaAsset(id, tenantId, type, url, uploadedBy, createdAt)` — cho P10 listening/audio.
4. `SkillMasteryHistory(userId, skillId, mastery, recordedAt)` — cho time-series chart sau này.

## Feature Ưu Tiên Gần Nhất

1. ✅ Audit log + bulk feedback cho enrollment (P1 close-out — DONE).
2. ✅ Skill mastery model + skill filter trên student practice UI (P9 prerequisite — DONE Batch P9.1).
3. ✅ SRS review queue MVP — daily review card, session UI trên dashboard (P9 core — DONE Batch P9.2).
4. ✅ AI in-context tutor — giải thích lỗi practice/exam (P8a — DONE).
5. ✅ Media upload pipeline — mở khóa listening question (P10 — DONE).
6. ✅ Listening audio prompt cho practice và exam (P4/P5 close-out — DONE Batch P10.1).
7. **NEXT**: Time-series reporting + cohort drill-down (P6 close-out).
