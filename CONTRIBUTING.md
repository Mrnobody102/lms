# Hướng Dẫn Đóng Góp (Contributing Guide)

Chào mừng bạn đến với dự án! Chúng tôi tuân thủ các quy tắc phát triển tiêu chuẩn để đảm bảo chất lượng code và khả năng bảo trì.

## 1. Commit Messages

Chúng tôi tuân thủ chuẩn [Conventional Commits](https://www.conventionalcommits.org/).

**Định dạng**: `<type>(<scope>): <subject>`

**Các loại (Types)**:

- `feat`: Tính năng mới
- `fix`: Sửa lỗi (bug fix)
- `docs`: Chỉ thay đổi tài liệu
- `style`: Thay đổi không ảnh hưởng ý nghĩa code (khoảng trắng, format...)
- `refactor`: Thay đổi code không thêm tính năng mới cũng không sửa lỗi
- `perf`: Cải thiện hiệu năng
- `test`: Thêm test thiếu hoặc sửa test
- `chore`: Thay đổi quá trình build hoặc tool hỗ trợ, thư viện

**Ví dụ**:

- `feat(auth): thêm đăng nhập bằng google`
- `fix(ui): sửa lỗi căn lề nút trên mobile`

## 2. Quy Chuẩn Code (Code Style)

- Chúng tôi sử dụng **ESLint** và **Prettier**.
- Code sẽ được tự động format khi lưu (nếu cài đặt VS Code đúng) và được kiểm tra tự động khi commit thông qua Husky + lint-staged.
- **Không** được bỏ qua bước kiểm tra này (hạn chế dùng `--no-verify`).

## 3. Quy Trình Làm Việc (Workflow)

1. Tạo branch mới: `feature/ten-tinh-nang` hoặc `fix/ten-loi`.
2. Commit thay đổi của bạn (nhớ tuân thủ quy tắc commit message).
3. Push lên repository.
4. Tạo Pull Request (PR).

## 4. Các Lệnh Thường Dùng

```bash
# Development
pnpm dev          # Chạy tất cả apps (API + Frontends)
pnpm build        # Build toàn bộ ứng dụng/packages
pnpm lint         # Kiểm tra lỗi linting
pnpm format       # Format code với Prettier

# Database
pnpm db:up        # Khởi động Docker containers (PostgreSQL + Redis)
pnpm db:down      # Tắt Docker containers
pnpm db:migrate   # Chạy migration
pnpm db:seed      # Tạo dữ liệu mẫu
pnpm db:studio    # Mở Prisma Studio

# Testing
pnpm test         # Chạy unit tests (Vitest)
pnpm test:e2e     # Chạy E2E tests (Playwright)
```

## 5. Khắc Phục Sự Cố

- Nếu gặp lỗi types, hãy thử chạy `pnpm install` ở thư mục gốc.
- Nếu path alias không nhận, hãy kiểm tra `tsconfig.json` trong package/app tương ứng.
- Nếu build bị lỗi kiểu `Cannot find module`, thử chạy `pnpm install` rồi `pnpm build` lại.
- Nếu Docker không chạy, đảm bảo Docker Desktop đã được bật.

---

**Lưu ý về Mobile App (Tương lai)**:
Dự án được thiết kế theo kiến trúc Monorepo và API-First để sẵn sàng cho việc phát triển Mobile App (React Native) trong tương lai. Các logic chung code nên được đặt trong `packages/shared` hoặc `packages/api-client` để tái sử dụng.
