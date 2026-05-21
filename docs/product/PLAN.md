# Kế Hoạch Triển Khai LMS Platform

Cập nhật lần cuối: 2026-05-21 (Batch Auth/List Handling — Google login + pagination)

## Định hướng sản phẩm

LMS Platform đi theo mô hình **Hybrid AI-Enhanced Learning**: giữ nền tảng học truyền thống (course/lesson/practice/exam) nhưng nhúng các cơ chế đã được nghiên cứu khoa học giáo dục chứng minh hiệu quả, kết hợp AI để cá nhân hóa. Trục sản phẩm gần với HSK/IELTS/Duolingo hiện đại.

Trục sản phẩm:

- Học bài theo program/level/course/unit/lesson, hỗ trợ microlearning.
- Tiếp tục học từ bài gần nhất, đề xuất "next best item" theo skill mastery + SRS due.
- Luyện tập theo kỹ năng, instant feedback ngay sau mỗi câu trả lời.
- Kiểm tra/thi thử có chấm điểm, timer và review.
- Spaced repetition cho vocabulary/grammar/concept cards.
- Theo dõi tiến độ, streak, skill mastery, báo cáo học tập theo time-series.
- Admin quản lý course, lesson, học viên, enrollment, cohort và reporting drill-down.
- AI tầng trên: in-context tutor (giải thích lỗi practice/exam), conversation roleplay, AI-generated practice — theo thứ tự giá trị giáo dục giảm dần.
- Danh sách dài: dùng server-side pagination cho list quản trị, cursor pagination cho log/time-series lớn, và virtualization khi render nhiều dòng.

Nguyên tắc learning-science:

- **Active recall + spaced repetition** thay vì re-read passive (xem video/đọc text).
- **Mastery-based progression**: hiểu kỹ năng học viên yếu, dạy lại — không chỉ đếm completion %.
- **Instant feedback** thay vì batch grading sau khi nộp.
- **Microlearning**: nội dung 1–3 phút, tương tác ngay sau khi xem.
- **Adaptive sequencing**: hệ thống chọn item kế tiếp dựa trên dữ liệu, không phải thứ tự cứng.

## Hiện trạng

Đã có nền tảng quan trọng:

- Monorepo `apps/` + `packages/`.
- Backend NestJS module hóa: `auth`, `user`, `admin`, `course`, `lesson`, `progress`, health, metrics.
- Cookie-first auth cho browser flow.
- Google Identity Services login: backend verify ID token rồi phát cookie session nội bộ; auto-provision chỉ mở cho student portal, admin/super portal yêu cầu tài khoản có quyền sẵn.
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

- Dashboard học tập đã có continue learning, streak, activity calendar, performance report, daily review và "next best item"; còn chart nâng cao.
- Practice backend, admin UI và student attempt UI MVP đã có. Question types đã có multiple choice, fill blank, matching, ordering; listening audio prompt đã có bằng audio overlay trên question hiện có.
- Exam/test backend MVP, admin template UI và student exam UI đã có với cùng bộ question types và listening audio prompt.
- Reporting theo enrollment/progress, activity calendar, practice/exam accuracy, drill-down Program → Level → Course → Unit/Skills đã có. Còn thiếu time-series trends và cohort drill-down.
- Activation/license code đã hoàn thành MVP.
- Program/Level hierarchy đã có (Batch A): schema, API, admin UI, hierarchical reporting.
- Skill mastery model: đã có MVP (`Skill`, `SkillMastery`, EWMA).
- Spaced repetition system: đã có MVP (`ReviewCard`, daily review, SM-2 scheduling).
- AI in-context tutor đã có MVP; AI conversation roleplay chưa có.
- Media storage/background jobs cho audio/video: đã có hạ tầng core và đã dùng cho listening audio prompt.
- Audit log cho hành động enrollment nhạy cảm (bulk) đã có; còn thiếu cohort/class và trend report nâng cao.

