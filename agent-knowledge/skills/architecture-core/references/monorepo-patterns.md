# Monorepo Patterns (Deep Reference)

## pnpm + Turborepo Workspace

### Key Commands

```bash
# Run dev server for a specific app
pnpm --filter @lms/api-server dev
pnpm --filter @lms/web-admin dev
pnpm --filter @lms/web-student dev

# Run build for a specific app
pnpm --filter @lms/api-server build

# Run tests for a specific app
pnpm --filter @lms/api-server test

# Run Prisma commands for the database package
pnpm --filter @lms/database prisma:generate
pnpm --filter @lms/database prisma:migrate
pnpm --filter @lms/database prisma:studio

# Run across all affected apps (based on changed deps)
turbo build
```

### Package Dependency Graph

```
packages/database (Prisma)
    └── apps/api-server
    └── packages/shared

packages/ui
    └── apps/web-admin
    └── apps/web-student
    └── apps/super-portal

packages/shared
    └── apps/api-server
    └── apps/web-admin
    └── apps/web-student
    └── apps/super-portal
```

## NestJS Module Structure

Each feature module follows this pattern:

```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── entities/
│   └── <feature>.entity.ts
└── <feature>.controller.spec.ts
```

### Standard Module Template

```typescript
// <feature>.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <Feature>Controller } from './<feature>.controller';
import { <Feature>Service } from './<feature>.service';
import { <Feature> } from './entities/<feature>.entity';

@Module({
  imports: [TypeOrmModule.forFeature([<Feature>])],
  controllers: [<Feature>Controller],
  providers: [<Feature>Service],
  exports: [<Feature>Service],
})
export class <Feature>Module {}
```

## Next.js 15 App Router Structure

```
apps/web-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── courses/
│   │   ├── students/
│   │   └── settings/
│   ├── api/              # Route handlers
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # Shared UI components
│   └── features/         # Feature-specific components
└── styles/
    └── globals.css
```

## Multi-Tenancy Patterns

### Tenant Identification

Tenant is identified by:
1. URL slug: `https://acme.lms.com` where `acme` is the tenant slug
2. Header: `x-tenant-id: <uuid>` for programmatic access

### Tenant Context Setup

```typescript
// TenantMiddleware (NestJS)
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const slug = req.headers['x-tenant-id'] || extractSlug(req.path);
    req['tenant'] = { slug, id: resolveTenantId(slug) };
    next();
  }
}
```

### Tenant-Scoped Prisma Queries

```typescript
// Always scope queries by tenantId
async findAll(user: User, tenantId: string) {
  return this.prisma.entity.findMany({
    where: { tenantId },  // <-- tenant isolation
  });
}

// On create, inject tenantId automatically
async create(data: CreateDto, tenantId: string) {
  return this.prisma.entity.create({
    data: { ...data, tenantId },  // <-- auto-tenant on create
  });
}
```

### Frontend Tenant Headers

```typescript
// Axios interceptor for tenant-aware requests
apiClient.interceptors.request.use((config) => {
  config.headers['x-tenant-id'] = getCurrentTenantId();
  return config;
});
```

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| NestJS modules | kebab-case | `lesson-management.module.ts` |
| Prisma models | PascalCase | `UserProfile`, `CourseEnrollment` |
| DTO properties | camelCase | `fullName`, `isActive` |
| API routes | kebab-case | `/api/v1/user-profiles` |
| React components | PascalCase | `LessonCard.tsx` |
| CSS classes | kebab-case | `.lesson-card`, `.btn-primary` |
| User name field | `fullName` | Always prefer `fullName` over `firstName`/`lastName` |

## Shared Package Usage

### packages/ui

Import shared components:
```typescript
import { Button } from '@lms/ui/components/Button';
import { Card } from '@lms/ui/components/Card';
import { LanguageToggle } from '@lms/ui/components/LanguageToggle';
```

### packages/database

Import Prisma client:
```typescript
import { PrismaService } from '@lms/database';
// or
import { PrismaClient } from '@prisma/client';
```

### packages/shared

Import shared types:
```typescript
import type { User, Course, Enrollment } from '@lms/shared/types';
import { TENANT_ROLES } from '@lms/shared/constants';
```

## Styling Guidelines

- **Component styles**: Vanilla CSS in the component's `.module.css` file
- **Layout/page styles**: Tailwind CSS utility classes in `.tsx` files
- **Global styles**: `globals.css` for CSS reset and Tailwind directives
- **Icons**: `lucide-react` only
- **Fonts**: Use the theme's font stack (configured in `packages/ui`)
