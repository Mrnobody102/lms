# Backlog Kỹ Thuật Và Theo Dõi Tiến Độ

Cập nhật lần cuối: 2026-05-19 (Batch P9.1 — Skill Mastery Foundation)

## Mục tiêu

Tài liệu này dùng để theo dõi backlog kỹ thuật, tiến độ triển khai và trạng thái xác minh của LMS Platform sau giai đoạn audit và hardening.

Nguyên tắc:

- Chỉ đánh dấu hoàn thành khi đã có cách verify rõ ràng.
- Ưu tiên security, tenant boundary, build/runtime reliability trước khi mở rộng feature.
- Mỗi epic cần có đầu ra, rủi ro và bước tiếp theo.

## Trạng thái tổng quan

| Hạng mục                               | Trạng thái           | Ghi chú                                                                                                                                                        |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookie-first auth cho browser flow     | Đã làm               | Không còn coi `localStorage` là authority chính                                                                                                                |
| Tenant-aware auth + business API tests | Đã làm               | Có HTTP integration tests cho auth/course/lesson/progress                                                                                                      |
| Student E2E flow thực tế               | Đã làm               | Đã thay test giả bằng register/login/lesson/progress                                                                                                           |
| Local release verification             | Đã làm               | Có `build:stable`, `smoke:api`, `test:e2e`, cleanup port                                                                                                       |
| Health/readiness có DB + Redis check   | Đã làm               | Có `live`, `ready` và smoke runtime thật                                                                                                                       |
| CI release-grade checks                | Đã làm               | Đã tách fast/build/e2e/api smoke trong workflow                                                                                                                |
| Migration hygiene production-safe      | Đã làm               | Có runbook baseline, `db:status`, `db:resolve`, guard `db:push` production                                                                                     |
| Enrollment / access model              | Đang làm             | Đã có DB/API/UI access control, shared policy, DB constraints; bulk enroll/unenroll; đã có reporting theo course, tenant overview và accuracy/dashboard cơ bản |
| Student dashboard / continue learning  | Đang làm             | Đã có dashboard shell, streak UI, session count, activity calendar và performance report; còn "next best item" và daily review card (P9)                       |
| Content hierarchy (Program/Level)      | Đã làm               | Program, Level, CourseUnit, lesson; hierarchical reporting; còn drag/drop reorder                                                                              |
| Practice engine                        | Đã có Student UI MVP | Question bank, exercise set, submit attempt/scoring, enrollment authorization, admin/student practice UI; question types: MC, fill-blank, matching, ordering   |
| Quiz / Exam attempt                    | Đã có Student UI MVP | Exam template, section/question, start/submit attempt, scoring, review, enrollment authorization, admin/student UI; cùng bộ question types                     |
| Activation / license code              | Đã làm               | Activation code, license grant, redemption history, expiration/usage limits.                                                                                   |
| Skill mastery + SRS                    | Đã làm (MVP)         | `Skill` catalog + `SkillMastery` EWMA (Batch P9.1). Đã hoàn thành SRS Core (`ReviewCard`, daily review queue, dashboard card) (Batch P9.2).                    |
| AI in-context tutor (P8a)              | Chưa làm             | Giải thích lỗi practice/exam review, contextual vocab help. Priority cao nhất trong AI track.                                                                  |
| AI-generated practice (P8b)            | Chưa làm             | Sinh câu hỏi từ skill yếu, admin duyệt.                                                                                                                        |
| AI conversation roleplay (P8c)         | Chưa làm             | Scenario-based chat/voice roleplay.                                                                                                                            |
| Media storage / background jobs        | Chưa làm             | Cần cho listening question và AI audio scoring.                                                                                                                |
| Listening question type                | Chưa làm             | Blocked by media storage (P10).                                                                                                                                |

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
- [ ] Audit log cho bulk enroll/unenroll (actorId, targetUserIds, courseId, count, ip, userAgent)
- [ ] Surface `BulkEnrollmentResult.skippedCount`/`duplicateCount` lên admin UI toast
- [ ] Drag/drop reorder unit và lesson trong admin UI

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
- [x] Add cross-environment deployment guide with concrete domain examples.

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
- [x] Progress/reporting aggregate theo unit (admin `/reports/courses/:id` tab Units)

