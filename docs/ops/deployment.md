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

Compose production hiện có Caddy edge layer:

- Caddy là service duy nhất expose public port `80/443`.
- API và các Next.js app chỉ dùng `expose` trong Docker network nội bộ.
- Caddy route theo host tới `api`, `web-student`, `web-admin`, `web-sales`, và `super-portal`.
- Caddy strip `x-tenant-id` trước khi proxy vào API để chống tenant spoofing từ internet.
- `TRUST_PROXY=true` là default production khi chạy qua Caddy.

Edge/reverse proxy bắt buộc chịu trách nhiệm:

- TLS/HTTPS và redirect HTTP -> HTTPS.
- Route host/domain tới đúng service: API, student, admin, sales, super portal.
- Set `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-For` chính xác và chỉ bật `TRUST_PROXY=true` khi proxy đáng tin cậy.
- Strip `x-tenant-id` từ request public internet; chỉ edge/service nội bộ được inject header tenant nếu deployment chủ động tin cậy.
- Cấu hình upload body size, read/write timeout cho video/audio/PDF.
- Rate limit/WAF ở edge cho auth, upload, AI/provider-backed endpoints và public catalog.
- Không expose trực tiếp app/container ports ra internet ngoại trừ qua edge đã bảo vệ.

Production host env tối thiểu:

```bash
API_HOST=api.example.com
STUDENT_HOST=student.example.com
ADMIN_HOST=admin.example.com
PORTAL_HOST=portal.example.com
COURSES_HOST=courses.example.com
CADDY_ACME_EMAIL=ops@example.com
CADDY_MAX_BODY_SIZE=500MB
```

### Topology B. Frontend host riêng, API host riêng

Phù hợp khi:

- Frontend deploy trên Vercel hoặc hosting Next.js tương đương
- API deploy trên VPS/container platform
- Database và Redis dùng managed service

Nguyên tắc:

- `NEXT_PUBLIC_API_URL` phải là API origin browser-reachable, ví dụ `https://api.example.com`; nếu lỡ cấu hình kèm `/api` thì build sẽ normalize về origin.
- `CORS_ORIGINS` phải là danh sách origin chính xác, không có path/query
- Tenant production mặc định phải resolve từ host/domain, không dựa vào tenant hint từ frontend.
- Với mô hình frontend managed hosting như Vercel và API riêng như Render, nếu chưa có tenant custom domain, có thể bật tenant hint production có kiểm soát: frontend set `NEXT_PUBLIC_TENANT_ID`, API set `ALLOW_TENANT_HEADER_IN_PRODUCTION=true`, và `CORS_ORIGINS` chỉ chứa exact frontend origins được tin cậy.

> [!WARNING]
> **Bảo mật Tenant Isolation**: Khi deploy qua Reverse Proxy (Nginx, AWS ALB, Cloudflare), bắt buộc phải cấu hình xóa bỏ (strip) header `x-tenant-id` từ các request bên ngoài internet gửi vào. Nếu chủ động dùng tenant hint production cho Vercel/Render, chỉ bật với `ALLOW_TENANT_HEADER_IN_PRODUCTION=true` khi `CORS_ORIGINS` là exact allowlist và không dùng wildcard.

### Mẫu domain production

Ví dụ:

- `https://api.example.com`
- `https://student.example.com`
- `https://admin.example.com`
- `https://portal.example.com`
- `https://courses.example.com`

Env tương ứng:

```bash
DEPLOYMENT_TOPOLOGY=docker
APP_PUBLIC_URL=https://api.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WEB_STUDENT_URL=https://student.example.com
NEXT_PUBLIC_WEB_SALES_URL=https://courses.example.com
CORS_ORIGINS=https://student.example.com,https://admin.example.com,https://portal.example.com,https://courses.example.com
AUTH_COOKIE_DOMAIN=.example.com
AUTH_COOKIE_SAME_SITE=lax
TRUST_PROXY=true
ALLOW_TENANT_HEADER_IN_PRODUCTION=false
NEXT_PUBLIC_TENANT_ID=
```

### Mẫu Vercel + Render + Supabase

Phù hợp khi dùng Vercel cho `web-student`/`web-admin`, Render cho `api-server`, và Supabase PostgreSQL.

Vercel frontend env:

```bash
DEPLOYMENT_TOPOLOGY=vercel-render
NEXT_PUBLIC_API_URL=https://lms-api.onrender.com
NEXT_PUBLIC_TENANT_ID=<tenant-id-or-slug>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-web-client-id>
```

Render API env:

```bash
DEPLOYMENT_TOPOLOGY=vercel-render
APP_PUBLIC_URL=https://lms-api.onrender.com
NEXT_PUBLIC_API_URL=https://lms-api.onrender.com
NEXT_PUBLIC_WEB_STUDENT_URL=https://lms-student.vercel.app
NEXT_PUBLIC_WEB_SALES_URL=https://lms-courses.vercel.app
CORS_ORIGINS=https://lms-student.vercel.app,https://lms-admin.vercel.app,https://lms-courses.vercel.app
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAME_SITE=lax
TRUST_PROXY=true
ALLOW_TENANT_HEADER_IN_PRODUCTION=true
GOOGLE_CLIENT_ID=<google-web-client-id>
GOOGLE_VERIFY_TIMEOUT_MS=10000
```

Lưu ý:

- Để `AUTH_COOKIE_DOMAIN` rỗng khi browser gọi cùng origin qua Next `/api` proxy trên Vercel. Không set cookie domain thành Render domain hoặc `.vercel.app`.
- Google OAuth Console phải có exact JavaScript origins của Vercel, ví dụ `https://lms-student.vercel.app`; không thêm path `/api` hay `/login`.
- `CORS_ORIGINS` trên Render phải khớp exact origin Vercel. Không dùng `*` khi auth dùng cookie.
- Nếu đã có custom tenant domains, ưu tiên resolve tenant từ domain và đặt `ALLOW_TENANT_HEADER_IN_PRODUCTION=false`.
- Chạy preflight bằng env production thật trước khi deploy/redeploy:

