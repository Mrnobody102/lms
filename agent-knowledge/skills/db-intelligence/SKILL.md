# Database Intelligence

**Tier:** POWERFUL
**Category:** Engineering / DevOps
**Domain:** Database Management / Prisma

---

## Overview

Bộ kỹ năng này giúp AI Agent hiểu sâu về cấu trúc dữ liệu của dự án LMS, thực hiện review schema và lập kế hoạch thay đổi cơ sở dữ liệu một cách an toàn, tránh mất mát dữ liệu (data loss).

## Core Capabilities

- **db_schema_review**: Đọc và phân tích toàn bộ file `schema.prisma`.
- **generate_migration_plan**: Đề xuất các thay đổi model và câu lệnh migration dựa trên yêu cầu mới.
- **check_data_safety**: Cảnh báo các thay đổi nguy hiểm (ví dụ: xóa cột có dữ liệu, đổi kiểu dữ liệu gây lỗi).

## Hướng dẫn sử dụng

1. Trước khi thực hiện bất kỳ thay đổi nào liên quan đến Database, bạn **PHẢI** chạy `db_schema_review`.
2. Luôn sử dụng `generate_migration_plan` để xem trước các thay đổi và thảo luận với User.
3. Không bao giờ chạy trực tiếp lệnh `prisma migrate dev --force` mà không cảnh báo User nếu có nguy cơ mất dữ liệu.

## Key Workflows

### 1. Thêm trường/bảng mới

1. Chạy `db_schema_review` để hiểu quan hệ hiện tại.
2. Đề xuất đoạn code `model` mới.
3. Cung cấp câu lệnh `pnpm db:push` (cho dev) hoặc `pnpm db:migrate` (cho staging).

### 2. Sửa đổi/Xóa trường (Phải cẩn thận)

1. Kiểm tra xem trường đó có đang được dùng trong code không (sử dụng `grep_search`).
2. Nếu xóa, hãy đề xuất tạo một migration xóa cột sau khi đã đảm bảo code không còn gọi tới nó.

---

## Best Practices

- Ưu tiên dùng `UUID` cho các khóa chính.
- Luôn thêm `createdAt` và `updatedAt` cho các model quan trọng.
- Sử dụng `@@index` cho các trường hay dùng để lọc (filter) hoặc join.
- Quan hệ 1-nhiều (1-N) phải được định nghĩa rõ ràng ở cả hai phía model.
