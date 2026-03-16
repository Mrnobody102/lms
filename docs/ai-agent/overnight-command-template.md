# 🌙 Overnight Agent Operational Command (Template 2026)

## Hướng Dẫn Kích Hoạt Chế Độ Vận Hành Tự Chủ

Sử dụng mẫu này để ra lệnh cho các Agent như **OpenClaw**, **OpenHands**, hoặc **Claude-Code** thực hiện công việc xuyên đêm cho dự án LMS Platform.

### 1. Câu Lệnh Kích Hoạt (System Prompt/Command)

> "Chào Agent, tôi chuẩn bị đi ngủ. Từ giờ đến 8h sáng mai, hãy đóng vai trò là một **Senior Backend Engineer** để xử lý các tác vụ sau:
>
> 1. **Mục tiêu**: Đọc các hạng mục còn trống trong [task.md](file:///d:/WorkSpace/Projects/lms/lms-platform/brain/task.md) thuộc Phase [X].
> 2. **Kiến thức**: Hãy rà soát [ai-agent-architecture.md](file:///d:/WorkSpace/Projects/lms/lms-platform/docs/ai-agent-architecture.md) để hiểu tri thức chuyên gia chúng tôi đang áp dụng.
> 3. **Quy tắc Vàng**:
>    - Sau mỗi file thay đổi, PHẢI chạy `validate-ai-work.ps1`.
>    - Nếu lỗi Build/Test, hãy tự đọc logs và sửa lỗi cho đến khi pass. Không được dừng lại trừ khi không thể giải quyết được sau 5 lần thử.
> 4. **Báo cáo**: Sáng mai, hãy để lại một file `MORNING_REPORT.md` tại thư mục docs, tóm tắt:
>    - Những gì bạn ĐÃ hoàn thành.
>    - Những lỗi bạn ĐÃ tự chữa (Self-healed).
>    - Những gì bạn CẦN tôi phê duyệt hoặc giải đáp.
>
> Chúc bạn một đêm làm việc năng suất. Hẹn gặp lại vào buổi sáng!"

### 2. Cấu Hình Môi Trường (Recommended Settings)

- **Worker Session**: Đảm bảo bật tính năng `Persistent Session` trong cấu hình Agent.
- **Auto-Approval**: Bật `auto-approve: true` cho các lệnh đọc file và chạy linter để AI không phải chờ bạn nhấn Enter.
- **Safety**: Giới hạn AI trong thư mục dự án `lms-platform` và không cho phép lệnh xóa Database (`drop database`).

---

_Mẫu lệnh này được thiết kế để tối ưu hóa sự phối hợp Người-Máy theo chuẩn Agentic 2026._
