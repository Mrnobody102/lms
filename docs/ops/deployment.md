# Deployment Guide

Tài liệu này mô tả cách chạy local, cách deploy production, và cách kiểm tra hệ thống sau khi build.

## 1. Local Development

Yêu cầu:

- Node.js 20.19.5
- pnpm 9
- Docker Desktop

Luồng local chuẩn:

```bash
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Lưu ý:

- `docker-compose.yml` local map PostgreSQL ra port `5433` và Redis ra `6379`.
- `NEXT_PUBLIC_TENANT_ID` chỉ là tenant hint cho local/dev.
- `pnpm test:e2e` là browser UI smoke; API thật được kiểm bằng `pnpm smoke:api`.

## 2. Production Strategy

### Topology A. All-in-Docker

Phù hợp khi muốn tự host toàn bộ stack bằng một `docker-compose`:

- `api-server`
- `web-student`
- `web-admin`
- `super-portal`
- `postgres`
- `redis`
- `migrate`

File chính: [`deployment/production/docker-compose.prod.yml`](../../deployment/production/docker-compose.prod.yml)

### Topology B. Frontend host riêng, API host riêng

Phù hợp khi:

- Frontend deploy trên Vercel hoặc hosting Next.js tương đương
- API deploy trên VPS/container platform
- Database và Redis dùng managed service

Nguyên tắc:

- `NEXT_PUBLIC_API_URL` phải là URL browser-reachable
- `CORS_ORIGINS` phải là danh sách origin chính xác, không có path/query
- Tenant production phải resolve từ host/domain, không dựa vào `NEXT_PUBLIC_TENANT_ID`

> [!WARNING]
> **Bảo mật Tenant Isolation**: Khi deploy qua Reverse Proxy (Nginx, AWS ALB, Cloudflare), bắt buộc phải cấu hình xóa bỏ (strip) header `x-tenant-id` từ các request bên ngoài internet gửi vào. Điều này để chống giả mạo tenant. Chỉ cho phép các microservices nội bộ được dùng header này.

### Mẫu domain production

Ví dụ:

- `https://api.example.com`
- `https://student.example.com`
- `https://admin.example.com`
- `https://portal.example.com`

Env tương ứng:

```bash
APP_PUBLIC_URL=https://api.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WEB_STUDENT_URL=https://student.example.com
CORS_ORIGINS=https://student.example.com,https://admin.example.com,https://portal.example.com
AUTH_COOKIE_DOMAIN=.example.com
AUTH_COOKIE_SAME_SITE=lax
TRUST_PROXY=true
ALLOW_TENANT_HEADER_IN_PRODUCTION=false
NEXT_PUBLIC_TENANT_ID=
```

### Env bắt buộc trong production

API server:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `APP_PUBLIC_URL`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_DOMAIN`
- `TRUST_PROXY`
- `ALLOW_TENANT_HEADER_IN_PRODUCTION`

Frontend apps:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WEB_STUDENT_URL` cho `web-admin`
- `NEXT_PUBLIC_TENANT_ID` chỉ dùng local/dev

### Database

Production database changes phải đi qua migration:

```bash
pnpm --filter @repo/database db:deploy
```

Không dùng `db:push` trên production.

## 3. CI/CD

Workflow chính:

1. `fast_checks`: install, generate Prisma client, typecheck, lint, unit tests.
2. `build`: build API, frontend apps, database package.
3. `e2e_chromium`: Playwright UI smoke cho student/admin/super portal với API mock.
4. `api_smoke`: PostgreSQL + Redis service containers, `db:deploy`, kiểm tra API runtime thật.

Docker image validation:

- Workflow riêng: [`.github/workflows/docker-build.yml`](../../.github/workflows/docker-build.yml)
- Dùng cho release candidate hoặc khi sửa Dockerfile / compose production

Smoke sau deploy:

```bash
pnpm smoke:deploy -- -ApiUrl https://api.example.com -WebStudentUrl https://student.example.com -WebAdminUrl https://admin.example.com -SuperPortalUrl https://portal.example.com
```

## 4. Monitoring

| Endpoint                             | Use                                           |
| ------------------------------------ | --------------------------------------------- |
| `GET /api/health/live`               | Liveness probe                                |
| `GET /api/health/ready`              | Readiness probe cho database và Redis         |
| `GET /api/health/metrics`            | In-memory request metrics                     |
| `GET /api/health/metrics/prometheus` | Prometheus text metrics                       |
| `GET /api/health/docs`               | Tài liệu human-readable cho health/monitoring |

Xem thêm [monitoring.md](monitoring.md).

## 5. Troubleshooting

- CORS lỗi: kiểm tra `CORS_ORIGINS` có đúng origin không.
- Cookie auth giữa subdomain: kiểm tra `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAME_SITE`, HTTPS và reverse proxy.
- Tenant mismatch: kiểm tra host/domain thật của tenant và `TRUST_PROXY`.
- API không ready: kiểm tra `DATABASE_URL`, `REDIS_URL`, migration state.
- Build lỗi: chạy `pnpm install --frozen-lockfile`, `pnpm --filter @repo/database generate`, rồi build lại.
