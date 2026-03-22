# Hướng Dẫn Triển Khai (Deployment Guide)

Tài liệu này hướng dẫn chi tiết cách triển khai hệ thống LMS Platform trên môi trường Local (Dev) và Production.

## 1. Môi trường Local (Development)

### Yêu cầu tiên quyết

- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- Docker Desktop (đang chạy)

### Các bước chạy

1. **Cài đặt thư viện**:
   ```bash
   pnpm install
   ```
2. **Khởi tạo Database & Redis**:
   - Đảm bảo Docker Desktop đã bật.
   - Chạy lệnh:
     ```bash
     pnpm db:up
     ```
   - _Lỗi thường gặp_: Nếu gặp lỗi connection (P1001), hãy kiểm tra Docker Desktop đã được bật chưa.
3. **Tạo Schema Database**:
   ```bash
   pnpm db:migrate
   ```
4. **Tạo dữ liệu mẫu** (tùy chọn):
   ```bash
   pnpm db:seed
   ```
5. **Chạy ứng dụng**:
   ```bash
   pnpm dev
   ```

## 2. Môi trường Production

### Chiến lược Triển khai (Hybrid)

- **Frontend** (`apps/web-*`, `apps/super-portal`): Deploy lên **Vercel** (Tối ưu cho Next.js).
- **Backend** (`apps/api-server`): Deploy lên **VPS** (Ubuntu) dùng Docker.

### A. Deploy Frontend (Vercel)

1. Kết nối GitHub repo với Vercel.
2. Cấu hình **Root Directory** cho từng project:
   - Web Student: `apps/web-student`
   - Web Admin: `apps/web-admin`
   - Super Portal: `apps/super-portal`
3. Cấu hình Environment Variables (trên Vercel):
   - `NEXT_PUBLIC_API_URL`: URL của Backend (ví dụ: `https://api.lms.com`)

### B. Deploy Backend & DB (VPS with Docker)

1. **Chuẩn bị VPS**: Cài đặt Docker & Docker Compose.
2. **Setup Database**: Sử dụng Managed Database (AWS RDS, Supabase hoặc PostgreSQL trên VPS).
3. **Build Docker Image**: Sử dụng `docker-compose.prod.yml` trong `deployment/production/`.
   ```bash
   docker-compose -f deployment/production/docker-compose.prod.yml up -d
   ```
4. **Chạy Migration**:
   ```bash
   pnpm --filter @repo/database run deploy
   ```

## 3. CI/CD (GitHub Actions)

File cấu hình CI/CD nằm tại `.github/workflows/ci.yml`.

Workflow tự động:

1. Kiểm tra lint
2. Build tất cả apps
3. Run unit tests

## 4. Environment Variables (Checklist)

Đảm bảo các biến sau được cấu hình trong `.env` (Local) hoặc Secret Manager (Prod):

| Biến                  | Mô tả                                        |
| --------------------- | -------------------------------------------- |
| `DATABASE_URL`        | Chuỗi kết nối PostgreSQL                     |
| `REDIS_URL`           | Chuỗi kết nối Redis                          |
| `JWT_SECRET`          | Secret key để ký token                       |
| `PORT`                | Cổng chạy API (Mặc định 4000)                |
| `NODE_ENV`            | `development` hoặc `production`              |
| `CORS_ORIGINS`        | Danh sách domain được phép (comma-separated) |
| `NEXT_PUBLIC_API_URL` | URL API gọi từ Frontend                      |

## 5. Troubleshooting

- **Lỗi kết nối DB**: Kiểm tra port 5432 có bị chặn bởi Firewall không.
- **Lỗi CORS**: Đảm bảo Backend đã allow domain của Frontend trong `CORS_ORIGINS`.
- **Lỗi build**: Chạy `pnpm install` rồi `pnpm build` lại từ root.
