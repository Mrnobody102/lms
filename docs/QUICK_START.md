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

### 3️⃣ Seed Sample Data (Required for First Time)

To populate the database with a default tenant and sample users, run:

```bash
pnpm --filter @repo/database run generate
pnpm --filter @repo/database run seed
```

**🔑 Built-in Sample Accounts:**

- **Tenant:** Trung Tâm Tiếng Trung Demo (`trung-tam-demo`)
- **Super Admin:** `admin@lms.com` (Pass: `admin123`)
- **Student User:** `student@lms.com` (Pass: `admin123`)

### 4️⃣ Start Development Server

```bash
pnpm dev
```

## ✅ Verify Setup

The API should be running at: **http://localhost:4000/api**

**Recommended:** Open the interactive **Swagger UI** in your browser to explore and test APIs easily:
👉 **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**

Alternatively, test with curl:

```bash
curl http://localhost:4000/api
```

## 📖 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference and logic.

## 🎯 Quick Test

### 1. Create or Find a Tenant

If you haven't seeded data, you need a tenant. You can create one via Prisma Studio:

```bash
pnpm db:studio
```

_(If you ran the seed script, you can use the tenant `trung-tam-demo` ID)_

### 2. Login or Register a User

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
