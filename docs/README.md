# Tài Liệu Dự Án LMS Platform

Chào mừng bạn đến với hệ thống tài liệu của LMS Platform. Dưới đây là lộ trình đọc được đề xuất tùy theo vai trò và mục đích của bạn.

## Đọc Theo Thứ Tự

### Dev Mới — Bắt Đầu Từ Đây

Nếu bạn mới tham gia dự án, hãy đọc theo thứ tự:

1. **[README](../README.md)** — Tổng quan dự án, cách cài đặt và chạy ứng dụng.
2. **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** — Cấu trúc thư mục chi tiết của toàn bộ monorepo.
3. **[docs/quick-start.md](quick-start.md)** — Hướng dẫn nhanh: cài đặt Docker, chạy DB, start dev server.
4. **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** — Tổng quan kiến trúc hệ thống (multi-tenancy, scalability, codebase).
5. **[docs/tech-stack.md](tech-stack.md)** — Danh sách các công nghệ sử dụng và lý do chọn.

### Dev Backend (API Server)

1. **[docs/api-documentation.md](api-documentation.md)** — Tài liệu chi tiết tất cả API endpoints (Auth, User, Admin, Tenant).
2. **[docs/guides/database-guide.md](guides/database-guide.md)** — Cách quản lý Prisma migrations và schema.
3. **[docs/tech-analysis.md](tech-analysis.md)** — Phân tích sâu về kiến trúc và tech stack backend.
4. **[docs/product/architecture-plan.md](product/architecture-plan.md)** — Production readiness roadmap, checklist tiến độ các phase cải thiện.

### Product / Roadmap

1. **[docs/product/PLAN.md](product/PLAN.md)** — Lộ trình tổng thể từ LMS foundation tới dashboard, practice, exam, reports, activation và AI.
2. **[docs/product/features.md](product/features.md)** — Feature map theo actor/module và trạng thái hiện tại.
3. **[docs/product/ENGINEERING-BACKLOG.md](product/ENGINEERING-BACKLOG.md)** — Backlog kỹ thuật và tiến độ đã verify.
4. **[docs/product/architecture-plan.md](product/architecture-plan.md)** — Kiến trúc domain cần giữ khi mở rộng feature.

### Dev Frontend (Web Apps)

1. **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** — Hiểu cách frontend apps giao tiếp với API.
2. **[docs/guides/testing.md](guides/testing.md)** — Hướng dẫn viết và chạy Vitest (unit) và Playwright (E2E).

### Dev / Ops — Triển Khai & Vận Hành

1. **[docs/ops/deployment.md](ops/deployment.md)** — Hướng dẫn triển khai local và production (Vercel + Docker VPS).
2. **[docs/troubleshooting.md](troubleshooting.md)** — Giải quyết các lỗi thường gặp (Docker, i18n, monorepo, Tailwind).

## Cấu Trúc Thư Mục Tài Liệu

```
docs/
├── README.md                  # ⭐ Bạn đang ở đây — chỉ đường cho dev mới
├── ARCHITECTURE.md           # Tổng quan kiến trúc
├── tech-stack.md             # Công nghệ sử dụng
├── tech-analysis.md          # Phân tích kỹ thuật chuyên sâu
├── quick-start.md            # Hướng dẫn bắt đầu nhanh
├── api-documentation.md      # Tài liệu chi tiết API endpoints
├── troubleshooting.md        # Xử lý sự cố thường gặp
│
├── guides/                   # Hướng dẫn kỹ thuật chuyên biệt
│   ├── database-guide.md    # Prisma migrations, seed, docker
│   └── testing.md           # Vitest + Playwright
│
├── ops/                      # Vận hành & triển khai
│   └── deployment.md         # Local dev + Production deployment
│
├── product/                  # Tài liệu sản phẩm
│   ├── features.md          # Danh sách tính năng theo Actor
│   ├── PLAN.md              # Kế hoạch phát triển tổng thể
│   ├── ENGINEERING-BACKLOG.md # Tiến độ kỹ thuật và backlog
│   └── architecture-plan.md # Production readiness roadmap
│
└── ai-agent/                 # Tài liệu AI Agent (nội bộ)
    ├── ai-agent-architecture.md
    └── overnight-command-template.md
```

## Các File Quan Trọng Khác

| File                                               | Mục đích                                                   |
| -------------------------------------------------- | ---------------------------------------------------------- |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)           | Quy tắc đóng góp (commit convention, code style, workflow) |
| [../PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) | Cấu trúc code chi tiết (apps, packages, scripts)           |
| [.agent/](../.agent/)                              | Cấu hình Claude Opus workspace                             |

## Đóng Góp Tài Liệu

- Các file docs sử dụng **tiếng Việt** làm ngôn ngữ chính.
- README.md ở root và một số file kỹ thuật có thể dùng **tiếng Anh** để thuận tiện tra cứu.
- Thứ tự đọc trong file này nên được cập nhật nếu có file mới được thêm vào.