### Epic G. Practice Engine

Task:

- [x] Thiết kế question bank
- [x] Thiết kế exercise set theo course/unit/skill
- [x] Hỗ trợ question types MVP: multiple choice, fill blank, matching, ordering (dnd-kit sorting — commit `ec64d6e`)
- [x] Practice attempt submit + scoring
- [x] Lưu answer snapshot và feedback
- [x] Test authorization theo enrollment ở service level
- [x] Admin UI quản lý question bank/exercise set
- [x] Student UI làm bài practice và xem feedback
- [x] Student-facing practice reads không lộ đáp án/giải thích trước submit
- [x] Practice attempt history/review UI cho student
- [x] Practice report theo unit/skill (admin `/reports` skills panel + course units tab)

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
- [x] Student-facing exam reads không lộ đáp án/giải thích trước submit
- [x] Demo seed IDs tương thích UUID route validation
- [x] Timer enforcement cho exam attempt và resume attempt còn hạn
- [x] Exam attempt history/review UI cho student

### Epic I. Reporting

Task:

- [x] Student activity calendar
- [x] Course completion report
- [x] Enrollment progress report
- [x] Practice/exam accuracy report
- [x] Admin report dashboard cơ bản
- [x] Admin drill-down Program → Level → Course → Unit/Students/Skills
- [x] CSV export cho course-students, course-units, skills snapshot
- [ ] Time-series trends (skill mastery / activity theo week/month)
- [ ] Cohort/class drill-down (sau khi có cohort model)
- [ ] Skill mastery time-series dựa trên `SkillMastery` table (P9 prerequisite)

### Epic J. Activation Và License

Trạng thái: **Đã hoàn thành MVP** (xem PLAN P7).

Task:

- [x] Thiết kế activation code
- [x] Redeem code
- [x] Mapping code sang entitlement/enrollment
- [x] Expiration/usage limit
- [x] Redemption audit log

### Epic K. AI Features (P8a / P8b / P8c)

Trạng thái: chưa làm. Chia thành 3 track con để tránh "chat trước, giá trị sau".

#### P8a. AI In-Context Tutor (ưu tiên cao nhất)

- [ ] Thiết kế AI explanation call với context (lesson content, correct answer, skill tag)
- [ ] "Giải thích" button trên practice/exam review UI — mỗi câu sai
- [ ] Bôi đen từ vựng/cụm từ trong lesson để AI giải thích
- [ ] `AiUsageQuota` table cho per-tenant và per-user quota
- [ ] Per-tenant AI settings (`Course.aiSettings`)
- [ ] Safety/system prompt theo tenant
- [ ] Admin usage dashboard

#### P8b. AI-Generated Practice

- [ ] Trigger từ skill mastery report (P9) — sinh câu hỏi cho skill yếu
- [ ] AI generation pipeline dùng schema `PracticeQuestion` sẵn có
- [ ] Admin review queue trước khi push vào question bank

#### P8c. AI Conversation Roleplay

- [ ] Thiết kế conversation scenario theo course
- [ ] AI session/messages
- [ ] Chat UI student
- [ ] Safety/system prompt theo tenant
- [ ] Usage quota
- [ ] Optional feedback/scoring
- [ ] Audio scoring với `AI_EVALUATED_AUDIO` (cần Epic M)

### Epic L. Spaced Repetition System Và Skill Mastery (P9)

Trạng thái: Đã hoàn thành (Batch P9.1, 2026-05-19 và Batch P9.2, 2026-05-19).

#### Skill Mastery Foundation (Batch P9.1)

