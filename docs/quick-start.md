# Quick Start

Cập nhật lần cuối: 2026-04-27

## Yêu cầu

- Node.js >= 20.9.0 (recommended Node 20 LTS; `.nvmrc` pins 20.19.5)
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

Seed hiện tạo tenant demo, admin, student, course demo, lessons demo, enrollment cho student demo, practice exercise set mẫu và exam mẫu. Demo content IDs are UUID-compatible so they work with API route validation.

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

## Tài khoản demo local

Sau khi `pnpm db:seed`:

| Role        | Email             | Password   | Ghi chú                        |
| ----------- | ----------------- | ---------- | ------------------------------ |
| Super Admin | `admin@lms.com`   | `admin123` | Quản trị platform/tenant demo  |
| Student     | `student@lms.com` | `admin123` | Đã được enroll vào course demo |

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

CSRF token for state-changing cookie requests:

```bash
CSRF_TOKEN=$(awk '$0 ~ /csrf_token/ { print $7 }' cookies.txt | tail -1)
```

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -b cookies.txt
```

### 3. Đăng xuất

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -b cookies.txt \
  -c cookies.txt
```

## Biến môi trường chính

| Biến                    | Ý nghĩa                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Kết nối PostgreSQL                                                               |
| `JWT_SECRET`            | Secret để ký JWT                                                                 |
| `PORT`                  | Port API server                                                                  |
| `APP_PUBLIC_URL`        | Public API host cho log/runbook; local dev có thể bỏ trống                       |
| `NODE_ENV`              | `development` hoặc `production`                                                  |
| `CORS_ORIGINS`          | Exact frontend origins, phân tách bằng dấu phẩy; production bắt buộc             |
| `REDIS_URL`             | URL `redis://` hoặc `rediss://`; production readiness bắt buộc                   |
| `NEXT_PUBLIC_TENANT_ID` | Tenant hint cho frontend local/dev; production nên resolve theo domain/subdomain |
| `AUTH_COOKIE_SAME_SITE` | Chính sách SameSite cho cookie auth (`lax`, `strict`, `none`)                    |
| `AUTH_COOKIE_DOMAIN`    | Cookie domain khi deploy frontend/API trên subdomain chung                       |
| `MCP_ENABLED`           | Bật MCP có chủ đích, mặc định nên là `false`                                     |
| `MCP_TENANT_ID`         | Tenant UUID bắt buộc cho các MCP tool có đọc dữ liệu tenant                      |

## Scripts thường dùng

| Lệnh              | Mục đích                            |
| ----------------- | ----------------------------------- |
| `pnpm dev`        | Chạy toàn bộ app ở dev mode         |
| `pnpm build`      | Build workspace                     |
| `pnpm test`       | Chạy test                           |
| `pnpm test:e2e`   | Chạy E2E test                       |
| `pnpm db:up`      | Bật database                        |
| `pnpm db:down`    | Tắt database                        |
| `pnpm db:migrate` | Chạy migration                      |
| `pnpm db:deploy`  | Apply migration đã commit           |
| `pnpm db:status`  | Kiểm tra trạng thái migration       |
| `pnpm db:resolve` | Resolve baseline/recovery migration |
| `pnpm db:seed`    | Seed dữ liệu mẫu                    |
| `pnpm db:studio`  | Mở Prisma Studio                    |

`pnpm test:e2e` build các shared workspace dependency trước khi mở Playwright để Next app không đọc nhầm artifact `dist` cũ.
Đây là browser UI smoke với API mock; để kiểm API + DB + Redis thật, dùng `pnpm smoke:api`.

## Production-readiness notes

- Do not use `db:push` outside local prototyping. Use `pnpm db:deploy` for committed migrations.
- Learning access is enforced both in service policy and tenant-scoped database constraints.
- Learning content hierarchy is `Course -> CourseUnit -> Lesson`; existing lessons are backfilled into a default unit by migration.
- Practice MVP has question bank, exercise sets, submitted attempts, scoring, enrollment-based access checks, admin management UI at `/practice`, and student attempt UI at `/practice`.
- Practice student flows now include recent-attempt history and review routes.
- Exam MVP has templates, sections/questions, started/submitted attempts, score/review, enrollment-based access checks, admin template UI at `/exams`, and student exam UI at `/exams`.
- Student-facing practice/exam reads do not expose correct answers or explanations before submission.
- Exam attempts now enforce time from `startedAt + durationMinutes`; the student UI resumes an active attempt and blocks late submission.
- Exam student flows now include recent-attempt history, resume links for active attempts, and dedicated review routes.
- Dependencies are pinned in package manifests; run `pnpm install --frozen-lockfile` in CI/release flows.
- MCP is optional and should remain disabled unless a deployment explicitly configures `MCP_ENABLED=true` and `MCP_API_KEY`.
- If tenant-scoped MCP data tools are enabled, also configure `MCP_TENANT_ID` so the server cannot read across tenants by default.

## Roadmap feature hiện tại

Trạng thái sản phẩm và lộ trình chi tiết nằm ở:

- [Product plan](product/PLAN.md)
- [Feature map](product/features.md)
- [Engineering backlog](product/ENGINEERING-BACKLOG.md)

Thứ tự làm tiếp hiện tại:

1. Practice/Exam reporting theo unit/skill.
2. Activation/license.
3. Reporting nâng cao theo unit/practice/exam.
4. Mở rộng question types cho practice/exam.
