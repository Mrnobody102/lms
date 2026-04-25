# Database Migration Runbook (Production)

Tài liệu này hướng dẫn quy trình chuyển đổi và chuẩn hoá việc quản lý Schema Cơ sở dữ liệu (Database) trên Production.

**Mục tiêu cốt lõi**:

- Dừng hoàn toàn việc dùng `prisma db push` trên Production (chỉ dành cho local prototype).
- Chuyển sang sử dụng `prisma migrate deploy`.
- Tạo cơ chế "Baseline" cho bảng hiện có.
- Chuẩn bị phương án rollback/khắc phục sự cố.

---

## 1. Baseline Migration cho Database Hiện Hữu (Production)

Trong trường hợp database production đã được tạo từ trước thông qua lệnh `db push`, các records và tables đã tồn tại. Nếu bạn chạy `prisma migrate deploy` ngay lập tức, Prisma sẽ báo lỗi vì nó sẽ cố gắng tạo lại các bảng đó.

Bạn phải tạo Baseline Migration (đánh dấu migration khởi tạo là ĐÃ CHẠY).

### Bước 1: Xác định Migration Khởi tạo

Chắc chắn rằng trong thư mục `packages/database/prisma/migrations` đã có một bản migration khớp chính xác với state của database hiện có trên Production. Ví dụ: `20260119185654_init`.
_(Nếu chưa có, hãy trỏ DB vào một db trống ảo trên local và chạy `prisma migrate dev --name init`)_.

### Bước 2: Apply Baseline Migration vào Production

Đảm bảo biến môi trường `DATABASE_URL` trong file `.env` (hoặc môi trường chạy CI/CD của bạn) đang trỏ đúng vào CSDL Production.
Sau đó chạy lệnh Prisma Resolve:

```bash
pnpm --filter @repo/database prisma migrate resolve --applied 20260119185654_init
```

> **Lưu ý**: Lệnh này KHÔNG thực thi SQL từ file init, nó chỉ insert một dòng vào bảng `_prisma_migrations` để nói rằng "Migration này coi như đã được apply". Kể từ nay, Prisma lấy snapshot này làm chuẩn.

---

## 2. Quy Trình Cập Nhật Schema Hằng Ngày

Khi bạn cần thêm cột / bảng mới trong tương lai.

### Ở Local/Dev (Quá trình Code)

Thay đổi file `schema.prisma`. Chạy lệnh sau để tạo file migration và apply thử ở Local:

```bash
pnpm --filter @repo/database prisma migrate dev --name them_cot_x
```

Hãy commit luôn file `..._them_cot_x/migration.sql` mới sinh lên Git.

### Ở Production (Quá trình Deploy)

Trong CD Pipeline hoặc CI/CD script, chạy duy nhất lệnh:

```bash
pnpm --filter @repo/database db:deploy
```

(Lệnh này gọi trực tiếp `prisma migrate deploy` dưới hook của module database).

---

## 3. Rollback/Troubleshooting & Runbook Xử Lý Sự Cố

### Cảnh báo trước khi Deploy

**Luôn tạo Snapshot/Backup Database trước khi chạy `migrate deploy`**.

- Với các nền tảng AWS RDS / Supabase / Vercel Postgres: Chủ động trigger manual backup/snapshot.
- Với Self-hosted: Chạy `pg_dump`:
  ```bash
  pg_dump -U username -h hostname dsdb_name > dsdb_backup_pre_deploy.sql
  ```

### Sự Cố 1: Migration bị thất bại (Failed/Interrupted)

Prisma sẽ bôi đỏ (failed state) trong bảng `_prisma_migrations` nếu một migration bị ngắt (do rớt mạng, cú pháp tuỳ chỉnh schema lõm).
**Cách khắc phục**:

1. Đọc Logs để biết cụ thể lỗi ở dòng nào. Bỏ qua fix nhanh trực tiếp trong DBeaver/PgAdmin nếu an toàn.
2. Chạy lệnh đánh dấu rolled-back và thử lại:
   ```bash
   pnpm --filter @repo/database prisma migrate resolve --rolled-back <migration_name_bi_loi>
   ```

### Sự Cố 2: Dữ liệu bị hỏng hoàn toàn (Cần Rollback Toàn Bộ)

Database đã bị drop table hoặc làm mất integrity không thể nối lại bằng migration mới.
**Cách khắc phục**:

1. Xoá DB hiện tại hoặc Drop all tables.
2. Restore từ snapshot đã backup:
   ```bash
   psql -U username -h hostname dsdb_name < dsdb_backup_pre_deploy.sql
   ```
3. Khởi động lại service API, đảm bảo code được lật lại commit / docker tag trùng khớp với snapshot database.

> [!CAUTION]
> Chức năng `prisma db push` hay `prisma migrate reset` có thể drop schema dẫn tới việc bốc hơi dữ liệu. Không bao giờ cấu hình hay gõ tay những lệnh này vào trong Terminal / CI liên kết với Production DB. Lệnh hợp lệ duy nhất là `db:deploy` (`prisma migrate deploy`).
