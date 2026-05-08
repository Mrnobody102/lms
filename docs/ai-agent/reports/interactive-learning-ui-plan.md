# Plan: Interactive Learning UI — Final Production Plan

> **Ngày tạo:** 2026-05-09
> **Phương pháp:** Đọc 100% source code tất cả file liên quan với dẫn chứng dòng cụ thể. Qua 6 vòng phản biện.

---

## Bảng Sự Thật — Trạng Thái Hiện Tại Của Codebase

Trước khi làm bất cứ điều gì, đây là những gì **đã hoạt động hoàn toàn** (không cần làm thêm):

| Thứ                                    | File & Dòng                             | Ghi chú                                     |
| -------------------------------------- | --------------------------------------- | ------------------------------------------- |
| Streak đã có trong API                 | `progress-api.ts:59`                    | `totals.currentStreak`                      |
| Streak đã hiển thị Dashboard           | `page.tsx:280-282`                      | `DashboardStat` render rồi                  |
| `calculateCurrentStreak` UTC-correct   | `progress.service.ts:273`               | `.toISOString().slice(0,10)`                |
| `handleComplete` đã có                 | `page.tsx:76-81`                        | Gọi `updateProgress.mutate`                 |
| `progress` prop đã truyền vào Sidebar  | `page.tsx:107`                          | `useCourseProgress` data                    |
| Sidebar đã dùng `progress` per-lesson  | `lesson-sidebar.tsx:88-89`              | Icon ✓/▷/○ đã có                            |
| i18n streak keys đã có                 | `en.json:43-44`, `vi.json:43-44`        | `currentStreak`, `streakValue`              |
| i18n quiz keys cơ bản đã có            | `en.json:115-123`, `vi.json:115-123`    | Nhưng **thiếu 2 keys** cho instant feedback |
| Hai hệ thống quiz HOÀN TOÀN khác nhau  | `quiz-content.tsx` vs `/practice` route | Không dùng lẫn                              |
| Admin UI chưa có form `quiz`/`content` | `edit-lesson-form.tsx:51-53`            | Chỉ submit `title, type, duration, unitId`  |

---

## Bugs Đã Phát Hiện — Phải Sửa Trước Khi Thêm Feature

### Bug A (Backend): `updateProgress` tạo duplicate `LESSON_COMPLETED` activity

**Bằng chứng:** `progress.service.ts:48-58`

```typescript
// HIỆN TẠI — Luôn tạo activity kể cả khi status đã là COMPLETED:
if (status === ProgressStatus.COMPLETED) {
  await this.prisma.learningActivity.create({ ... }); // không check đã tồn tại chưa
}
```

**Hệ quả:** Khi video auto-complete → `handleComplete` → sau đó user bấm nút "Mark Complete" lần 2 → 2 bản ghi `LESSON_COMPLETED` trong DB. Streak vẫn đúng (distinct dates), nhưng data analytics bị bẩn.

**Fix cụ thể:**

```typescript
// TRONG updateProgress(), trước upsert:
const existing = await this.prisma.userLessonProgress.findUnique({
  where: { userId_lessonId: { userId, lessonId } },
  select: { status: true },
});
const wasAlreadyCompleted = existing?.status === ProgressStatus.COMPLETED;

// ... upsert như cũ ...

// ĐỔI điều kiện:
if (status === ProgressStatus.COMPLETED && !wasAlreadyCompleted) {
  await this.prisma.learningActivity.create({ ... });
}
```

### Bug B (Frontend): `handleComplete` không có guard — double-call possible

**Bằng chứng:** `page.tsx:76-81` — không có `isPending` check.
**Hệ quả:** Race condition: video triggers `handleComplete`, user kịp bấm nút trong 200ms chờ invalidation.

**Fix:** Extract `isCompleted` ra const, thêm guard:

```typescript
// page.tsx — trước return statement:
const isCompleted = progress.some(
  (p) => p.lessonId === currentLesson.id && p.status === ProgressStatus.COMPLETED,
);

const handleComplete = () => {
  if (isCompleted || updateProgress.isPending) return; // Guard
  updateProgress.mutate({ lessonId: currentLesson.id, status: ProgressStatus.COMPLETED });
};
```

### Bug C (Performance): `useProgressSummary` không có `refetchOnWindowFocus: false`

**Bằng chứng:** `use-progress.ts:43-50` — `staleTime: 60 * 1000` nhưng không có `refetchOnWindowFocus`.
**Hệ quả:** Khi thêm hook này vào `LessonHeader`, mỗi lần user switch tab trong lúc học sẽ trigger heavy query (load toàn bộ courses + activities để tính streak).

**Fix trong hook definition (1 dòng):**

