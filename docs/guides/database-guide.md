# Database & Migrations Guide

Tài liệu này hướng dẫn cách quản lý Database và Prisma Migration trong dự án **LMS Platform**.

## 1. Tổng quan Công nghệ

- **Database**: PostgreSQL (chạy qua Docker).
- **ORM**: Prisma (v5.22.0).
- **Port mặc định**: `5433` (Local).

## 2. Các lệnh quản lý Database (Root)

Từ thư mục gốc của dự án, bạn có thể sử dụng các lệnh sau:

| Lệnh              | Mô tả                                             |
| :---------------- | :------------------------------------------------ |
| `pnpm db:up`      | Khởi động PostgreSQL và Redis qua Docker.         |
| `pnpm db:down`    | Tắt các dịch vụ database.                         |
| `pnpm db:migrate` | Chạy migration để cập nhật schema (Dùng khi dev). |
| `pnpm db:studio`  | Mở giao diện Prisma Studio để xem/sửa dữ liệu.    |

## 3. Quy trình làm việc với Migration

Mỗi khi bạn thay đổi file `packages/database/prisma/schema.prisma`, hãy tuân theo các bước sau:

### Bước 1: Tạo Migration (Development)

Chạy lệnh sau để Prisma so sánh schema và tạo file migration mới:

```bash
pnpm db:migrate
```

Hệ thống sẽ yêu cầu bạn nhập tên cho migration (ví dụ: `add-user-avatar`). Một thư mục mới sẽ được tạo trong `packages/database/prisma/migrations/`.

### Bước 2: Kiểm tra dữ liệu

Sử dụng Prisma Studio để đảm bảo cấu hình mới hoạt động đúng:

```bash
pnpm db:studio
```

## 4. Troubleshooting (Xử lý sự cố)

### Lỗi kết nối (P1001/P1000)

- Kiểm tra Docker đã bật chưa: `docker ps`.
- Kiểm tra port `5433` có bị phần mềm khác chiếm dụng không.
- Đảm bảo file `.env` tại root có chuỗi kết nối đúng:
  `DATABASE_URL="postgresql://postgres:password@127.0.0.1:5433/lms_platform?schema=public"`

### Cập nhật Schema mà không tạo Migration (Làm nháp)

Nếu bạn chỉ muốn thử nghiệm nhanh mà không cần lưu lịch sử migration:

```bash
pnpm db:push
```

_Lưu ý: Không khuyến khích dùng cách này cho production._

## 5. Cấu hình Production

Khi deploy lên môi trường Production, Prisma sẽ sử dụng lệnh:

```bash
pnpm db:deploy
```

Lệnh này sẽ áp dụng các migration đã có vào database production mà không tạo thêm file mới.
