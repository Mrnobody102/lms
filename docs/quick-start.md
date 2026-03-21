# Quick Start Guide

## Prerequisites

- **Node.js** 18+
- **pnpm** 9+
  ```bash
  npm install -g pnpm
  ```

## ⚡ Start Here

### 1️⃣ Install Dependencies

```bash
pnpm install
```

### 2️⃣ Start Docker Database

```bash
pnpm run db:up
```

### 3️⃣ Run Database Migration (First Time)

```bash
pnpm run db:migrate
```

When prompted for migration name, enter: **`add_user_profile_fields`**

### 4️⃣ Generate Prisma Client & Seed Data (First Time)

```bash
pnpm run db:seed
```

**🔑 Built-in Sample Accounts:**

- **Tenant:** Trung Tâm Tiếng Trung Demo (`trung-tam-demo`)
- **Super Admin:** `admin@lms.com` (Pass: `admin123`)
- **Student User:** `student@lms.com` (Pass: `admin123`)

### 5️⃣ Start Development Servers

Open **4 terminal windows** and run each command:

```bash
# Terminal 1 - API Server (port 4000)
cd apps/api-server && pnpm run dev

# Terminal 2 - Web Student (port 3000)
cd apps/web-student && pnpm run dev

# Terminal 3 - Web Admin (port 3001)
cd apps/web-admin && pnpm run dev

# Terminal 4 - Super Portal (port 3002)
cd apps/super-portal && pnpm run dev
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

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build all apps |
| `pnpm run lint` | Lint all apps |
| `pnpm run format` | Format code with Prettier |
| `pnpm run db:up` | Start Docker database |
| `pnpm run db:down` | Stop Docker database |
| `pnpm run db:push` | Push Prisma schema to database |
| `pnpm run db:migrate` | Run Prisma migrations |
| `pnpm run db:seed` | Seed database with sample data |
| `pnpm run db:studio` | Open Prisma Studio |
