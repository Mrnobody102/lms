# Hướng Dẫn Database & Migrations

Tài liệu này hướng dẫn cách quản lý Database và Prisma Migration trong dự án **LMS Platform**.

## 1. Tổng quan Công nghệ

- **Database**: PostgreSQL (chạy qua Docker).
- **ORM**: Prisma.
- **Port mặc định**: `5433` (Local, internal 5432).

## 2. Các lệnh quản lý Database

Từ thư mục gốc của dự án, bạn có thể sử dụng các lệnh sau:

| Lệnh              | Mô tả                                                    |
| :---------------- | :------------------------------------------------------- |
| `pnpm db:up`      | Khởi động PostgreSQL và Redis qua Docker.                |
| `pnpm db:down`    | Tắt các dịch vụ database.                                |
| `pnpm db:migrate` | Chạy migration để cập nhật schema.                       |
| `pnpm db:seed`    | Tạo dữ liệu mẫu (tenant demo, accounts).                 |
| `pnpm db:studio`  | Mở giao diện Prisma Studio để xem/sửa dữ liệu.           |
| `pnpm db:push`    | Push schema mà không tạo migration (dùng khi dev nhanh). |

## 3. Quy trình làm việc với Migration

Mỗi khi bạn thay đổi file `packages/database/prisma/schema.prisma`, hãy tuân theo các bước sau:

### Bước 1: Tạo Migration

Chạy lệnh sau để Prisma so sánh schema và tạo file migration mới:

```bash
pnpm db:migrate
```

Hệ thống sẽ yêu cầu bạn nhập tên cho migration. Một thư mục mới sẽ được tạo trong `packages/database/prisma/migrations/`.

### Bước 2: Seed Dữ liệu (nếu cần)

```bash
pnpm db:seed
```

Điều này tạo:

- Tenant demo (`trung-tam-demo`)
- Super Admin account: `admin@lms.com` / `admin123`
- Student account: `student@lms.com` / `admin123`

### Bước 3: Kiểm tra dữ liệu

Sử dụng Prisma Studio để đảm bảo cấu hình mới hoạt động đúng:

```bash
pnpm db:studio
```

## 4. Cấu hình Database

### Local Development

File `docker-compose.yml` ở root đã cấu hình sẵn PostgreSQL và Redis:

- **PostgreSQL**: Port `5433` (host) → `5432` (container)
- **Redis**: Port `6379`
- **Database**: `lms_platform`
- **User**: `postgres`
- **Password**: `password`

### Connection String

```env
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5433/lms_platform?schema=public"
```

## 5. Troubleshooting (Xử lý sự cố)

### Lỗi kết nối (P1001/P1000)

- Kiểm tra Docker đã bật chưa: `docker ps`.
- Kiểm tra port `5433` có bị phần mềm khác chiếm dụng không.
- Đảm bảo file `.env` tại root có chuỗi kết nối đúng.

### Cập nhật Schema mà không tạo Migration (Dev nhanh)

Nếu bạn chỉ muốn thử nghiệm nhanh mà không cần lưu lịch sử migration:

```bash
pnpm db:push
```

_Lưu ý: Không khuyến khích dùng cách này cho production._

## 6. Cấu hình Production

Khi deploy lên môi trường Production, Prisma sẽ sử dụng lệnh:

```bash
pnpm --filter @repo/database run deploy
```

Lệnh này sẽ áp dụng các migration đã có vào database production mà không tạo thêm file mới.

Tham khảo: [Deployment Guide](../ops/deployment.md)
