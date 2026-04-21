# Quick Start

Cập nhật lần cuối: 2026-04-21

## Yêu cầu

- Node.js 18+
- pnpm 9+
- Docker

## Khởi động dự án

### 1. Cài dependency

```bash
pnpm install
```

### 2. Chạy database

```bash
pnpm db:up
```

### 3. Chạy migration

```bash
pnpm db:migrate
```

### 4. Seed dữ liệu mẫu

```bash
pnpm db:seed
```

### 5. Chạy app ở chế độ dev

```bash
pnpm dev
```

Hoặc chạy riêng từng app:

```bash
pnpm --filter api-server dev
pnpm --filter web-student dev
pnpm --filter web-admin dev
pnpm --filter super-portal dev
```

## Địa chỉ mặc định

| App          | URL                              |
| ------------ | -------------------------------- |
| Web Student  | `http://localhost:3000`          |
| Web Admin    | `http://localhost:3001`          |
| Super Portal | `http://localhost:3002`          |
| API          | `http://localhost:4000/api`      |
| Swagger      | `http://localhost:4000/api/docs` |

## Kiểm tra nhanh API

```bash
curl http://localhost:4000/api
```

## Auth flow hiện tại

Browser flow hiện tại là cookie-first:

- Đăng nhập thành công sẽ được set cookie `access_token`
- Frontend không cần lưu JWT trong `localStorage`
- Muốn test bằng terminal thì nên dùng cookie jar

## Quick test với cookie session

### 1. Đăng nhập và lưu cookie

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -c cookies.txt \
  -d '{
    "email": "admin@lms.com",
    "password": "admin123"
  }'
```

### 2. Gọi profile bằng cookie

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -b cookies.txt
```

### 3. Đăng xuất

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

## Biến môi trường chính

| Biến           | Ý nghĩa                         |
| -------------- | ------------------------------- |
| `DATABASE_URL` | Kết nối PostgreSQL              |
| `JWT_SECRET`   | Secret để ký JWT                |
| `PORT`         | Port API server                 |
| `NODE_ENV`     | `development` hoặc `production` |
| `CORS_ORIGINS` | Danh sách origin được phép      |

## Scripts thường dùng

| Lệnh              | Mục đích                    |
| ----------------- | --------------------------- |
| `pnpm dev`        | Chạy toàn bộ app ở dev mode |
| `pnpm build`      | Build workspace             |
| `pnpm test`       | Chạy test                   |
| `pnpm test:e2e`   | Chạy E2E test               |
| `pnpm db:up`      | Bật database                |
| `pnpm db:down`    | Tắt database                |
| `pnpm db:migrate` | Chạy migration              |
| `pnpm db:seed`    | Seed dữ liệu mẫu            |
| `pnpm db:studio`  | Mở Prisma Studio            |
