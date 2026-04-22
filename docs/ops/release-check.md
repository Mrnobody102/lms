# Quy Trình Release Check

## Mục tiêu

Đây là quy trình kiểm tra tối thiểu trước khi commit/release local.

## Trình tự chuẩn

1. Chạy test tự động:

```bash
pnpm test
```

2. Chạy lint:

```bash
pnpm lint
```

3. Build ổn định:

```bash
pnpm run build:stable
```

4. Smoke backend với Postgres và Redis:

```bash
pnpm run smoke:api
```

5. Smoke E2E UI:

```bash
pnpm test:e2e
```

6. Nếu cần chạy một lệnh duy nhất:

```bash
pnpm run release:check
```

## Ghi chú vận hành

- `smoke:api` không chạy migration schema phá dữ liệu.
- `db:push` chỉ nên dùng cho local/dev có chủ đích.
- Production nên đi theo `migrate deploy` và runbook migration riêng.
- `ports:free` chỉ dừng process thuộc repo này, không kill bừa tiến trình ngoài workspace.
