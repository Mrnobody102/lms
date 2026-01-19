# Hướng Dẫn Kiểm Thử (Testing Guide)

Tài liệu này hướng dẫn cách viết và chạy test trong dự án LMS Platform, tập trung vào **Vitest** (Unit Test) và **Playwright** (E2E Test).

## 1. Tổng Quan

- **Vitest**: Dùng để test các hàm logic (Unit Test) và test giao diện Component (Component Test). Tốc độ cực nhanh và tương thích hoàn toàn với Vite.
- **Playwright**: Dùng để test các luồng người dùng thật (End-to-End), ví dụ: Đăng nhập -> Vào khóa học -> Học bài.

## 2. Unit Testing với Vitest

### A. Cách chạy Test

```bash
# Chạy toàn bộ Unit Test trong monorepo
pnpm test

# Chạy test cho từng package cụ thể
pnpm test --filter @repo/shared  # Test các hàm tiện ích
pnpm test --filter @repo/ui      # Test các components giao diện
```

### B. Viết Test cho Logic (Packages/Shared)

Thường dùng để test các hàm tính toán, format dữ liệu...

**Ví dụ:** Hàm cộng 2 số.
_File: `sum.ts`_

```typescript
export const sum = (a: number, b: number) => a + b;
```

_File: `sum.test.ts`_ (Tạo file có đuôi `.test.ts` ngay cạnh file gốc)

```typescript
import { describe, it, expect } from "vitest";
import { sum } from "./sum";

describe("Hàm tính tổng", () => {
  it("cộng 1 + 2 phải bằng 3", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

### C. Viết Test cho Component (Packages/UI)

Dùng `@testing-library/react` để render component và kiểm tra xem nó có hiện đúng nội dung không.

**Ví dụ:** Component nút bấm.
_File: `Button.tsx`_

```tsx
export const Button = ({ label }: { label: string }) => (
  <button>{label}</button>
);
```

_File: `Button.test.tsx`_

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./Button";

describe("Button Component", () => {
  it("hiển thị đúng nhãn (label)", () => {
    // 1. Render component
    render(<Button label="Click me" />);

    // 2. Tìm element có text là "Click me"
    const buttonElement = screen.getByText("Click me");

    // 3. Kiểm tra xem nó có tồn tại trong document không
    expect(buttonElement).toBeDefined();
  });
});
```

### D. Các hàm Assertion phổ biến

- `expect(value).toBe(expected)`: So sánh bằng chính xác (số, chuỗi).
- `expect(object).toEqual(expected)`: So sánh bằng nội dung (object, array).
- `expect(value).toBeTruthy()`: Kiểm tra giá trị đúng.
- `expect(fn).toThrow()`: Kiểm tra hàm có báo lỗi không.

---

## 3. E2E Testing với Playwright

### A. Cách chạy Test

```bash
# Chạy E2E test cho Web Student
pnpm test:e2e --filter web-student

# Mở giao diện UI để debug test
pnpm test:e2e --filter web-student --ui
```

### B. Ví dụ Test E2E

Kiểm tra xem trang chủ có tải được không.

_File: `apps/web-student/e2e/home.spec.ts`_

```typescript
import { test, expect } from "@playwright/test";

test("Trang chủ tải thành công", async ({ page }) => {
  // 1. Đi tới trang chủ
  await page.goto("http://localhost:3000");

  // 2. Kiểm tra tiêu đề trang có chứa chữ "LMS"
  await expect(page).toHaveTitle(/LMS/);

  // 3. Kiểm tra xem có nút "Bắt đầu" không
  await expect(page.getByText("Bắt đầu")).toBeVisible();
});
```