- [x] Model `Skill` (catalog: code, name, nameVi, color, sortOrder, isActive, soft-delete)
- [x] `SkillMastery(userId, skillId, mastery, attempts, correctAttempts, lastUpdatedAt)` table
- [x] Cập nhật `SkillMastery` từ `PracticeAnswer`/`ExamAnswer` qua EWMA (α=0.7)
- [x] `GET /api/skills` + `GET /api/skills/mastery` (student order ASC by mastery)
- [x] `POST/PATCH/DELETE /api/skills` admin CRUD với audit log SKILL_CREATE/UPDATE/DELETE
- [x] Skill filter trên student practice UI (chip filter, URL-driven `?skill=CODE`)
- [x] Admin UI `/skills` quản lý catalog với badge color, edit dialog, soft-delete
- [x] Student dashboard `SkillMasteryPanel` (5 kỹ năng yếu nhất, progress bar, link "Luyện ngay")
- [x] Seed 5 canonical skill (VOCABULARY/GRAMMAR/READING/LISTENING/WRITING) + normalize legacy tags
- [x] Best-effort sync trong submit transaction (try/catch không block)
- [x] Unit tests cho EWMA correctness, multi-skill, empty codes, error swallowing (140 tests pass)
- [ ] Skill mastery time-series chart trên student report (cần `SkillMasteryHistory` table)

#### SRS Core (Batch P9.2)

- [x] Model `ReviewCard(userId, sourceType, sourceId, dueAt, interval, easeFactor, reps, lapses, grade, tenantId, skillCodes, questionSnapshot)`
- [x] Sinh review card từ practice answer (incorrect answers)
- [x] `GET /api/srs/queue` trả review queue trong ngày (card đến hạn)
- [x] `POST /api/srs/review` nhận grade (Again/Hard/Good/Easy → SM-2 interval update)
- [x] Daily review card hiển thị số card đến hạn trên Student Dashboard
- [x] Integrate SRS queue với "next best item" recommendation:
  - Continue lesson hiện tại (nếu chưa hết)
  - Card SRS đến hạn (phục hồi)
  - Practice exercise theo skill yếu nhất

### Epic M. Media Storage Và Background Jobs (P10)

Trạng thái: chưa làm. Mở khóa listening question và AI audio scoring.

- [ ] Object storage abstraction (S3-compatible)
- [ ] Signed URL upload cho admin (lesson media, listening question audio)
- [ ] Signed URL upload cho student (audio bài nói cho AI scoring)
- [ ] Background job queue (BullMQ hoặc tương tự) cho AI evaluation, transcoding, notification
- [ ] Audit trail cho media upload nhạy cảm
- [ ] Listening question type cho practice và exam
- [ ] Audio playback UI trong question renderer

## Bước tiếp theo đề xuất

Thứ tự ưu tiên dựa trên giá trị giáo dục, dependencies và hiện trạng:

1. ✅ Audit log + bulk feedback hoàn chỉnh (Epic D close-out — DONE).
2. ✅ Skill mastery foundation (Epic L phần đầu — DONE Batch P9.1, 2026-05-19).
3. ✅ SRS review queue MVP (Epic L SRS Core): `ReviewCard` model, daily review trên dashboard, "next best item" recommendation (DONE Batch P9.2).
4. **NEXT**: AI In-Context Tutor (Epic K P8a): nhúng "Giải thích vì sao sai" vào practice/exam review, dùng usage quota.
5. Media upload pipeline (Epic M): mở khóa listening question và audio AI scoring.
6. Listening question type (Epic M): sau khi media pipeline sẵn sàng.
7. Time-series reporting + cohort drill-down (Epic I close-out): khi có dữ liệu skill mastery theo thời gian.
8. AI-Generated Practice (Epic K P8b) → AI Conversation Roleplay (Epic K P8c).
9. Drag/drop reorder unit & lesson (Epic F optional): backend `order: Int` đã sẵn, chỉ cần UI.

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
- [x] Cross-environment deploy guide end-to-end