## Nguyên tắc roadmap

- Nền tảng auth, tenant boundary, migration và verification phải ổn trước khi mở feature lớn.
- Product feature phải có model dữ liệu, API contract, UI flow và test tương ứng.
- Student chỉ truy cập nội dung qua enrollment/license hợp lệ.
- Progress/reporting phải dựa trên event hoặc trạng thái đủ giàu, không chỉ boolean completed.
- Không trộn practice/test/AI vào `Lesson.quiz` quá lâu; field này chỉ phù hợp MVP.
- Mọi hành động admin nhạy cảm (bulk enroll/unenroll, license grant/revoke, role change) phải có audit log.
- AI feature phải có giá trị giáo dục cụ thể (in-context tutor giải thích lỗi, AI-generated practice từ skill yếu) trước khi làm chat free-form.
- Skill mastery và SRS scheduling phải dùng signal có sẵn (`PracticeAnswer`, `ExamAnswer`, `LearningActivity`) thay vì tạo event mới song song.

## Roadmap ưu tiên

### P0. Foundation Hardening

Trạng thái: phần lớn đã hoàn thành.

Đã làm:

- Cookie-first auth.
- Google login bằng Google Identity Services ID token, cần cấu hình `GOOGLE_CLIENT_ID` và `NEXT_PUBLIC_GOOGLE_CLIENT_ID` theo môi trường.
- Tenant validation trong login/register/JWT strategy.
- Cross-tenant guard cho resource APIs.
- CSRF cho state-changing cookie requests.
- CORS/CSP production hardening.
- Health/readiness với DB + Redis.
- Request id + request metrics.
- CI/release verification.
- Production migration runbook và `db:push` guard.

Còn cần theo dõi:

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
- Bulk enroll/unenroll học viên theo course đã có API, admin UI và test service.

Còn cần:

- Reporting theo enrollment ở mức course detail đã có; dashboard tổng hợp theo tenant đã có bước đầu, còn thiếu phần theo class/cohort và filtering nâng cao.
- Admin UX quản lý học viên đã có search + active/inactive filter + status toggle + bulk enroll theo course; còn class/cohort và bulk action nâng cao.
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
- "Next best item" recommendation (kết hợp continue lesson + due SRS card + skill yếu).
- Daily review card (số card SRS đến hạn).

Data cần bổ sung:

- Time spent đủ tin cậy.
- Aggregate/reporting query cho admin theo enrollment.
- Skill mastery snapshot per student (P6 prerequisite).

### P3. Content Hierarchy

Mục tiêu: tránh để mọi thứ chỉ là `Course -> Lesson` khi sản phẩm có HSK/book/unit.

Trạng thái: đã hoàn thành Batch A.

Đã làm:

- Thêm model `CourseUnit` thuộc `Course`, có tenant-scoped relation và soft-delete.
- `Lesson` có thể thuộc `CourseUnit`; migration backfill lesson hiện tại vào unit mặc định.
- Course detail API trả cả `units` grouped và `lessons` phẳng để giữ backward compatibility.
- Admin course editor tạo/sửa/xóa unit và thêm/sửa lesson theo unit.
- Student lesson sidebar hiển thị curriculum theo unit/chapter.
- Unit soft-delete giữ lesson lại trong course dưới nhóm chưa xếp unit.
- `Program` và `Level` đã có schema, API, admin UI và hierarchical reporting (commit `979b215`/`3a22341`).

Mô hình hiện tại:

- `Program`: HSK, IELTS, Coding... (đã có)
- `Level`: HSK 1, HSK 2... (đã có)
- `Course` hoặc `Book`: khóa/chương trình cụ thể.
- `CourseUnit`: unit/chapter trong course.
- `Lesson`.

Còn cần:

- Drag/drop reorder unit và lesson trong admin UI.
- Microlearning lesson type (`micro_card`) cho định dạng vuốt dọc 1–3 phút (xem [interactive-learning-plan.md](interactive-learning-plan.md) Phase 3).

