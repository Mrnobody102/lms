# LMS Platform - Business Context (BMAD)

Tài liệu này cung cấp ngữ cảnh nghiệp vụ (Business Context) cho AI Agent để hiểu cách hệ thống LMS vận hành, tránh tình trạng mất ngữ cảnh khi thực hiện các tác vụ phức tạp.

## 1. Tổng quan hệ thống

LMS Platform là một hệ thống Multi-tenant dành cho các trung tâm đào tạo.

- **Mục tiêu**: Xây dựng nền tảng học tập lai (Hybrid Learning) kết hợp giữa phương pháp truyền thống (Video, Quiz, Flashcards) và sức mạnh AI (Simulation, AI Feedback) để tối ưu hiệu quả đào tạo cho trung tâm ngôn ngữ, luyện thi và kỹ năng.
- **Đối tượng**: Super Admin, Admin (Chủ trung tâm), Instructor, Student.

## 2. Cấu trúc Monorepo

```
lms-platform/
├── apps/
│   ├── api-server/          # NestJS backend (REST API, port 4000)
│   ├── web-admin/          # Next.js admin dashboard (port 3001)
│   ├── web-student/        # Next.js student portal (port 3000)
│   └── super-portal/       # Next.js super admin portal (port 3002)
├── packages/
│   ├── database/           # Prisma schema and client
│   ├── ui/                 # Shared UI components (shadcn/ui)
│   ├── shared/             # Common types, constants, auth store
│   ├── api-client/         # Shared axios API client
│   ├── eslint-config/      # Shared ESLint config
│   └── ts-config/          # Shared TypeScript configs
├── docs/                   # Tài liệu dự án
├── agent-knowledge/        # AI Agent knowledge base (BMAD)
│   └── skills/             # Domain-specific skills
├── deployment/             # Docker configs for production
└── .github/workflows/     # CI/CD (GitHub Actions)
```

## 3. Các thực thể cốt lõi (Core Entities)

- **Tenant (Trung tâm)**: Đơn vị độc lập cao nhất. Mỗi trung tâm có dữ liệu riêng biệt.
- **User (Người dùng)**: Gắn liền với một Tenant, có Role cụ thể.
- **Course (Khóa học)**: Thuộc về một Tenant. Chứa `aiSettings` định nghĩa loại trợ lý AI chuyên biệt cho môn học đó.
- **CourseUnit (Chương/Unit)**: Nhóm curriculum thuộc Course.
- **Lesson (Bài học)**: Thuộc về một Course/Unit. Đã mở rộng thêm các dạng hiện đại: `SIMULATION` (Học mô phỏng AI), `MICRO_CARD` (Học siêu tốc), bên cạnh VIDEO/TEXT. Có `aiPrompt` cho kịch bản mô phỏng.
- **Progress (Tiến độ)**: Theo dõi tiến độ học tập của User trên từng Lesson.
- **Practice & Exam**: Lưu trữ Question, Exercise Set, và Attempt. Đã mở rộng hỗ trợ `AI_EVALUATED_AUDIO/TEXT` để thu bài bằng giọng nói/file và chấm bằng AI.
- **Reporting**: Student summary (activity, streak, performance), course report, admin overview.

## 4. Quy luật nghiệp vụ (Business Rules)

1. **Isolation**: Dữ liệu giữa các Tenant phải tuyệt đối riêng biệt (Đã xử lý tại lớp `TenantMiddleware`).
2. **Access Control**: Các endpoint mutation (POST/PATCH/DELETE) trên Course và Lesson yêu cầu Role ADMIN hoặc SUPER_ADMIN.
3. **Roles**: SUPER_ADMIN, ADMIN, INSTRUCTOR, STUDENT.

## 5. Technology Stack

| Layer           | Technology               | Notes                                             |
| --------------- | ------------------------ | ------------------------------------------------- |
| Backend         | NestJS                   | TypeScript, Prisma, class-validator, Swagger      |
| Frontend        | Next.js (App Router)     | React Server Components, Tailwind CSS             |
| Database        | PostgreSQL (Docker)      | Prisma ORM, multi-tenant via `tenantId`           |
| AI/LLM Layer    | Gemini/OpenAI API        | Contextual Tutors, Multi-modal Assessment         |
| State (Client)  | Zustand + TanStack Query | Auth via Zustand, server state via TanStack Query |
| i18n            | next-intl                | Vietnamese and English                            |
| Package Manager | pnpm 9                   | Workspaces                                        |
| Build Tool      | Turborepo                | Remote caching, selective builds                  |
| CI/CD           | GitHub Actions           | Lint, typecheck, build pipeline                   |

## 6. Cấu trúc Module Context (AI Skills)

Hệ thống AI Skills được tổ chức theo hướng **Modular** trong `agent-knowledge/skills/`:

- `architecture-core`: Hiểu app boundaries và monorepo layout
- `auth-standards`: Implement login, registration, JWT flow
- `code-review`: Codebase audit, security review, production readiness check
- `database-operations`: Chạy migrations, seeding, Prisma changes
- `db-intelligence`: Phân tích schema, lên kế hoạch data changes
- `deployment-ops`: Docker, CI/CD, production deployment
- `nestjs-standards`: Building API endpoints với NestJS
- `nextjs-standards`: Building frontend pages và components
- `i18n-workflow`: Thêm hoặc cập nhật translations
- `testing-strategy`: Viết unit và integration tests
- `engineering-planning`: Lên kế hoạch features hoặc refactors
- `monorepo-navigator`: Cross-package impact analysis, selective builds
- `mcp-server-builder`: Thiết kế MCP server từ API contracts

## 7. Tài liệu tham khảo nhanh

| Tài liệu           | Đường dẫn                           |
| ------------------ | ----------------------------------- |
| Tổng quan dự án    | `README.md`                         |
| Cấu trúc code      | `PROJECT_STRUCTURE.md`              |
| Kiến trúc hệ thống | `docs/ARCHITECTURE.md`              |
| Hướng dẫn bắt đầu  | `docs/quick-start.md`               |
| API Documentation  | `docs/api-documentation.md`         |
| Production roadmap | `docs/product/architecture-plan.md` |

---

_Tài liệu này được biên soạn theo phương pháp BMAD để tối ưu hóa hiệu suất Brain của AI Agent._
