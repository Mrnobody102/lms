# Hướng Dẫn Triển Khai (Deployment Guide)

Tài liệu này hướng dẫn chi tiết cách triển khai hệ thống LMS Platform trên môi trường Local (Dev) và Production.

## 1. Môi trường Local (Development)

### Yêu cầu tiên quyết

- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- Docker Desktop (đang chạy)

### Các bước chạy

1.  **Cài đặt thư viện**:
    ```bash
    pnpm install
    ```
2.  **Khởi tạo Database & Redis**:
    - Đảm bảo Docker Desktop đã bật.
    - Chạy lệnh:
      ```bash
      docker-compose up -d
      ```
    - _Lỗi thường gặp_: Nếu gặp lỗi `pipe/dockerDesktopLinuxEngine`, hãy kiểm tra xem Docker Desktop đã được bật chưa.
3.  **Tạo Schema Database**:
    ```bash
    pnpm db:push
    ```
4.  **Chạy ứng dụng**:
    ```bash
    pnpm dev
    ```

## 2. Môi trường Production

Chúng ta sử dụng chiến lược triển khai lai (Hybrid):

- **Frontend** (`apps/web-*`): Deploy lên **Vercel** (Tối ưu cho Next.js).
- **Backend** (`apps/api-server`) & **Database**: Deploy lên **VPS** (Ubuntu) dùng Docker.

### A. Deploy Frontend (Vercel)

1.  Kết nối GitHub repo với Vercel.
2.  Cấu hình **Root Directory** cho từng project:
    - Web Student: `apps/web-student`
    - Web Admin: `apps/web-admin`
    - Super Portal: `apps/super-portal`
3.  Cấu hình Environment Variables (trên Vercel):
    - `NEXT_PUBLIC_API_URL`: URL của Backend (ví dụ: `https://api.lms.com`)

### B. Deploy Backend & DB (VPS with Docker)

1.  **Chuẩn bị VPS**: Cài đặt Docker & Docker Compose.
2.  **Build Docker Image**:
    Trong `apps/api-server`, tạo `Dockerfile` (optimized build với Turborepo).
3.  **Setup Database**:
    Nên sử dụng Managed Database (như AWS RDS hoặc Supabase) để an toàn dữ liệu, thay vì tự host DB trên VPS nếu không có kinh nghiệm quản trị.
4.  **Chạy Backend**:
    Sử dụng `docker-compose.prod.yml` để chạy container API Server.

## 3. Environment Variables (Checklist)

Đảm bảo các biến sau được cấu hình trong `.env` (Local) hoặc Secret Manager (Prod):

| Biến                  | Mô tả                         |
| --------------------- | ----------------------------- |
| `DATABASE_URL`        | Chuỗi kết nối PostgreSQL      |
| `REDIS_URL`           | Chuỗi kết nối Redis           |
| `JWT_SECRET`          | Secret key để ký token        |
| `PORT`                | Cổng chạy API (Mặc định 4000) |
| `NEXT_PUBLIC_API_URL` | URL API gọi từ Frontend       |

## 4. Troubleshooting

- **Lỗi kết nối DB**: Kiểm tra port 5432 có bị chặn bởi Firewall không.
- **Lỗi CORS**: Đảm bảo Backend đã allow domain của Frontend.