```typescript
export function useProgressSummary(enabled = true) {
  return useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => progressApi.getSummary(),
    enabled,
    staleTime: 5 * 60 * 1000, // Tăng lên 5 phút
    refetchOnWindowFocus: false, // THÊM — không refetch khi switch tab
  });
}
```

---

## Phase 0 — Fix Bugs (Backend First, ~20 phút)

**Lý do làm trước:** Bug A sẽ xảy ra ngay khi Phase 1 deploy vì video tracking sẽ gọi `handleComplete` trước khi user bấm nút.

### File cần sửa:

- **[MODIFY]** `apps/api-server/src/progress/progress.service.ts` — Fix `updateProgress`, thêm `wasAlreadyCompleted` check.

---

## Phase 1 — Frontend Only (~2 giờ, không cần backend thêm)

### 1A: Fix `handleComplete` Guard + Extract `isCompleted` const (~10 phút)

**[MODIFY]** `apps/web-student/src/app/[locale]/lessons/[lessonId]/page.tsx`

- Extract `isCompleted` ra const trước `handleComplete` (dòng 76).
- Thêm guard `if (isCompleted || updateProgress.isPending) return;`.
- Sau này các feature khác cần `isCompleted` đều dùng được const này.

---

### 1B: `useProgressSummary` Performance Fix (~5 phút)

**[MODIFY]** `apps/web-student/src/hooks/use-progress.ts`

- Thêm `staleTime: 5 * 60 * 1000` (tăng từ 60s lên 5 phút).
- Thêm `refetchOnWindowFocus: false`.

---

### 1C: Streak Badge ở Lesson Header (~20 phút)

**[MODIFY]** `apps/web-student/src/components/lessons/lesson-header.tsx`

- Import `useProgressSummary` từ `../../hooks/use-progress`.
- Lấy `totals?.currentStreak`.
- Hiển thị badge `🔥 {streakValue}` nếu `currentStreak > 0`.
- Dùng key i18n đã có: `t('dashboard.streakValue', { days: currentStreak })`.

---

### 1D: Progress Bar ở Lesson Sidebar (~15 phút)

**Bằng chứng data đã có:** `lesson-sidebar.tsx:88-89` đã có `progress` prop. `course.lessons` đã có.

**Tính toán (thêm ở đầu component):**

```typescript
const totalLessons = course.lessons?.length ?? 0;
const completedCount = progress.filter((p) => p.status === ProgressStatus.COMPLETED).length;
const completionPct = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
```

**UI thêm giữa header và `<div className="flex-1 overflow-y-auto">`:**

```html
<!-- Progress bar section -->
<div className="px-8 py-3 border-b bg-muted/10">
  <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
    <span>{completedCount}/{totalLessons} bài</span>
    <span>{completionPct}%</span>
  </div>
  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
    <div
      className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out"
      style={{ width: `${completionPct}%` }}
    />
  </div>
</div>
```

**[MODIFY]** `apps/web-student/src/components/lessons/lesson-sidebar.tsx`

---

### 1E: Native Video Completion Tracking (~25 phút)

**Scope giới hạn rõ ràng:** Chỉ `<video>` HTML5 (MP4 direct). YouTube `<iframe>` không support `onEnded` vì browser sandbox — sẽ làm Phase 2.

**Prop chain cần thêm:** `LessonPage` → `LessonContent` → `VideoPlayer`

```typescript
// VideoPlayer — thêm prop và logic:
interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  onComplete?: () => void; // MỚI
}

// Trong VideoPlayer, với <video> native:
const completedRef = useRef(false); // Guard: chỉ trigger 1 lần

const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
  const video = e.currentTarget;
  if (!completedRef.current && video.duration > 0 && video.currentTime / video.duration >= 0.85) {
    completedRef.current = true;
    onComplete?.();
  }
};

// JSX:
<video
  src={safeSrc}
  controls
  className="..."
  onEnded={() => { if (!completedRef.current) { completedRef.current = true; onComplete?.(); } }}
  onTimeUpdate={handleTimeUpdate}
>
```

**Files cần sửa:**

- **[MODIFY]** `apps/web-student/src/components/lessons/video-player.tsx`
- **[MODIFY]** `apps/web-student/src/components/lessons/lesson-content.tsx` — thêm `onComplete?: () => void` prop
- **[MODIFY]** `apps/web-student/src/app/[locale]/lessons/[lessonId]/page.tsx` — truyền `onComplete={handleComplete}`

---

### 1F: Adaptive Quiz — Instant Per-Question Feedback (~50 phút)

**Phân tích code hiện tại (`quiz-content.tsx`):**

- Dùng `showResults` boolean — lock toàn bộ sau khi bấm "Check Answers".
- Chưa có per-question instant lock.

**Thiết kế mới:**

