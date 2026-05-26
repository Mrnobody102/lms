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

3. Kiểm tra production env thật trước deploy. Lệnh này chỉ in tên biến lỗi,
   không in giá trị secret:

```bash
pnpm run check:production-env -- --file .env.production
```

4. Chạy lint:

```bash
pnpm lint
```

5. Build ổn định:

```bash
pnpm run build:stable
```

6. Smoke backend với Postgres và Redis:

```bash
pnpm run smoke:api
```

7. Kiểm tra trạng thái migration nếu đang chuẩn bị deploy shared/staging/production:

```bash
pnpm db:status
```

8. Smoke E2E UI:

```bash
pnpm test:e2e
```

9. Nếu cần chạy một lệnh duy nhất:

```bash
pnpm run release:check
```

## Ghi chú vận hành

- `smoke:api` không chạy migration schema phá dữ liệu.
- `db:push` chỉ nên dùng cho local/dev có chủ đích.
- Production phải dùng `pnpm db:deploy`; baseline hoặc recovery đi theo runbook migration riêng.
- `ports:free` chỉ dừng process thuộc repo này, không kill bừa tiến trình ngoài workspace.
