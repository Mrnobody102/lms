# Kế Hoạch Triển Khai: Nền Tảng LMS Đa Dụng (SaaS)

Mục tiêu dài hạn: Xây dựng nền tảng SaaS cho phép tạo hàng ngàn website đào tạo chỉ với vài click.

## Mục Lục

- [Giai đoạn 1: Lõi Hệ Thống (Platform Core)](#giai-đoạn-1-lõi-hệ-thống-platform-core---)
- [Giai đoạn 2: Content Management System (Generalized)](#giai-đoạn-2-content-management-system-generalized-)
- [Giai đoạn 3: Các Module Chuyên Biệt (Vertical Features)](#giai-đoạn-3-các-module-chuyên-biệt-vertical-features-)
- [Giai đoạn 4: Thương mại hóa & Scale (SaaS)](#giai-đoạn-4-thương-mại-hóa--scale-saas-)

## Giai đoạn 1: Lõi Hệ Thống (Platform Core) 🟢 -> 🟡

- [x] **Core Monorepo & Multi-tenancy**:
  - Cấu trúc thư mục chuẩn.
  - Tenant Middleware định tuyến theo subdomain.
  - Database Isolation (Shared Schema, Tenant Discriminator).
- [ ] **Tenant Management (Super Portal)**:
  - Flow tạo Tenant mới.
  - Cấu hình Branding cơ bản (Logo, Brand Color).
- [ ] **Auth System**:
  - Đăng nhập tập trung hoặc riêng biệt từng Tenant.

## Giai đoạn 2: Content Management System (Generalized) 🟡

- [ ] **Course Builder Đa năng**:
  - Hệ thống tạo bài học linh hoạt (Lesson Blocks).
  - Block Video (Upload/Embed).
  - Block Rich Text (Soạn thảo văn bản).
  - Block Quiz cơ bản.
- [ ] **Student Learning Space**:
  - Giao diện học tập (LMS Player) chung cho mọi tenant.
  - Sidebar điều hướng bài học.

## Giai đoạn 3: Các Module Chuyên Biệt (Vertical Features) ⚪

Tại giai đoạn này, ta phát triển các tính năng sâu cho từng ngách khách hàng (ví dụ: Trung tâm Tiếng Trung).

- [ ] **Module Ngôn Ngữ (Language Pack)**:
  - Flashcard component (Reusable).
  - Audio Player nâng cao.
  - Bài tập điền từ/sắp xếp câu.
- [ ] **Module Luyện thi (Exam Pack)**:
  - Đồng hồ đếm ngược.
  - Ngân hàng câu hỏi.

## Giai Đoạn 5: Hệ Sinh Thái Mobile (Future)

- **Mục tiêu**: Mở rộng trải nghiệm học tập mọi lúc mọi nơi.
- **Công việc**:
  - Setup dự án React Native (Expo) trong Monorepo (`apps/mobile`).
  - Tích hợp Authentication (Login/Register).
  - Xây dựng màn hình học tập (Video Player, Flashcard cảm ứng).
  - Tính năng Offline Sync (học khi không có mạng).
  - Push Notification (nhắc lịch học).

## Giai đoạn 6: Thương mại hóa & Scale (SaaS) ⚪

- [ ] **Billing System**: Tích hợp thanh toán phí thuê bao tháng cho các Chủ trung tâm.
- [ ] **Custom Domain**: Hỗ trợ gắn tên miền riêng (ví dụ: `hoc.trungtamA.com` thay vì `trungtama.lms.com`).
- [ ] **API Gateway**: Mở API cho các bên thứ 3 tích hợp.