### P4. Practice Engine

Mục tiêu: phục vụ menu "Luyện tập".

Trạng thái: backend MVP, admin management UI và student attempt UI đã có.

Đã làm:

- Question bank.
- Exercise set theo course/unit/skill.
- Question types MVP: multiple choice, fill blank, matching, ordering (dnd-kit sorting — commit `ec64d6e`).
- Submit practice attempt, lưu answer snapshot, chấm điểm và trả feedback ngay.
- Authorization theo enrollment/license nền hiện tại.
- Demo seed có một exercise set mẫu.
- Admin UI `/practice` quản lý question bank và exercise set theo course/unit.
- Student UI `/practice` làm bài và xem feedback ngay sau khi nộp.
- Student-facing practice reads không lộ đáp án hoặc giải thích trước khi submit.
- Student có attempt history/review UI cho practice qua recent attempts và route review riêng.
- Skill tags theo practice question (vocabulary, grammar, reading, listening) và audio media prompt cho câu hỏi nghe.
- Listening audio prompt: admin gắn audio từ media pipeline, student nghe bằng player có replay limit trong attempt/review/SRS.

Còn cần:

- Skill tags filter trên student practice UI (chọn luyện theo kỹ năng yếu).

Không nên nhét lâu dài vào `Lesson.quiz`; cần tách domain practice.

### P5. Exam/Test Engine

Mục tiêu: phục vụ menu "Kiểm tra".

Trạng thái: backend MVP, admin template UI và student exam UI đã có.

Đã làm:

- Exam template.
- Sections.
- Question types MVP: multiple choice, fill blank, matching, ordering (dnd-kit sorting).
- Attempt lifecycle: started, submitted.
- Answer snapshot.
- Score, pass/fail, review.
- Authorization theo enrollment/license.
- Demo seed có một exam mẫu.
- Admin UI `/exams` tạo và list exam template theo course/unit.
- Student UI `/exams` start attempt, submit answers và review score/pass-fail.
- Student-facing exam reads không lộ đáp án hoặc giải thích trước khi submit.
- Timer enforcement ở mức attempt đã có; backend reject submit quá hạn và UI hiển thị countdown/resume attempt còn hạn.
- Student có attempt history/review UI cho exam qua recent attempts, resume in-progress attempt và route review riêng.
- Listening audio prompt: admin gắn audio từ media pipeline, student nghe bằng player có replay limit trong attempt/review.

Còn cần:

- Không còn blocker listening MVP; listening passage 1 audio/nhiều câu hỏi vẫn để sau MVP.

### P6. Reporting

Mục tiêu: phục vụ menu "Báo cáo" cho student và admin.

Trạng thái: đã có nền cơ bản và bước đầu drill-down theo Program/Level/Unit/Skill cho admin.

Student reports:

- Completion by course/unit.
- Streak/activity calendar.
- Accuracy by skill (snapshot — chưa có time-series).
- Recent attempts.

Admin reports:

- Course completion.
- Student activity.
- Enrollment progress.
- Practice/exam performance.
- Drill-down Program → Level → Course → Unit/Students/Skills (admin `/reports`).
- CSV export cho course-students, course-units, skills snapshot.

Còn cần:

- Drill-down theo class/cohort (sau khi thêm cohort model).
- Time-series trends (week/month) cho skill mastery và activity.
- Export/filter nâng cao theo range thời gian.
- Reporting theo unit/skill cho student-side đã có; có thể thêm so sánh giữa các khóa.
- Skill mastery report dựa trên `SkillMastery` thay vì rolling accuracy snapshot — cần P9 prerequisite.

### P7. Activation Và Licensing

Trạng thái: đã hoàn thành MVP.

Mục tiêu: phục vụ flow "Nhập mã kích hoạt".

Phạm vi:

