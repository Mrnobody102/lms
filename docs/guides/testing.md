# Hướng Dẫn Kiểm Thử (Testing Guide)

Tài liệu này mô tả các lớp test trong LMS Platform và cách chạy chúng đúng mục đích.

## 1. Test Layers

- **Unit / service tests**: Vitest cho logic thuần, service NestJS, util, policy.
- **HTTP integration tests**: kiểm tra API thật qua `supertest`, thường nằm trong `apps/api-server/src/**/*.http.spec.ts`.
- **Playwright UI smoke**: kiểm tra giao diện và luồng browser, nhưng API thường được mock để ổn định và nhanh.
- **Runtime smoke**: `pnpm smoke:api` để kiểm API thật với PostgreSQL + Redis.

## 2. Unit Testing với Vitest

### Chạy test

```bash
pnpm run check:contracts
pnpm test
pnpm test --filter @repo/shared
pnpm test --filter @repo/ui
```

### Khi nào dùng

- Hàm tính toán
- Policy/access helper
- Validation util
- Service logic không cần browser

## 3. HTTP Integration Test

Phù hợp cho:

- Auth flow
- Tenant isolation
- Course/lesson/progress/practice/exam API
- Guard và service layer regression

Chạy:

```bash
pnpm --filter api-server test
```

## 4. Playwright UI Smoke

Ba app frontend hiện dùng Playwright để kiểm:

- `web-student`
- `web-admin`
- `super-portal`

Các test này:

- mở route thật của app
- mock API response theo case cần kiểm
- tập trung vào UI, i18n, login UX, navigation, state

Chạy:

```bash
pnpm run playwright:install:chromium
pnpm test:e2e
pnpm --filter web-student test:e2e
pnpm --filter web-admin test:e2e
pnpm --filter super-portal test:e2e
```

Lưu ý:

- Đây không phải bài kiểm tra backend runtime thật.
- Nếu muốn xác minh API + DB + Redis thật, dùng `pnpm smoke:api`.

## 5. Runtime Smoke

```bash
pnpm db:up
pnpm db:migrate
pnpm smoke:api
```

Script này xác minh:

- API readiness
- Metrics endpoint
- Database connectivity
- Redis connectivity nếu cấu hình

## 6. Thực hành tốt

- Giữ test ngắn, rõ, gắn trực tiếp với behavior.
- Ưu tiên test ở service layer khi logic domain nằm ở đó.
- Với frontend, kiểm layout/interaction quan trọng hơn snapshot tràn lan.
- Với shared package, chạy thêm typecheck hoặc test của package phụ thuộc nếu có đổi API.
