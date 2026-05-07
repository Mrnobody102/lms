# Project Structure

Tài liệu này là bản đồ thư mục thực tế của monorepo. Nếu thêm module lớn hoặc đổi boundary giữa apps/packages, cập nhật file này cùng PR.

```text
lms-platform/
├── apps/
│   ├── api-server/                    # NestJS REST API, port 4000
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── admin/                 # Tenant/user/admin overview APIs
│   │   │   ├── auth/                  # Cookie-first auth, JWT, guards, DTOs
│   │   │   ├── common/
│   │   │   │   ├── dto/
│   │   │   │   ├── filters/           # Global exception response
│   │   │   │   ├── guards/            # Global throttling guard
│   │   │   │   ├── health/            # live/ready/metrics/docs endpoints
│   │   │   │   ├── interfaces/
│   │   │   │   ├── metrics/
│   │   │   │   ├── middleware/        # request id, metrics, tenant, CSRF
│   │   │   │   ├── services/          # Prisma, logger, learning access policy
│   │   │   │   ├── throttling/
│   │   │   │   ├── utils/
│   │   │   │   └── validation/
│   │   │   ├── course/                # Course, unit, enrollment, reports
│   │   │   ├── exam/                  # Exam templates, attempts, review
│   │   │   ├── lesson/
│   │   │   ├── mcp/                   # Optional MCP tools, disabled by default
│   │   │   ├── practice/              # Question bank, exercise sets, attempts
│   │   │   ├── progress/              # Lesson progress, activity, summary
│   │   │   ├── user/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── tsconfig.json
│   │
│   ├── web-student/                   # Next.js student portal, port 3000
│   │   ├── Dockerfile
│   │   ├── e2e/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/[locale]/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── lib/
│   │   │   ├── messages/
│   │   │   ├── navigation.ts
│   │   │   └── proxy.ts
│   │   └── playwright.config.ts
│   │
│   ├── web-admin/                     # Center admin portal, port 3001
│   │   ├── Dockerfile
│   │   ├── e2e/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/[locale]/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── messages/
│   │   │   ├── navigation.ts
│   │   │   └── proxy.ts
│   │   └── playwright.config.ts
│   │
│   └── super-portal/                  # Platform owner portal, port 3002
│       ├── Dockerfile
│       ├── e2e/
│       ├── src/
│       │   ├── app/[locale]/
│       │   ├── components/
│       │   ├── lib/
│       │   ├── messages/
│       │   ├── navigation.ts
│       │   └── proxy.ts
│       └── playwright.config.ts
│
├── packages/
│   ├── api-client/                    # Shared Axios client: cookies, CSRF, 401 handling
│   ├── database/                      # Prisma schema, migrations, generated client, seed
│   ├── eslint-config/
│   ├── shared/                        # Shared constants, auth store, CSP/security helpers
│   ├── ts-config/
│   └── ui/                            # Shared React UI primitives
│
├── deployment/
│   └── production/                    # Production Docker Compose, migration image, monitoring
├── docs/
│   ├── ai-agent/
│   ├── guides/
│   ├── ops/
│   └── product/
├── scripts/                           # Validation, smoke, ports, Docker build helpers
├── tests/                             # Manual HTTP collections
├── agent-knowledge/                   # Local skill/context files for AI agents
├── .github/workflows/                 # CI and manual Docker image checks
├── docker-compose.yml                 # Local Postgres + Redis
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── turbo.json
```

## Boundary Rules

- API feature modules nằm trực tiếp dưới `apps/api-server/src/<module>/`.
- Business logic ở service; controller chỉ nhận HTTP, auth/role, DTO.
- Tenant-scoped Prisma read/write phải có tenant context hoặc dùng policy service sẵn có.
- Frontend apps dùng `@repo/api-client` thay vì tạo axios client riêng.
- `packages/shared`, `packages/ui`, `packages/api-client` không được import ngược từ `apps/*`.
- User-facing text phải cập nhật cả `vi.json` và `en.json`.
- Không commit `.next`, `dist`, coverage, `*.tsbuildinfo`, hay file secret.

## Common Commands

```bash
pnpm dev
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm smoke:api
pnpm test:e2e
```