- Activation code.
- License grant: course/program access.
- Redemption history.
- Expiration/usage limits.
- Mapping activation -> enrollment hoặc entitlement.

### P8. AI Features

Mục tiêu: nhúng AI vào nền học truyền thống theo thứ tự giá trị giáo dục giảm dần. Chỉ làm sau khi auth, enrollment, usage tracking và basic reports ổn.

Chia thành ba track con để tránh "chat trước, giá trị sau":

#### P8a. AI In-Context Tutor (Epic K) - **HOÀN THÀNH**

Mục tiêu: học viên hiểu được tại sao sai, không chỉ biết sai.

Phạm vi:

- Khi học viên submit practice/exam và nhận feedback, gắn nút "Giải thích" cho từng câu sai.
- AI giải thích dựa trên: correctAnswer + explanation đã có, và ngữ cảnh skill.
- Usage quota theo tenant + per-user để kiểm soát chi phí.
- Adapter Pattern cho AI Providers (hỗ trợ `@google/genai` và các AI SDK khác).
- API `/ai/explain/...` kết nối LLM.

#### P8b. AI-Generated Practice (giá trị trung bình)

Mục tiêu: tự sinh thêm câu hỏi cho skill/unit yếu, admin duyệt trước khi học viên nhận.

Phạm vi:

- Trigger từ skill mastery report (P9).
- AI sinh question kèm correctAnswer + explanation dùng schema sẵn có.
- Admin review queue trước khi push vào question bank.

#### P8c. AI Conversation Roleplay (giá trị tình huống)

Mục tiêu: phục vụ menu "AI Convo" theo định nghĩa cũ.

Phạm vi:

- Conversation scenarios theo course (ví dụ HSK: mặc cả ở chợ, hỏi đường).
- AI session/messages.
- Usage quota.
- Safety/system prompts theo tenant.
- Optional feedback/scoring.
- Audio chấm phát âm (`AI_EVALUATED_AUDIO`) — cần media pipeline P10.

### P9. Spaced Repetition System (SRS) Và Skill Mastery

Mục tiêu: cốt lõi học thuật của sản phẩm — vũ khí khác biệt với LMS truyền thống.

Trạng thái: Đã hoàn thành (Batch P9.1 - Skill Mastery Foundation, Batch P9.2 - SRS Core).

Cơ sở khoa học:

- **Spaced repetition** (Ebbinghaus, SuperMemo SM-2, FSRS) cho vocabulary/grammar/concept retention.
- **Knowledge tracing**: ước lượng skill mastery của học viên theo Bayesian update đơn giản hoặc rolling accuracy có decay.
- **Active recall** thay vì passive re-read.

Đã làm (Batch P9.1):

- Model `Skill` (catalog tenant-scoped: code, name, nameVi, color, sortOrder, isActive, soft-delete).
- Model `SkillMastery(userId, skillId, mastery, attempts, correctAttempts, lastUpdatedAt)` cập nhật từ `PracticeAnswer`/`ExamAnswer` qua EWMA (α=0.7).
- Hook best-effort sync trong `PracticeService.submitAttempt` và `ExamService.submitAttempt` — không block submit nếu mastery update fail.
- API: `GET /api/skills`, `POST/PATCH/DELETE /api/skills` (admin với audit log SKILL_CREATE/UPDATE/DELETE), `GET /api/skills/mastery` cho student order ASC.
- Practice exercise set list filter `?skill=CODE`.
- Admin UI `/skills` quản lý catalog (badge color, soft-delete, edit dialog).
- Student dashboard `SkillMasteryPanel` hiển thị 5 kỹ năng yếu nhất với progress bar và link "Luyện ngay".
- Student practice page có chip filter theo skill, URL-driven (`/practice?skill=CODE`), empty state đặc thù.
- Seed 5 canonical skill (VOCABULARY/GRAMMAR/READING/LISTENING/WRITING) + normalize legacy `vocabulary` → `VOCABULARY`.

