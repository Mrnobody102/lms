# Tính Năng Sản Phẩm: Nền Tảng LMS Đa Năng (Multi-tenant)

Định hướng sản phẩm: **Nền tảng đào tạo trực tuyến đa người thuê (Multi-tenant)**. Hệ thống cung cấp hạ tầng chung để **nhiều trung tâm giáo dục khác nhau** (Tiếng Anh, Tiếng Trung, Lập trình, Kỹ năng mềm...) có thể khởi tạo và vận hành website đào tạo riêng biệt.

_Ví dụ áp dụng: Một trung tâm tiếng Trung (site mẫu) có thể sử dụng các tính năng chuyên sâu như Flashcard, Luyện viết, Pinyin._

## Mục Lục

- [1. ACTOR: Visitor / Guest (Của từng Tenant)](#1-actor-visitor--guest-của-từng-tenant)
- [2. ACTOR: User (Học viên)](#2-actor-user-học-viên)
- [3. ACTOR: Instructor / Center Admin (Tenant Owner)](#3-actor-instructor--center-admin-tenant-owner)
- [4. ACTOR: Super Admin (Platform Owner - BẠN)](#4-actor-super-admin-platform-owner---bạn)

## 1. ACTOR: Visitor / Guest (Của từng Tenant)

**Mục tiêu**: Tìm hiểu và mua khóa học trên site của Trung tâm cụ thể.
**App**: `apps/web-student` (Dynamic Branding theo Tenant)

| Tính năng               | Chi tiết                                                         | Loại Trung tâm |
| :---------------------- | :--------------------------------------------------------------- | :------------- |
| **Landing Page Động**   | Giao diện, Logo, Màu sắc thay đổi theo cấu hình của từng Tenant. | Tất cả         |
| **Catalog Khóa học**    | Danh sách khóa học, bộ lọc (theo Level, Chủ đề).                 | Tất cả         |
| **Học thử (Preview)**   | Trải nghiệm bài học miễn phí (Video, Quiz, Flashcard).           | Tất cả         |
| **Đăng ký / Đăng nhập** | SSO, Email (Dữ liệu users được cô lập hoặc share tùy cấu hình).  | Tất cả         |

## 2. ACTOR: User (Học viên)

**Mục tiêu**: Học tập đa định dạng.
**App**: `apps/web-student`

| Tính năng           | Chi tiết                                                                              | Loại Trung tâm             |
| :------------------ | :------------------------------------------------------------------------------------ | :------------------------- |
| **Bài giảng Video** | Video streaming, đánh dấu điểm dừng, tốc độ phát.                                     | Tất cả                     |
| **Module Ngôn ngữ** | - Audio Player kèm Script<br>- Flashcard (Lật thẻ)<br>- Bài tập điền từ / sắp xếp câu | Ngoại ngữ (Anh/Trung/Nhật) |
| **Module Code**     | - Trình biên soạn code (Monaco Editor)<br>- Chấm bài tự động                          | Lập trình                  |
| **Quiz Engine**     | Trắc nghiệm, Điền khuyết, Kéo thả, Matching.                                          | Tất cả                     |
| **Tiến độ học tập** | % hoàn thành, Streak (chuỗi ngày học), Badges.                                        | Tất cả                     |

## 3. ACTOR: Instructor / Center Admin (Tenant Owner)

**Mục tiêu**: Quản lý trung tâm riêng của mình.
**App**: `apps/web-admin`

| Tính năng            | Chi tiết                                                                                                  |
| :------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Site Builder**     | Tùy chỉnh giao diện Landing page, Menu, Footer không cần code.                                            |
| **Course Manager**   | Tạo khóa học, cấu trúc chương (Chapter/Lesson). Hỗ trợ nhiều loại bài học (Video, Text, Quiz, Flashcard). |
| **Học viên**         | Xem danh sách học viên đăng ký tại trung tâm mình, cấp quyền truy cập thủ công.                           |
| **Báo cáo (Report)** | Doanh thu, Traffic, Tỷ lệ hoàn thành khóa học của trung tâm.                                              |

## 4. ACTOR: Super Admin (Platform Owner - BẠN)

**Mục tiêu**: Kinh doanh nền tảng (SaaS).
**App**: `apps/super-portal`

| Tính năng                 | Chi tiết                                                                                  |
| :------------------------ | :---------------------------------------------------------------------------------------- |
| **Tenant Management**     | Tạo site mới cho khách hàng (vd: `trungtam-a.lms.com`), thiết lập tên miền riêng.         |
| **Gói dịch vụ (Billing)** | Quản lý các gói thuê bao (Basic, Pro, Enterprise) giới hạn số lượng học viên/dung lượng.  |
| **Module Marketplace**    | Bật/tắt các module tính năng (vd: Module Tiếng Trung, Module E-commerce) cho từng tenant. |

---

_Chú thích:_

- Hệ thống hỗ trợ "Plugin" hoặc "Module" hóa các tính năng chuyên sâu.
- Ví dụ: Tính năng "Viết chữ Hán" chỉ được bật cho các Tenant đăng ký gói "Language Pack".