- Xóa `showResults` state.
- Thêm `lockedMap: Record<number, boolean>` — lock từng câu sau khi chọn.
- Sau khi lock → hiện màu ngay: xanh/đỏ + text "Đáp án đúng: [X]" nếu sai.
- Tất cả locked → gọi `onAllAnswered?.(score, total)`.
- Xóa nút "Check My Answers" và khu vực "Try Again" (UX mới không dùng).
- Thêm banner "✓ Đã trả lời hết! Cuộn xuống để hoàn thành bài học." khi done.

**i18n cần thêm (cả `en.json` lẫn `vi.json`):**

```json
"quiz": {
  // ... keys hiện tại giữ nguyên ...
  "correctAnswerIs": "Correct answer: {answer}",   // vi: "Đáp án đúng: {answer}"
  "allAnsweredHint": "All answered! Scroll down to mark this lesson complete."
  // vi: "Đã trả lời hết! Cuộn xuống để hoàn thành bài học."
}
```

**`LessonPage` — khi nhận `onAllAnswered`:**

```typescript
const handleQuizAllAnswered = () => {
  // Scroll xuống LessonNavigation để user thấy nút "Mark Complete"
  document.querySelector('[data-lesson-navigation]')?.scrollIntoView({ behavior: 'smooth' });
};
```

Thêm `data-lesson-navigation` attribute vào `LessonNavigation` div wrapper.

**Files cần sửa:**

- **[MODIFY]** `apps/web-student/src/components/lessons/quiz-content.tsx`
- **[MODIFY]** `apps/web-student/src/components/lessons/lesson-content.tsx` — thêm `onAllAnswered?: () => void`
- **[MODIFY]** `apps/web-student/src/components/lessons/lesson-navigation.tsx` — thêm `data-lesson-navigation`
- **[MODIFY]** `apps/web-student/src/app/[locale]/lessons/[lessonId]/page.tsx` — pass `onAllAnswered`
- **[MODIFY]** `apps/web-student/src/messages/en.json` — thêm 2 keys
- **[MODIFY]** `apps/web-student/src/messages/vi.json` — thêm 2 keys

---

## Phase 2 — YouTube Player + Checkpoint Schema (~1 ngày)

### 2A: Thêm `checkpoints` Field vào Schema (~15 phút)

**Lý do dùng field riêng thay vì tái dụng `lesson.quiz`:**

- `quiz` = bài trắc nghiệm cuối bài học (`type: 'quiz'`).
- `checkpoints` = câu hỏi pop-up chèn vào video (`type: 'video'`).
- Dùng chung sẽ gây tech debt: lập trình viên sau bối rối, logic phức tạp.
- Admin UI chưa có form nhập liệu nên migration **100% an toàn**.

**Schema thêm vào `Lesson` model:**

```prisma
checkpoints Json? // Video checkpoint questions [{time: number, question, options, correctAnswer}]
```

**Files cần sửa:**

- **[MODIFY]** `packages/database/prisma/schema.prisma`
- **[MODIFY]** `apps/api-server/src/lesson/lesson.service.ts` — thêm `checkpoints` vào `create()`, `update()`
- **[MODIFY]** `apps/web-student/src/lib/course-api.ts` — thêm `checkpoints` vào `Lesson` type

### 2B: YouTube Interactive Player (~4 giờ)

```bash
pnpm --filter web-student add react-youtube
```

**Files cần tạo/sửa:**

- **[NEW]** `apps/web-student/src/components/lessons/youtube-player.tsx` — Wrap `react-youtube`, expose `onComplete`, đọc `lesson.checkpoints` để trigger `CheckpointCard`
- **[NEW]** `apps/web-student/src/components/lessons/checkpoint-card.tsx` — Non-blocking popup góc dưới phải, không block video
- **[MODIFY]** `apps/web-student/src/components/lessons/video-player.tsx` — Route YouTube URL → `YouTubePlayer`, còn lại → native `<video>`

---

## Phase 3 — Future Architecture (Chưa Làm Ngay)

### Vocabulary & Flashcard + SM-2 (Đúng Model)

**Lý do NOT áp SM-2 vào `UserLessonProgress`:**

- SM-2 hiệu quả với đơn vị kiến thức nhỏ (từ đơn, cụm từ).
- Bắt user "ôn tập lại" cả bài giảng video bằng SM-2 là phi sư phạm.
- Database hiện **chưa có** model Flashcard/Vocabulary.

**Thiết kế đúng (khi làm):**

```prisma
model VocabularyItem { ... }
model UserFlashcardReview {
  nextReviewAt   DateTime?
  interval       Int @default(1)
  easeFactorX100 Int @default(250)
  reviewCount    Int @default(0)
}
```

### AI Tutor

