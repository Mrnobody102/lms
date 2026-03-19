# Quick Start Guide

## Prerequisites

- **Node.js** 18+
- **Bun** (recommended) or pnpm
  ```bash
  # Install bun
  curl -fsSL https://bun.sh/install | bash
  ```

## ⚡ Start Here

### 1️⃣ Start Docker Database

```bash
bun run db:up
```

### 2️⃣ Run Database Migration

```bash
bun run db:migrate
```

When prompted for migration name, enter: **`add_user_profile_fields`**

### 3️⃣ Generate Prisma Client & Seed Data (First Time)

```bash
bun --filter @repo/database run generate
bun --filter @repo/database run seed
```

**🔑 Built-in Sample Accounts:**

- **Tenant:** Trung Tâm Tiếng Trung Demo (`trung-tam-demo`)
- **Super Admin:** `admin@lms.com` (Pass: `admin123`)
- **Student User:** `student@lms.com` (Pass: `admin123`)

### 4️⃣ Start Development Servers

Open **4 terminal windows** and run each command:

```bash
# Terminal 1 - API Server (port 4000)
cd apps/api-server && bun run dev

# Terminal 2 - Web Student (port 3000)
cd apps/web-student && bun run dev

# Terminal 3 - Web Admin (port 3001)
cd apps/web-admin && bun run dev

# Terminal 4 - Super Portal (port 3002)
cd apps/super-portal && bun run dev
```

Alternatively, use **turbo** (requires pnpm):

```bash
pnpm dev
```

## ✅ Verify Setup

| App | URL |
|-----|-----|
| Web Student | http://localhost:3000 |
| Web Admin | http://localhost:3001 |
| Super Portal | http://localhost:3002 |
| API | http://localhost:4000/api |

Test API:

```bash
curl http://localhost:4000/api
```

Open **Swagger UI** for interactive API testing:

👉 **http://localhost:4000/api/docs**

## 🎯 Quick Test

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

## 🔑 Environment Variables

Configured in `.env`:

- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - API server port (4000)
- `NODE_ENV` - `development` or `production`
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `MCP_API_KEY` - MCP server authentication key
