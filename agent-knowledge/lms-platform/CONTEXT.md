# LMS Platform - Business Context (BMAD)

Tài liệu này cung cấp ngữ cảnh nghiệp vụ (Business Context) cho AI Agent để hiểu cách hệ thống LMS vận hành, tránh tình trạng mất ngữ cảnh khi thực hiện các tác vụ phức tạp.

## 1. Tổng quan hệ thống

LMS Platform là một hệ thống Multi-tenant dành cho các trung tâm đào tạo.

- **Mục tiêu**: Quản lý khóa học, học viên và quy trình học tập tập trung.
- **Đối tượng**: Super Admin, Admin (Chủ trung tâm), Instructor, Student.

## 2. Cấu trúc Monorepo

```
lms-platform/
├── apps/
│   ├── api-server/          # NestJS backend (REST API)
│   ├── web-admin/           # Next.js 15 admin dashboard
│   ├── web-student/         # Next.js 15 student portal
│   └── super-portal/        # Next.js 15 super admin portal
├── packages/
│   ├── database/            # Prisma schema and client
│   ├── ui/                 # Shared UI components
│   ├── shared/              # Common types, constants, utils
│   ├── api-client/          # Shared axios API client
│   ├── eslint-config/       # Shared ESLint config
│   └── ts-config/           # Shared TypeScript configs
├── agent-knowledge/
│   ├── lms-platform/        # Project overview
│   └── skills/             # Domain-specific skills
```

## 3. Các thực thể cốt lõi (Core Entities)

- **Tenant (Trung tâm)**: Đơn vị độc lập cao nhất. Mỗi trung tâm có dữ liệu riêng biệt.
- **User (Người dùng)**: Gắn liền với một Tenant, có Role cụ thể.
- **Course (Khóa học)**: Thuộc về một Tenant, chứa các bài học và tài liệu.
- **Lesson (Bài học)**: Thuộc về một Course, có nhiều loại (VIDEO, TEXT, QUIZ, FLASHCARD).
- **Progress (Tiến độ)**: Theo dõi tiến độ học tập của User trên từng Lesson.

## 4. Quy luật nghiệp vụ (Business Rules)

1. **Isolation**: Dữ liệu giữa các Tenant phải tuyệt đối riêng biệt (Đã xử lý tại lớp `TenantMiddleware`).
2. **Access Control**:
   - AI Agent tương tác qua MCP cần tuân thủ Role của User đang thực thi.
   - Các kỹ năng tìm kiếm (`course_search`) chỉ trả về dữ liệu thuộc Tenant của User đó.
3. **Roles**: SUPER_ADMIN, ADMIN, INSTRUCTOR, STUDENT.

## 5. Technology Stack

| Layer           | Technology               | Notes                                             |
| --------------- | ------------------------ | ------------------------------------------------- |
| Backend         | NestJS                   | TypeScript, Prisma, class-validator, Swagger      |
| Frontend        | Next.js 15               | App Router, React Server Components, Tailwind CSS |
| Database        | PostgreSQL               | Prisma ORM, multi-tenant via `tenantId`           |
| State (Client)  | Zustand + React Query v5 | Auth via Zustand, server state via TanStack Query |
| i18n            | next-intl                | Vietnamese and English                            |
| Package Manager | pnpm                     | Workspaces                                        |
| Build Tool      | Turborepo                | Remote caching, selective builds                  |

## 6. Cấu trúc Module Context (AI Skills)

Hệ thống AI Skills được tổ chức theo hướng **Modular**:

- `mcp-core-skills`: Các kỹ năng cơ bản về hạ tầng và tìm kiếm.
- `auth-module`: Ngữ cảnh về xác thực và bảo mật.
- `course-module`: Ngữ cảnh về quản lý học thuật.

---

_Tài liệu này được biên soạn theo phương pháp BMAD để tối ưu hóa hiệu suất Brain của AI Agent._
