# Docker Compose and CI/CD Reference

This document provides concrete examples for containerizing, composing, and automating the LMS platform.

## Local Development docker-compose.yml

Located at `docker-compose.yml` at repo root. Spins up only infrastructure (no app builds) for local dev.

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: lms_postgres
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lms_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - lms_network

  redis:
    image: redis:alpine
    container_name: lms_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - lms_network

networks:
  lms_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

Start with: `docker compose up -d`

---

## Production Docker Compose

Located at `deployment/production/docker-compose.prod.yml`. Builds and runs all four services with infrastructure.

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lms_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - lms_network

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    networks:
      - lms_network

  api:
    build:
      context: ../../
      dockerfile: apps/api-server/Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/lms_platform
      REDIS_URL: redis://redis:6379
      PORT: 4000
    depends_on:
      - postgres
      - redis
    networks:
      - lms_network

  web-student:
    build:
      context: ../../
      dockerfile: apps/web-student/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    depends_on:
      - api
    networks:
      - lms_network

  web-admin:
    build:
      context: ../../
      dockerfile: apps/web-admin/Dockerfile
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    depends_on:
      - api
    networks:
      - lms_network

  super-portal:
    build:
      context: ../../
      dockerfile: apps/super-portal/Dockerfile
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    depends_on:
      - api
    networks:
      - lms_network

networks:
  lms_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

Start with: `docker compose -f deployment/production/docker-compose.prod.yml up --build`

---

## Multi-Stage Dockerfiles

### NestJS API Server

```dockerfile
FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scan-imports api-server --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm install -g pnpm
RUN pnpm install
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=api-server...

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs
COPY --from=installer /app/apps/api-server/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
CMD ["node", "dist/main.js"]
```

### Next.js Apps (web-student, web-admin, super-portal)

```dockerfile
FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scan-imports web-student --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm install -g pnpm
RUN pnpm install
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=web-student...

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=installer /app/apps/web-student/next.config.js .
COPY --from=installer /app/apps/web-student/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/apps/web-student/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web-student/.next/static ./apps/web-student/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web-student/public ./apps/web-student/public
CMD ["node", "apps/web-student/server.js"]
```

Note: Change `--filter=web-student` to `--filter=web-admin` or `--filter=super-portal` as needed.

---

## GitHub Actions CI/CD Pipeline

### Example: CI + Build + Deploy (api-server)

```yaml
name: API Server CI/CD

on:
  push:
    branches: [main]
    paths:
      - "apps/api-server/**"
      - "packages/**"
      - "turbo.json"
  pull_request:
    paths:
      - "apps/api-server/**"
      - "packages/**"
      - "turbo.json"

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/lms-api

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint --filter=api-server...
      - run: pnpm turbo build --filter=api-server...

  deploy:
    needs: ci
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/setup-buildx-action@v3
      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api-server/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Deploy to Railway
        run: |
          railway up --service api --dockerfile apps/api-server/Dockerfile
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Frontend Deploy (Vercel)

```yaml
name: Frontend Deploy

on:
  push:
    branches: [main]
    paths:
      - "apps/web-student/**"
      - "apps/web-admin/**"
      - "apps/super-portal/**"
  pull_request:

jobs:
  deploy-student:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: corepack enable && pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=web-student...
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STUDENT }}
          vercel-args: "--prod"
```

---

## Environment Variables Template (.env.example)

```env
# API Server
DATABASE_URL=postgresql://postgres:password@localhost:5432/lms_platform
REDIS_URL=redis://localhost:6379
PORT=4000
JWT_SECRET=your-secret-here
NODE_ENV=development

# Next.js Frontends
NEXT_PUBLIC_API_URL=http://localhost:4000
```