```bash
pnpm run check:production-env -- --file .env.production
```

### Env bắt buộc trong production

Template chuẩn: [`.env.production.example`](../../.env.production.example)

API server:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_RESET_SECRET`
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
- `NEXT_PUBLIC_WEB_SALES_URL` cho `web-student`
- `NEXT_PUBLIC_TENANT_ID` chỉ dùng local/dev

Edge/monitoring:

- `API_HOST`
- `STUDENT_HOST`
- `ADMIN_HOST`
- `PORTAL_HOST`
- `COURSES_HOST`
- `CADDY_ACME_EMAIL`
- `ALERTMANAGER_WEBHOOK_URL`

### Database

Production database changes phải đi qua migration:

```bash
pnpm --filter @repo/database db:deploy
```

Không dùng `db:push` trên production.

### Production scale checklist

Trước launch production:

- `pnpm run check:production-env -- --file .env.production` pass với secret thật trong secret manager/platform env.
- `docker compose -f deployment/production/docker-compose.prod.yml config --quiet` pass.
- Staging deploy chạy migration bằng `db:deploy`, không dùng `db:push`.
- Smoke API và portal login/routes chạy trên URL staging/public thật.
- PostgreSQL có backup tự động, retention, và restore drill đã thử.
- Object storage/media có backup hoặc durability policy rõ ràng.
- Redis/queue recovery stance rõ: dữ liệu nào được phép mất, dữ liệu nào cần replay/idempotency.
- Metrics/alerts có receiver thật, không để Alertmanager receiver rỗng.
- Log shipping hoặc platform logs có request-id correlation.
- Public internet chỉ thấy Caddy `80/443`; app ports không mở trực tiếp.
- Spoof request có `x-tenant-id` từ internet không thay đổi tenant context.

Trước khi nhắm 10k-100k users:

- Có baseline load test cho auth, course list/detail, lesson/progress, practice/exam submit, reporting và public catalog.
- API scale ngang sau proxy/load balancer; database connection pool không bão hòa.
- Các list/report lớn có pagination/cursor/bounds và query plan/index review.
- Worker queue có backlog alerts và có thể scale process/container.
- Media/video/audio đi qua object storage/CDN thay vì API process làm bottleneck.

Trước khi nhắm 100k-1M+ users:

- Dùng managed HA PostgreSQL/Redis hoặc kiến trúc HA tương đương.
- Tách analytics/reporting read model hoặc read replicas cho query nặng.
- Có canary/blue-green deploy và rollback evidence.
- Có SLO/error budget, incident process, on-call/alert escalation.
- Có DR plan với RPO/RTO rõ ràng và restore drill định kỳ.

## 3. CI/CD

Workflow chính:

1. `fast_checks`: install, generate Prisma client, typecheck, lint, unit tests.
2. `build`: build API, frontend apps, database package.
3. `e2e_chromium`: Playwright UI smoke cho student/admin/super portal với API mock.
4. `api_smoke`: PostgreSQL + Redis service containers, `db:deploy`, kiểm tra API runtime thật.

Docker image validation:

- Workflow riêng: [`.github/workflows/docker-build.yml`](../../.github/workflows/docker-build.yml)
- Dùng cho release candidate hoặc khi sửa Dockerfile / compose production
- Workflow này validate production env preflight, compose config, và build image cho `api`, `migrate`, `web-student`, `web-admin`, `web-sales`, `super-portal`.

Smoke sau deploy:

```bash
pnpm smoke:deploy -- -ApiUrl https://api.example.com -WebStudentUrl https://student.example.com -WebAdminUrl https://admin.example.com -SuperPortalUrl https://portal.example.com
```

Smoke auth production thật:

```bash
AUTH_SMOKE_WEB_URL=https://student.example.com \
AUTH_SMOKE_API_URL=https://api.example.com \
AUTH_SMOKE_TENANT_ID=<tenant-id-or-slug> \
AUTH_SMOKE_EMAIL=<student-test-email> \
AUTH_SMOKE_PASSWORD='<student-test-password>' \
pnpm run smoke:auth-production
```

Script này kiểm:

- frontend login page public
- Vercel/Next `/api` proxy login -> cookie -> `/users/me`
- Render API direct CORS preflight từ frontend origin
- `Set-Cookie` có `access_token`, `refresh_token`, `csrf_token`, `HttpOnly`, `SameSite`, và `Secure` khi chạy HTTPS
- response wrapper `{ success, data, timestamp }`

Production gate đầy đủ trước release candidate:

```bash
pnpm run release:production-check
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

Ops references:

- [data-retention.md](data-retention.md)
- [performance-load.md](performance-load.md)
- [security-compliance.md](security-compliance.md)
- [backup-restore-runbook.md](../runbooks/backup-restore-runbook.md)

## 5. Troubleshooting

- CORS lỗi: kiểm tra `CORS_ORIGINS` có đúng origin không.
- Cookie auth giữa subdomain: kiểm tra `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAME_SITE`, HTTPS và reverse proxy.
- Tenant mismatch: kiểm tra host/domain thật của tenant, `TRUST_PROXY`, `NEXT_PUBLIC_TENANT_ID`, `ALLOW_TENANT_HEADER_IN_PRODUCTION`, và `CORS_ORIGINS`.
- API không ready: kiểm tra `DATABASE_URL`, `REDIS_URL`, migration state.
- Build lỗi: chạy `pnpm install --frozen-lockfile`, `pnpm --filter @repo/database generate`, rồi build lại.
