# Roadmap AI Agent - LMS Platform (Giai đoạn II: Dev Support)

Theo định hướng AI chỉ hỗ trợ **phát triển sản phẩm (Developer Productivity)**, đây là lộ trình nâng cấp hệ thống AI trở thành trợ lý lập trình chuyên sâu cho dự án LMS.

## 1. Ưu tiên cao: Code & Data Introspection (Soi mã nguồn & Dữ liệu)

Giúp AI Agent "thấu hiểu" hệ thống để hỗ trợ dev nhanh hơn:

- **Advanced Project Inspector**: Nâng cấp `inspect_project` để AI có thể đọc nội dung file, phân tích imports và tìm kiếm symbols (Class/Function) trong toàn monorepo.
- **DB Schema Insight**: Tool `describe_db_schema` để AI đọc trực tiếp schema của Prisma, giúp Dev hỏi AI về cấu trúc bảng mà không cần mở file `.prisma`.
- **Environment Checker**: Tool kiểm tra trạng thái các dịch vụ (Docker, DB, Redis) để hỗ trợ troubleshooting môi trường dev.

## 2. Ưu tiên trung bình: Automate Testing & Quality (Tự động hóa kiểm thử)

- **Log Monitoring Tool**: Cho phép AI truy cập vào logs của `api-server` thời gian thực để phân tích lỗi và đề xuất code fix ngay lập tức.
- **Test Runner Assistant**: Tool giúp AI tự chạy các lệnh `pnpm test` cho một module cụ thể và giải thích nguyên nhân fail nếu có.
- **API Playground Assistant**: AI có thể tự gọi các API nội bộ (test helper) để kiểm tra flow nghiệp vụ cho Dev.

## 3. Ưu tiên dài hạn: Documentation & DevOps (Tài liệu & Vận hành)

- **Auto-Documenter**: Tool giúp AI tự quét code và cập nhật lại các file `markdown` trong thư mục `docs/`.
- **Boilerplate Generator**: Tool tạo nhanh các file DTO, Service, Module theo chuẩn của dự án thông qua command của AI.

---

### Đánh giá Commit trước:

Việc lỡ tay commit `course_search` (vốn hơi giống nghiệp vụ) thực ra vẫn **rất hữu ích cho Dev**. Nó đóng vai trò như một **Data Verification Tool** - giúp AI kiểm tra xem data model có đang hoạt động đúng không. Tuy nhiên, chúng ta sẽ dần chuyển hướng các Tool này sang mục đích phục vụ kỹ thuật thay vì kinh doanh.
