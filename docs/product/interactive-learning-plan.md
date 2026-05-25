# Plan: Mô Hình Học Tập Lai Hiện Đại (Hybrid AI-Enhanced Learning 2026)

> **Phân Tích Tầm Nhìn Chiến Lược:** Hệ thống đang dịch chuyển theo mô hình **Lai (Hybrid)**: Giữ vững các giá trị đào tạo truyền thống (Video bài giảng, Flashcards, Quizzes) nhưng được "siêu cấp hóa" bằng AI để tối ưu hiệu quả. Đây là hướng đi thực tế và bền vững nhất cho các trung tâm ngoại ngữ (đặc biệt là Ngôn ngữ mục tiêu) - nơi cần sự kết hợp giữa kiến thức nền tảng vững chắc và khả năng thực hành giao tiếp linh hoạt.
>
> Hệ thống của chúng ta không thay thế giáo viên hay giáo trình truyền thống, mà đóng vai trò là một **Hệ sinh thái thông minh** hỗ trợ học viên mọi lúc, mọi nơi.

---

## 🚀 Tầm Nhìn Mô Hình Học Tập Lai (Hybrid AI-Enhanced Era)

### 1. Sự Tiến Hóa Của Nội Dung Truyền Thống

- **Video & Flashcards (Traditional Core):** Không chỉ là xem/nhìn. Video bài giảng được tích hợp AI bóc băng (Subtitles) để học viên có thể bôi đen từ vựng và nhận giải thích ngay lập tức. Flashcards (`micro_card`) được cá nhân hóa hoàn toàn dựa trên những từ học viên hay quên.
- **Quizzes & Exams:** Chuyển đổi từ cơ chế "đợi chấm" sang "Instant Feedback". AI sẽ giải thích tại sao đáp án A đúng, đáp án B sai ngay khi học viên chọn.

### 2. Định Dạng "Microlearning" (Học Siêu Tốc)

- Nội dung được xé nhỏ thành các mẩu kiến thức 1-3 phút. Phù hợp với thói quen tiêu thụ thông tin hiện đại. Vừa xem xong 1 phút video là hệ thống yêu cầu TƯƠNG TÁC NGAY qua các Micro-cards để ghi nhớ sâu.

### 3. Thực Hành Mô Phỏng Với AI (AI Roleplay & Assignments)

- **Hội thoại đóng vai:** Sau khi học xong ngữ pháp/từ vựng truyền thống, học viên sẽ được "Quăng vào thực tế ảo" với AI. Ví dụ: Đóng vai mặc cả đi chợ, phỏng vấn xin việc bằng ngôn ngữ mục tiêu.
- **Chấm điểm đa phương thức:** Học viên nộp bài nói (Audio) hoặc bài viết, AI sẽ bóc tách từng lỗi phát âm, dùng từ và đưa ra lời phê chi tiết (Granular Feedback).

---

## 🛠 Lộ Trình Kỹ Thuật (Chuyển Đổi Từ Hiện Tại Sang Tương Lai)

{{ ... }}

### Phase 1: Nền Tảng Theo Dõi & "Cởi Trói" Trải Nghiệm (Nền móng bắt buộc)

_Trước khi AI có thể adaptive, nó cần dữ liệu người dùng thật chuẩn. Phase 1 chính là lắp đặt các "cảm biến" để thu thập dữ liệu hành vi đó, đồng thời làm mượt UX._

- **Khắc phục tư duy máy móc:** Sửa lại UI Quiz từ "làm xong hết mới biết điểm" thành "Instant Feedback" (Vuốt/chọn xong biết đúng sai, giải thích luôn tại chỗ) -> Tạo cảm giác gãy gọn, 도pamine.
- **Gamification Kích Thích:** Thêm Streak (chuỗi ngày học liên tục), Progress Bar chạy mượt mà ngay trên thanh điều hướng để tạo thói quen (Hook habit).
- **Video Tracking Chính Xác:** Tự động hóa việc ghi nhận tiến độ thay vì bắt user bấm nút thủ công.

### Phase 2: Schema Migration & Cấu trúc Dữ Liệu Hậu AI (Đã hoàn thành Audit)

_Nâng cấp Database Schema để thoát khỏi lối mòn "Video/Quiz"._

- **Mở rộng `LessonType`:** Thêm `simulation` (Mô phỏng thực tế) và `micro_card` (Học siêu tốc). Thêm trường `aiPrompt` lưu kịch bản.
- **Mở rộng Assessment:** Thêm `AI_EVALUATED_AUDIO` và `AI_EVALUATED_TEXT` vào bảng `PracticeQuestion` để thu bài đa phương thức.
- **Domain-Agnostic AI:** Thêm `Course.aiSettings` để linh hoạt thay đổi Role của AI theo từng môn học (IT, Ngôn ngữ, Kinh doanh).

### Phase 3: Microlearning & Content Transformation

_Chuyển đổi cách hiển thị nội dung_

- **Giao diện "Focus Mode":** Đổi trang Lesson hiện tại thành giao diện tràn viền, vuốt dọc giống TikTok/Duolingo (`LessonType = micro_card`). Mỗi bài học chỉ hiện một khối thông tin rất nhỏ -> Học viên học nhanh, không ngợp.
- **Contextual AI Tutor:** Áp dụng `Course.aiSettings` để tạo một Assistant Widget. Học viên bôi đen bất kỳ đâu trên bài giảng để AI giải thích theo đúng ngữ cảnh môn học.

### Phase 4: The "Hyper-Adaptive" Engine & Experiential Roleplay

_Đưa AI vào điều phối luồng học và mô phỏng thực tế_

- Tích hợp hệ thống "Knowledge Tracing". Nếu user trả lời sai 1 thẻ, AI tự động chèn thêm thẻ tương tự vào bài học ngày mai. Nếu user giỏi, AI tự động cắt bỏ các bài dễ.
- Tích hợp **AI Voice/Chat** (`LessonType = simulation`) dựa trên `aiPrompt` đã lưu ở Phase 2 để tạo các bài học dạng "Mô phỏng tình huống" (Roleplay) thay cho bài quiz giấy truyền thống. Chấm điểm bài nộp bằng `AI_EVALUATED_AUDIO`.

---

## 🎯 Quyết Định Hiện Tại

Tầm nhìn của bạn đã vượt xa một ứng dụng học tập thông thường, nó là một nền tảng **Phát triển năng lực thời đại số**. Nhưng về mặt kỹ thuật, hệ thống của bạn (tính đến trước khi Audit) vẫn đang ở cấu trúc LMS truyền thống.

**Chúng ta vừa hoàn thành Database Audit (Phase 2). Để vươn tới Phase 3 & 4 (AI Adaptive Engine), chúng ta KHÔNG THỂ nhảy cóc bỏ qua Phase 1.** Hệ thống bắt buộc phải có Gamification (Streak), phải tracking được tiến độ (chống duplicate), và phải có nền tảng UI mượt mà (Instant Feedback Quiz) thì mới có "đất" cho AI hoạt động ở các Phase sau.

> [!IMPORTANT]
> Toàn bộ Codebase, Docs và Database đã được nâng cấp kiến trúc để hỗ trợ tầm nhìn này. Xin phép **tiến hành thi công Phase 1 ngay bây giờ** để xây dựng lớp móng vững chắc nhất (UI/UX) cho tòa tháp này!
