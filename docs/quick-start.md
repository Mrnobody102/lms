# Quick Start Guide

## Prerequisites

- **Node.js** 18+
- **pnpm** 9+
  ```bash
  npm install -g pnpm
  ```

## Start Here

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Docker Database

```bash
pnpm run db:up
```

### 3. Run Database Migration (First Time)

```bash
pnpm run db:migrate
```

When prompted for migration name, enter a descriptive name (e.g., `init_schema`).

### 4. Generate Prisma Client & Seed Data (First Time)

```bash
pnpm run db:seed
```

**Sample Accounts:**

- **Tenant:** Trung Tâm Tiếng Trung Demo (`trung-tam-demo`)
- **Super Admin:** `admin@lms.com` (Pass: `admin123`)
- **Student User:** `student@lms.com` (Pass: `admin123`)

### 5. Start Development Servers

```bash
pnpm dev
```

This starts all apps concurrently. You can also start individual apps:

```bash
# API Server (port 4000)
pnpm --filter api-server dev

# Web Student (port 3000)
pnpm --filter web-student dev

# Web Admin (port 3001)
pnpm --filter web-admin dev

# Super Portal (port 3002)
pnpm --filter super-portal dev
```

## Verify Setup

| App          | URL                            |
| ------------ | ------------------------------ |
| Web Student  | http://localhost:3000          |
| Web Admin    | http://localhost:3001          |
| Super Portal | http://localhost:3002          |
| API          | http://localhost:4000/api      |
| Swagger Docs | http://localhost:4000/api/docs |

Test API:

```bash
curl http://localhost:4000/api
```

## Quick Test

### 1. Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -d '{
    "email": "admin@lms.com",
    "password": "admin123"
  }'
```

### 2. Get Profile

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Environment Variables

Configured in `.env`:

| Variable       | Description                            |
| -------------- | -------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string           |
| `JWT_SECRET`   | Secret key for JWT tokens              |
| `PORT`         | API server port (4000)                 |
| `NODE_ENV`     | `development` or `production`          |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |

## Available Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Start all apps in development  |
| `pnpm build`      | Build all apps                 |
| `pnpm lint`       | Lint all apps                  |
| `pnpm format`     | Format code with Prettier      |
| `pnpm db:up`      | Start Docker database          |
| `pnpm db:down`    | Stop Docker database           |
| `pnpm db:push`    | Push Prisma schema to database |
| `pnpm db:migrate` | Run Prisma migrations          |
| `pnpm db:seed`    | Seed database with sample data |
| `pnpm db:studio`  | Open Prisma Studio             |
| `pnpm test`       | Run unit tests (Vitest)        |
| `pnpm test:e2e`   | Run E2E tests (Playwright)     |
