# Project Structure

```
lms-platform/
├── apps/                          # Các ứng dụng có thể deploy
│   ├── api-server/               # NestJS API Server
│   ├── web-student/              # Student Portal (Next.js)
│   ├── web-admin/                # Admin Portal (Next.js)
│   └── super-portal/             # Super Admin Portal (Next.js)
│
├── packages/                     # Shared packages
│   ├── database/                # Prisma schema, migrations & seed
│   ├── shared/                  # Shared utilities, types, auth store
│   ├── api-client/              # Shared API client (axios instance)
│   ├── ui/                     # Shared UI components (shadcn/ui)
│   ├── eslint-config/          # Shared ESLint config
│   └── ts-config/              # Shared TypeScript configs
│
├── docs/                        # Tài liệu dự án
│   ├── ai-agent/                # AI Agent architecture docs
│   ├── guides/                  # Hướng dẫn kỹ thuật
│   ├── ops/                     # Vận hành & triển khai
│   ├── product/                 # Tài liệu sản phẩm
│   ├── ARCHITECTURE.md          # Tổng quan kiến trúc
│   ├── tech-stack.md           # Công nghệ sử dụng
│   ├── tech-analysis.md        # Phân tích kỹ thuật
│   ├── quick-start.md          # Hướng dẫn bắt đầu nhanh
│   ├── api-documentation.md    # Tài liệu API
│   └── troubleshooting.md      # Xử lý sự cố
│
├── agent-knowledge/             # AI Agent knowledge base (BMAD)
│   ├── lms-platform/
│   │   ├── CONTEXT.md          # Project context
│   │   └── SKILL.md           # Agent skills
│   └── skills/                 # Shared AI skills
│
├── scripts/                     # Scripts tiện ích
│   ├── test-api.ps1            # PowerShell API testing
│   ├── create-tenant.sql       # SQL tạo tenant test
│   └── validate-ai-work.ps1    # AI work validation
│
├── tests/                       # API test collections
│   ├── api-tests.http          # REST Client collection
│   └── test-register.json      # Test data mẫu
│
├── deployment/                   # Cấu hình triển khai
│   └── production/
│       └── docker-compose.prod.yml
│
├── .env                          # Environment variables
├── .env.example                  # Template env file
├── docker-compose.yml            # Docker dev services (PostgreSQL, Redis)
├── package.json                  # Monorepo root
├── turbo.json                   # Turborepo config
└── pnpm-lock.yaml
```

## API Server Structure

```
apps/api-server/src/
├── auth/                       # Authentication module
│   ├── decorators/             # @CurrentUser(), @Roles()
│   ├── dto/                    # Login, Register DTOs
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   ├── strategies/             # JWT strategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
│
├── user/                       # User profile module
│   ├── dto/                    # Update, ChangePassword DTOs
│   ├── user.controller.ts
│   ├── user.module.ts
│   └── user.service.ts
│
├── admin/                       # Admin management module
│   ├── dto/                    # Admin query, status, tenant DTOs
│   ├── admin.controller.ts
│   ├── admin-tenant.controller.ts
│   ├── admin.module.ts
│   └── admin.service.ts
│
├── course/                      # Course management module
│   ├── dto/
│   ├── course.controller.ts
│   ├── course.module.ts
│   └── course.service.ts
│
├── lesson/                      # Lesson management module
│   ├── dto/
│   ├── lesson.controller.ts
│   ├── lesson.module.ts
│   └── lesson.service.ts
│
├── progress/                    # Learning progress module
│   ├── dto/
│   ├── progress.controller.ts
│   ├── progress.module.ts
│   └── progress.service.ts
│
└── common/                       # Shared resources
    ├── dto/                     # Base response DTOs
    ├── filters/                 # Exception filters
    ├── interceptors/            # Response interceptors
    ├── middleware/              # Tenant middleware
    └── services/                # PrismaService
```

## Quick Commands

```bash
# Development
pnpm dev                # Chạy tất cả apps
pnpm build              # Build toàn bộ
pnpm lint               # Lint tất cả

# Database
pnpm db:up              # Bật PostgreSQL + Redis (Docker)
pnpm db:down            # Tắt Docker
pnpm db:migrate         # Chạy migration
pnpm db:seed            # Tạo dữ liệu mẫu
pnpm db:studio          # Mở Prisma Studio

# Testing
pnpm test               # Unit test (Vitest)
pnpm test:e2e           # E2E test (Playwright)
```

## Quick Links

- [API Documentation](docs/api-documentation.md)
- [Quick Start Guide](docs/quick-start.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Deployment Guide](docs/ops/deployment.md)
