# Monorepo Patterns — LMS Platform

Reference guide for monorepo architecture decisions in the LMS Platform.

## LMS Package Dependencies

```
packages/database
       ^
       |
packages/shared  ────────> packages/ui
       ^                       ^
       |                       |
       |                       |
apps/api-server    apps/web-admin
       ^
       |
apps/web-student
```

## Package Entry Points

Each package must export its public API through `index.ts`:

```typescript
// packages/database/src/index.ts
export * from './prisma-client';
export * from './types';

// packages/shared/src/index.ts
export * from './constants';
export * from './types';
```

## Turbo.json Pipeline

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

## Cross-Package Imports

```typescript
// apps/web-admin/src/lib/api.ts
import { ApiResponse } from '@lms/shared';     // shared types
import { Prisma } from '@lms/database';         // database types
```

## Build Isolation

Each app builds independently:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "package.json", "tsconfig.json"],
      "outputs": [".next/**"]
    }
  }
}
```

Exclude non-source files from cache keys:

```json
{
  "pipeline": {
    "build": {
      "inputs": ["src/**", "package.json", "tsconfig.json", "!.md", "!*.md"]
    }
  }
}
```

## tsconfig Patterns

Root base config:
```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "declaration": true
  }
}
```

Per-package override:
```json
// packages/ui/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

## CI Configuration

```yaml
# .github/workflows/ci.yml
- name: Build affected packages
  run: pnpm turbo run build --filter="...[origin/main]"
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

## Changeset Workflow

```bash
# Add a changeset (describes what changed)
pnpm changeset

# Version and publish
pnpm changeset version
pnpm turbo run build
pnpm changeset publish
```

## Remote Caching

```bash
# Verify remote cache is working
pnpm turbo run build --summarize

# Clear local cache
pnpm turbo prune
rm -rf node_modules/.cache/turbo
```