Đã làm tiếp (Batch P9.2 - SRS Core):

- Model `ReviewCard(userId, sourceType, sourceId, dueAt, interval, easeFactor, reps, lapses, grade, tenantId, skillCodes, questionSnapshot)` hỗ trợ polymorphic source (Practice/Exam).
- SrsService với thuật toán SuperMemo SM-2 (EaseFactor, Interval).
- Best-effort hook `upsertCardsForAnswers` trong `PracticeService` và `ExamService` để tạo thẻ ôn tập khi học viên trả lời sai.
- API: `GET /api/srs/queue`, `POST /api/srs/review/:cardId`, `GET /api/srs/summary`.
- Mở rộng `ProgressService.getSummary` bao gồm `srsDue`.
- Web Student UI: component `SrsReviewCard` (Daily review), `NextBestItem` (Priority recommendation), page `/review` (session ôn tập card-by-card).

Còn cần (SRS Core):

- Lịch sử ôn tập (Review Log) để vẽ biểu đồ và phân tích chi tiết.
- Tính năng edit custom card cho học viên (nếu cần mở rộng học từ vựng riêng).

### P10. Media Storage Và Background Jobs

Mục tiêu: nền tảng cho listening question, AI audio scoring, video lesson tracking.

Trạng thái: đã có hạ tầng core và đã dùng cho listening audio prompt.

Phạm vi:

- Object storage abstraction (S3-compatible).
- Upload signed URL cho admin và student.
- Background job queue cho AI evaluation, audio transcoding, email/notification.
- Audit trail cho media upload nhạy cảm qua `MediaAsset`.
- Listening audio prompt cho practice/exam question.

Phụ thuộc cho: P4/P5 listening question, P8c audio scoring.

## Thứ tự làm tiếp đề xuất

Thứ tự ưu tiên dựa trên giá trị giáo dục, dependencies và hiện trạng:

1. **Audit log + bulk feedback hoàn chỉnh** (P1 close-out) ✅ DONE: bulk enroll/unenroll có audit log + skipped/duplicate count surfaced lên admin UI.
2. **Skill mastery model + skill tags filter** (P9 phần đầu, prerequisite cho mọi adaptive feature) ✅ DONE — Batch P9.1: `Skill`, `SkillMastery`, EWMA hook, admin/student UI, practice filter.
3. **SRS Review Queue MVP** (P9 phần lõi) ✅ DONE: Thẻ từ practice answer, daily review trên dashboard, session ôn tập, "next best item" recommendation.
4. **AI In-Context Tutor** (P8a) ✅ DONE: Nhúng "Giải thích vì sao sai" vào practice/exam review, dùng usage quota và Gemini API.
5. **Media upload pipeline** (P10) ✅ DONE: Hạ tầng lưu trữ S3 Storage client và background job queue (BullMQ + Redis) hoàn thành.
6. **Listening audio prompt** (P4/P5 close-out) ✅ DONE: Practice/exam questions có audio attachment, admin upload, student player và SRS playback.
7. **Time-series reporting + cohort drill-down** (P6 close-out): khi có dữ liệu skill mastery theo thời gian. ← **NEXT**
8. **AI-Generated Practice** (P8b) → **AI Conversation Roleplay** (P8c).
9. **Drag/drop reorder unit và lesson** (P3 polish, có thể chen ngang khi có thời gian).

## Definition Of Done Cấp Dự Án

Một phase chỉ được xem là xong khi:

- Có migration/schema tương ứng nếu có dữ liệu mới.
- API có authorization theo tenant/enrollment/license.
- Frontend dùng contract thật, không mock hoặc hardcode tenant/course.
- Có test phù hợp với rủi ro của feature.
- `pnpm --filter api-server test`, build app liên quan và lint pass.
- Docs product/API/backlog được cập nhật cùng thay đổi code.
