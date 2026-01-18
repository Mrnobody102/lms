# LMS Platform - Nền Tảng Giáo Dục Đa Người Thuê (Multi-tenant SaaS)

Chào mừng bạn đến với **LMS Platform**, một giải pháp **SaaS (Software-as-a-Service)** cho phép triển khai hàng loạt các website đào tạo trực tuyến.

Dự án được thiết kế để phục vụ **đa dạng mô hình giáo dục**, từ trung tâm ngoại ngữ (Tiếng Anh, Trung, Nhật...), trung tâm kỹ năng mềm, đến các trường học online.

## Mục Lục

- [Tầm Nhìn Sản Phẩm](#-tầm-nhìn-sản-phẩm)
- [Các Ứng Dụng (Apps)](#-các-ứng-dụng-apps)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Tài liệu Dự án](#-tài-liệu-dự-án)
- [Cài đặt](#-cài-đặt)

## 🎯 Tầm Nhìn Sản Phẩm

Xây dựng một "Shopify cho Giáo Dục". Bạn là người sở hữu nền tảng (Platform Owner), và khách hàng của bạn là các Chủ trung tâm giáo dục. Họ thuê nền tảng của bạn để tạo website dạy học riêng cho họ.

- **Multi-tenant**: Mỗi trung tâm có dữ liệu, giao diện, và học viên riêng biệt.
- **Scalable**: Một source code duy nhất phục vụ hàng ngàn trung tâm.
- **Modular**: Các tính năng chuyên sâu (như Luyện viết chữ Hán, Code Editor) được thiết kế dạng module, có thể bật/tắt tùy nhu cầu của từng trung tâm.

## � Các Ứng Dụng (Apps)

Hệ thống bao gồm 4 ứng dụng chính trong Monorepo:

1.  **`super-portal` (Super Admin)**: Dành cho BẠN. Nơi quản lý toàn bộ hệ thống, tạo tenant mới, thu phí dịch vụ.
2.  **`web-admin` (Center Admin)**: Dành cho KHÁCH HÀNG (Chủ trung tâm). Nơi họ upload khóa học, quản lý học viên của riêng họ.
3.  **`web-student` (Learning App)**: Dành cho HỌC VIÊN. Giao diện học tập, tự động thay đổi logo/màu sắc theo trung tâm mà họ đang truy cập.
4.  **`api-server`**: Backend trung tâm xử lý logic cho toàn bộ hệ thống.

## 🛠 Tính Năng Nổi Bật

- **Dynamic Branding**: Giao diện White-label, tự động thích ứng theo thương hiệu của Tenant.
- **Flexible Content**: Hỗ trợ Video, Text, Quiz, Flashcard... phù hợp nhiều loại hình đào tạo.
- **High Performance**: Sử dụng Next.js & NestJS tối ưu hóa cho tải cao.

## � Tài liệu Dự án

- [Tổng quan Kiến trúc (Architecture)](./docs/ARCHITECTURE.md)
- [Danh sách Tính năng (Features)](./docs/FEATURES.md)
- [Kế hoạch Phát triển (Plan)](./docs/PLAN.md)

## 🏁 Cài đặt

1.  **Cài đặt Dependencies**: `pnpm install`
2.  **Khởi tạo Infrastructure** (DB & Redis): `docker-compose up -d`
3.  **Đồng bộ Database**: `pnpm db:push`
4.  **Chạy Dev**: `pnpm dev`
    - Super Portal: `http://localhost:3002`
    - Web Admin/Student: `http://localhost:3000` (Truy cập qua subdomain ảo, vd: `tenant1.localhost:3000`)
