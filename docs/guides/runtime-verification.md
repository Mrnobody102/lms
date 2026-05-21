# Hướng Dẫn Verify Runtime

## Mục tiêu

Tài liệu này mô tả luồng verify tối giản nhưng đủ chặt cho local và pre-release.

## Luồng verify khuyến nghị

### 1. Fast checks

```bash
pnpm run check:contracts
pnpm test
pnpm lint
```

### 2. Build ổn định

```bash
pnpm run build:stable
```

Dùng script này khi cần xác nhận chắc chắn trên Windows. Script sẽ:

- dọn các process thuộc repo còn chiếm cổng dev
- build tuần tự để tránh lỗi `kill EPERM` khi chạy song song

### 3. Smoke backend với DB và Redis thật

```bash
pnpm run smoke:api
```

Script này sẽ:

- xác nhận Postgres và Redis đang chạy
- seed dữ liệu mẫu
- start `api-server` từ bản build
- kiểm tra:
  - `GET /api/health/live`
  - `GET /api/health/ready`
  - login/logout bằng cookie session
  - `users/me`
  - `courses`
  - `progress`

### 4. E2E UI

```bash
pnpm test:e2e
```

Mặc định:

- chỉ chạy Chromium
- chỉ chạy 1 worker
- phù hợp cho verify local nhanh và ổn định

Nếu cần full browser matrix:

```bash
pnpm test:e2e:all
```

### 5. Full local release check

```bash
pnpm run release:check
```

## Khi nào dùng script nào

- `pnpm build`: build nhanh thông thường
- `pnpm run build:stable`: build verify trước release hoặc khi máy Windows bị lỗi process
- `pnpm run smoke:api`: khi cần xác nhận backend runtime thực sự ổn với DB/Redis
- `pnpm test:e2e`: verify UI smoke
- `pnpm test:e2e:all`: chỉ dùng khi thật sự cần cross-browser
