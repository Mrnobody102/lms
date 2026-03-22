# Kế Hoạch Triển Khai: Nền Tảng LMS Đa Dụng (SaaS)

Mục tiêu dài hạn: Xây dựng nền tảng SaaS cho phép tạo hàng ngàn website đào tạo chỉ với vài click.

## Mục Lục

- [Giai đoạn 1: Lõi Hệ Thống (Platform Core)](#giai-đoạn-1-lõi-hệ-thống-platform-core---)
- [Giai đoạn 2: Content Management System (Generalized)](#giai-đoạn-2-content-management-system-generalized-)
- [Giai đoạn 3: Các Module Chuyên Biệt (Vertical Features)](#giai-đoạn-3-các-module-chuyên-biệt-vertical-features-)
- [Giai đoạn 4: Thương mại hóa & Scale (SaaS)](#giai-đoạn-4-thương-mại-hóa--scale-saas-)

## Giai đoạn 1: Lõi Hệ Thống (Platform Core) 🟢

- [x] **Core Monorepo & Multi-tenancy**:
  - Cấu trúc thư mục chuẩn.
  - Tenant Middleware định tuyến theo subdomain.
  - Database Isolation (Shared Schema, Tenant Discriminator).
- [x] **Tenant Management (Super Portal)**: ✅ **COMPLETED** (Feb 26, 2026)
  - ✅ Flow tạo Tenant mới.
  - ✅ Cấu hình Branding cơ bản (Logo, Brand Color).
- [x] **Auth System**: ✅ **COMPLETED** (Jan 21, 2026)
  - ✅ JWT-based authentication với Passport
  - ✅ Register endpoint với validation
  - ✅ Login endpoint với password hashing (bcrypt)
  - ✅ Role-based access control (STUDENT, TEACHER, ADMIN, SUPER_ADMIN)
  - ✅ Tenant isolation middleware
- [x] **User Management**: ✅ **COMPLETED** (Jan 21, 2026)
  - ✅ User profile management (GET/PUT /users/me)
  - ✅ Password change functionality
  - ✅ Admin user management endpoints
  - ✅ User filtering và pagination
  - ✅ Account lock/unlock features

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

---

## 📊 Chi Tiết Triển Khai

### ✅ Giai Đoạn 1 - Hoàn Thành (Jan 21, 2026)

**Auth System & User Management** đã được triển khai đầy đủ:

📁 **Code Structure:**

- `apps/api-server/src/auth/` - Authentication module
- `apps/api-server/src/user/` - User profile module
- `apps/api-server/src/admin/` - Admin management module

📖 **Documentation:**

- [API Documentation](../api-documentation.md) - Complete API reference
- [Quick Start Guide](../quick-start.md) - Setup instructions
- [Project Structure](../../PROJECT_STRUCTURE.md) - Tổng quan dự án

🧪 **Testing:**

- [API Test Collection](../../tests/api-tests.http) - REST Client tests
- [Test Script](../../scripts/test-api.ps1) - PowerShell automation

**Endpoints Deployed:**

- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập với JWT
- `GET /api/users/me` - Xem profile
- `PUT /api/users/me` - Cập nhật profile
- `PUT /api/users/change-password` - Đổi mật khẩu
- `GET /api/admin/users` - Admin quản lý users
- `PATCH /api/admin/users/:id/status` - Khóa/mở tài khoản

### ✅ Giai Đoạn 1.5 - Hoàn Thành (Feb 26, 2026)

**Tenant Management (Super Portal)** đã được thiết lập:

📁 **Code Structure:**

- `apps/api-server/src/admin/admin-tenant.controller.ts` - Controller quản lý Tenant
- `apps/api-server/src/admin/admin.service.ts` - Logic tạo và cập nhật Tenant
- `apps/api-server/src/common/middleware/tenant.middleware.ts` - Trích xuất Token ngầm

**Endpoints Deployed:**

- `POST /api/admin/tenants` - Tạo trung tâm mới (Tenant)
- `GET /api/admin/tenants` - Danh sách các Tenant
- `GET /api/admin/tenants/:id` - Xem thông tin chi tiết một Tenant
- `PUT /api/admin/tenants/:id` - Cập nhật cấu hình & Branding cho Tenant
- `DELETE /api/admin/tenants/:id` - Xóa trung tâm/Tenant

**Frontend Implementation (`apps/super-portal`):**

- Dashboard thống kê hệ thống (Global Stats)
- Auth Store (Global state quản lý JWT và Session với Zustand)
- Màn hình chi tiết Tenant (`/tenants/[id]`) sẵn sàng mở rộng module (Config/Settings)
- Quản lý danh sách Tenant hiện đại với `TanStack Table` (Tự động Phân trang, Tìm kiếm Global Text)
- Tenant Form Modal (Popup xử lý Create/Update Tenant)
- Hệ thống Mocks Data Độc Lập (`tenant.mock.ts`) hỗ trợ test UI dễ dàng
- Tenant Actions Inline (Actions xem, sửa, xóa hiển thị trực quan thay vì dropdown)

- NestJS Middleware Exclude (Bỏ chặn CORS/Tenant ID)
- JWT Token Parsing (Cơ chế Token Fallback)
- Axios & Interceptors (Tự động bắt lỗi 401 xoá token)
- Tailwind CSS & `lucide-react` (Thiết kế giao diện hiện đại Glassmorphism)
- React Server Control (Next.js 15+ App Router, `React.use()` unwrapping)

---

## 🎯 Tiếp Theo

### Priority 1: Course Builder

Hệ thống tạo và quản lý khóa học đa năng (Tạo bài giảng, Video, Quiz).

### Priority 2: Student Learning Space

LMS Player Sidebar, giao diện học viên.
