# Quick Start Guide

## ⚡ Start Here

### 1️⃣ Start Docker Database

```bash
pnpm db:up
```

### 2️⃣ Run Database Migration

```bash
pnpm db:migrate
```

When prompted for migration name, enter: **`add_user_profile_fields`**

### 3️⃣ Start Development Server

```bash
pnpm dev
```

## ✅ Verify Setup

The API should be running at: **http://localhost:4000/api**

Test with:

```bash
curl http://localhost:4000/api
```

## 📖 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🎯 Quick Test

### 1. Create a Tenant (if needed)

First, you need a tenant. You can create one directly in the database or via Prisma Studio:

```bash
pnpm --filter @repo/database db:studio
```

### 2. Register a User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "tenantId": "YOUR_TENANT_ID_HERE"
  }'
```

Save the returned `token` for authenticated requests.

### 3. Get Your Profile

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔑 Environment Variables

Already configured in `.env`:

- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - API server port (4000)