- Gợi ý provider: **Gemini Flash** (phù hợp hệ sinh thái, free tier rộng, tốt tiếng Việt).
- Chờ confirm trước khi triển khai.

---

## Thứ Tự Thực Thi Cuối Cùng

```
Phase 0 (~20 phút, 1 file backend):
  └─ Fix updateProgress idempotency (progress.service.ts)

Phase 1 (~2h15, 10 files frontend):
  ├─ 1A: Guard handleComplete + extract isCompleted const         (10 phút)
  ├─ 1B: useProgressSummary performance fix                       ( 5 phút)
  ├─ 1C: Streak Badge tại LessonHeader                            (20 phút)
  ├─ 1D: Progress Bar tại LessonSidebar                           (15 phút)
  ├─ 1E: Native Video Completion Tracking (non-YouTube only)      (25 phút)
  └─ 1F: Adaptive Quiz Instant Per-Question Feedback + i18n       (50 phút)

Phase 2 (~1 ngày, dependency mới + schema):
  ├─ 2A: Schema checkpoints field + API update                    (15 phút)
  └─ 2B: YouTube Interactive Player + CheckpointCard              ( 4 giờ)

Phase 3 (Future, major feature):
  ├─ Vocabulary/Flashcard System with SM-2
  └─ AI Tutor Integration (Gemini Flash)
```

---

## Danh Sách Tất Cả Files Thay Đổi

### Phase 0

| File                                               | Loại   | Lý do                                   |
| -------------------------------------------------- | ------ | --------------------------------------- |
| `apps/api-server/src/progress/progress.service.ts` | MODIFY | Fix duplicate LESSON_COMPLETED activity |

### Phase 1

| File                                                            | Loại   | Lý do                                                      |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `apps/web-student/src/app/[locale]/lessons/[lessonId]/page.tsx` | MODIFY | Extract isCompleted, guard, onComplete+onAllAnswered props |
| `apps/web-student/src/hooks/use-progress.ts`                    | MODIFY | staleTime 5min, refetchOnWindowFocus: false                |
| `apps/web-student/src/components/lessons/lesson-header.tsx`     | MODIFY | Streak badge                                               |
| `apps/web-student/src/components/lessons/lesson-sidebar.tsx`    | MODIFY | Progress bar UI                                            |
| `apps/web-student/src/components/lessons/video-player.tsx`      | MODIFY | onComplete prop, 85% tracking                              |
| `apps/web-student/src/components/lessons/lesson-content.tsx`    | MODIFY | onComplete, onAllAnswered props                            |
| `apps/web-student/src/components/lessons/lesson-navigation.tsx` | MODIFY | data-lesson-navigation attribute                           |
| `apps/web-student/src/components/lessons/quiz-content.tsx`      | MODIFY | Instant per-question feedback refactor                     |
| `apps/web-student/src/messages/en.json`                         | MODIFY | 2 keys mới cho quiz instant feedback                       |
| `apps/web-student/src/messages/vi.json`                         | MODIFY | 2 keys mới cho quiz instant feedback                       |

### Phase 2

| File                                                          | Loại   | Lý do                              |
| ------------------------------------------------------------- | ------ | ---------------------------------- |
| `packages/database/prisma/schema.prisma`                      | MODIFY | Thêm checkpoints Json?             |
| `apps/api-server/src/lesson/lesson.service.ts`                | MODIFY | Thêm checkpoints vào create/update |
| `apps/web-student/src/lib/course-api.ts`                      | MODIFY | Thêm checkpoints type              |
| `apps/web-student/src/components/lessons/youtube-player.tsx`  | NEW    | YouTube API wrapper                |
| `apps/web-student/src/components/lessons/checkpoint-card.tsx` | NEW    | Non-blocking checkpoint popup      |
| `apps/web-student/src/components/lessons/video-player.tsx`    | MODIFY | Route YouTube → YouTubePlayer      |

---

## Verification Plan

### Phase 0 Verification

```bash
pnpm --filter api-server test
pnpm --filter api-server typecheck
```

Manual: Bấm "Mark Complete" 2 lần → DB chỉ có 1 `LESSON_COMPLETED` record.

### Phase 1 Verification

```bash
pnpm --filter web-student typecheck
```

Manual:

- Streak badge hiển thị đúng trên trang bài học.
- Progress bar cập nhật ngay sau khi hoàn thành bài.
- MP4 video → hoàn thành tự động sau 85% → nút "Mark Complete" bị disable.
- Quiz → chọn đáp án → lock ngay, màu xanh/đỏ → cuộn xuống nút "Mark Complete".

### Phase 2 Verification

```bash
pnpm --filter @repo/database typecheck
pnpm --filter api-server typecheck
pnpm --filter web-student typecheck
```

Manual: YouTube video → checkpoint pop-up xuất hiện đúng thời điểm, non-blocking.
