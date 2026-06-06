# Quy Trình Release Check

## Mục tiêu

Đây là quy trình kiểm tra tối thiểu trước khi commit/release local.

## Trình tự chuẩn

1. Chạy test tự động:

```bash
pnpm test
```

2. Chạy contract/i18n/production readiness checks:

```bash
pnpm run check:contracts
```

3. Chạy data integrity gate read-only:

```bash
pnpm run check:data-integrity
```

4. Kiểm tra production env thật trước deploy. Lệnh này chỉ in tên biến lỗi,
   không in giá trị secret. Với Vercel/Render, đặt `DEPLOYMENT_TOPOLOGY=vercel-render`
   trong env file trước khi chạy:

```bash
pnpm run check:production-env -- --file .env.production
```

5. Chạy lint:

```bash
pnpm lint
```

6. Build ổn định:

```bash
pnpm run build:stable
```

7. Smoke backend với Postgres và Redis:

```bash
pnpm run smoke:api
```

8. Kiểm tra trạng thái migration nếu đang chuẩn bị deploy shared/staging/production:

```bash
pnpm db:status
```

9. Smoke E2E UI:

```bash
pnpm test:e2e
```

10. Smoke staging thật trên Caddy/Compose hoặc platform tương đương khi chuẩn bị release production:

```bash
pnpm smoke:deploy -- -ApiUrl https://api.example.com -WebStudentUrl https://student.example.com -WebAdminUrl https://admin.example.com -SuperPortalUrl https://portal.example.com
```

11. Smoke staging thật trên browser E2E khi có tài khoản test.
    Các lệnh này không mock API và yêu cầu tài khoản test thật:

```bash
WEB_STUDENT_BASE_URL=https://<student-app> \
STAGING_STUDENT_EMAIL=<student-email> \
STAGING_STUDENT_PASSWORD=<student-password> \
SUPER_PORTAL_BASE_URL=https://<super-portal> \
STAGING_SUPER_EMAIL=<super-admin-email> \
STAGING_SUPER_PASSWORD=<super-admin-password> \
pnpm run test:e2e:staging
```

12. Smoke auth production/staging qua frontend proxy và API direct:

```bash
AUTH_SMOKE_WEB_URL=https://<student-app> \
AUTH_SMOKE_API_URL=https://<api-app> \
AUTH_SMOKE_TENANT_ID=<tenant-id-or-slug> \
AUTH_SMOKE_EMAIL=<student-email> \
AUTH_SMOKE_PASSWORD='<student-password>' \
pnpm run smoke:auth-production
```

13. Chạy load baseline staging và lưu JSON vào release evidence:

```bash
LMS_LOAD_API_URL=https://api.example.com \
LMS_LOAD_ORIGIN=https://courses.example.com \
LMS_LOAD_AUTH_COOKIE='<staging-cookie>' \
pnpm run load:baseline -- --duration-seconds 60 --concurrency 8
```

14. Nếu cần chạy một lệnh production gate đầy đủ:

```bash
pnpm run release:production-check
```

Nếu chỉ cần local release gate không yêu cầu `.env.production`:

```bash
pnpm run release:check
```

## Ghi chú vận hành

- `smoke:api` không chạy migration schema phá dữ liệu.
- `db:push` chỉ nên dùng cho local/dev có chủ đích.
- Production phải dùng `pnpm db:deploy`; baseline hoặc recovery đi theo runbook migration riêng.
- `ports:free` chỉ dừng process thuộc repo này, không kill bừa tiến trình ngoài workspace.
- Groq key chỉ đặt ở Render `api-server` (`GROQ_API_KEY` hoặc `AI_API_KEY`). Không tạo
  biến `NEXT_PUBLIC_GROQ_*` trên Vercel.
- Production compose đã có Caddy; chỉ Caddy được expose public `80/443`.
- Alertmanager phải có `ALERTMANAGER_WEBHOOK_URL` thật trước khi nhận traffic production.
