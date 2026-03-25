# User Management API - Setup & Usage Guide

## 🚀 Setup Instructions

### 1. Start Database

```bash
# From project root
pnpm db:up
```

This will start PostgreSQL in Docker.

### 2. Run Database Migration

```bash
# Apply migration to add user profile fields
pnpm db:migrate
```

When prompted, enter migration name: `add_user_profile_fields`

### 3. Seed Sample Data (Optional but Recommended)

```bash
# Seed demo tenant & accounts
pnpm db:seed
```

_Sample accounts created:_

- `admin@lms.com` / `admin123`
- `student@lms.com` / `admin123`
- _Tenant ID for testing can be retrieved via Prisma Studio._

### 4. Start API Server

```bash
# From project root
pnpm dev
```

The API server will be available at: `http://localhost:4000/api`

### 5. Swagger UI Documentation

You can view the interactive API documentation and test endpoints directly from your browser by visiting:

👉 **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**

_(Make sure the API Server is running before accessing the link)_

---

## 📋 API Endpoints

### Authentication

#### Register New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phoneNumber": "+84901234567",
  "tenantId": "your-tenant-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+84901234567",
      "avatarUrl": null,
      "role": "STUDENT",
      "isActive": true,
      "tenantId": "your-tenant-id",
      "createdAt": "2026-01-21T01:00:00.000Z",
      "updatedAt": "2026-01-21T01:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "John Doe",
      "role": "STUDENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### User Profile (Authenticated)

#### Get Current User Profile

```http
GET /api/users/me
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+84901234567",
    "avatarUrl": null,
    "role": "STUDENT",
    "isActive": true,
    "tenantId": "your-tenant-id",
    "createdAt": "2026-01-21T01:00:00.000Z",
    "updatedAt": "2026-01-21T01:00:00.000Z",
    "tenant": {
      "id": "uuid",
      "name": "My Learning Center",
      "slug": "my-learning-center"
    }
  }
}
```

#### Update Profile

```http
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Updated Doe",
  "phoneNumber": "+84987654321",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "John Updated Doe",
    "phoneNumber": "+84987654321",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "STUDENT",
    "isActive": true,
    "tenantId": "your-tenant-id",
    "createdAt": "2026-01-21T01:00:00.000Z",
    "updatedAt": "2026-01-21T01:05:00.000Z"
  }
}
```

#### Change Password

```http
PUT /api/users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

### Admin User Management (ADMIN/SUPER_ADMIN Only)

#### List All Users (with Pagination & Filters)

```http
GET /api/admin/users?page=1&limit=10&role=STUDENT&isActive=true
Authorization: Bearer {admin_token}
```

**Query Parameters:**

- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 100
- `email` (optional): Filter by email (partial match)
- `role` (optional): Filter by role (STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN)
- `isActive` (optional): Filter by active status (true/false)

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "email": "student@example.com",
        "fullName": "John Doe",
        "phoneNumber": "+84901234567",
        "avatarUrl": null,
        "role": "STUDENT",
        "isActive": true,
        "tenantId": "your-tenant-id",
        "createdAt": "2026-01-21T01:00:00.000Z",
        "updatedAt": "2026-01-21T01:00:00.000Z",
        "tenant": {
          "id": "uuid",
          "name": "My Learning Center",
          "slug": "my-learning-center"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### Get User by ID

```http
GET /api/admin/users/{userId}
Authorization: Bearer {admin_token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+84901234567",
    "avatarUrl": null,
    "role": "STUDENT",
    "isActive": true,
    "tenantId": "your-tenant-id",
    "createdAt": "2026-01-21T01:00:00.000Z",
    "updatedAt": "2026-01-21T01:00:00.000Z",
    "tenant": {
      "id": "uuid",
      "name": "My Learning Center",
      "slug": "my-learning-center"
    }
  }
}
```

#### Lock/Unlock User Account

```http
PATCH /api/admin/users/{userId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+84901234567",
    "avatarUrl": null,
    "role": "STUDENT",
    "isActive": false,
    "tenantId": "your-tenant-id",
    "createdAt": "2026-01-21T01:00:00.000Z",
    "updatedAt": "2026-01-21T01:10:00.000Z"
  }
}
```

---

### Super Admin Tenant Management (SUPER_ADMIN Only)

#### Create New Tenant

```http
POST /api/admin/tenants
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Trung tâm Lập trình C",
  "slug": "trung-tam-c",
  "domain": "learn.c-programming.com",
  "settings": {
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#000000"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Trung tâm Lập trình C",
    "slug": "trung-tam-c",
    "domain": "learn.c-programming.com",
    "settings": {
      "logoUrl": "https://example.com/logo.png",
      "primaryColor": "#000000"
    },
    "createdAt": "2026-02-26T00:00:00.000Z"
  }
}
```

#### Update Tenant Configuration

```http
PUT /api/admin/tenants/{tenantId}
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Trung tâm Mới update"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Trung tâm Mới update",
    "slug": "trung-tam-c",
    "domain": "learn.c-programming.com",
    "settings": { ... },
    "createdAt": "..."
  }
}
```

---

## ⚙️ Runtime & Configuration

- Environment variables are validated at startup using Zod schema (`apps/api-server/src/config/env.validation.ts`)
- API request/response errors are logged via centralized logger service (`apps/api-server/src/common/services/logger.service.ts`)
- Request logging middleware captures method, path, status code, duration, and request ID (`apps/api-server/src/common/middleware/request-logging.middleware.ts`)

## ⚙️ Runtime & Configuration

- Environment variables are validated at startup using Zod schema (`apps/api-server/src/config/env.validation.ts`)
- API request/response errors are logged via centralized logger service (`apps/api-server/src/common/services/logger.service.ts`)
- Request logging middleware captures method, path, status code, duration, and request ID (`apps/api-server/src/common/middleware/request-logging.middleware.ts`)

## 🔒 Security Features

### Password Requirements

- Minimum 8 characters
- Hashed using bcrypt with 10 salt rounds

### JWT Token

- Expires in 7 days
- Contains: user ID, email, role, tenantId
- Secret key stored in `.env` file

### Role-Based Access Control

- `STUDENT`: Can access own profile only
- `INSTRUCTOR`: Can access own profile only
- `ADMIN`: Can manage users within their tenant
- `SUPER_ADMIN`: Can manage users across all tenants

### Tenant Isolation

- ADMIN users can only see/manage users in their tenant
- SUPER_ADMIN users can see/manage users across all tenants

---

## ⚠️ Important Notes

1. **Password Never Returned**: User password is never included in API responses
2. **Email is Immutable**: Email cannot be changed after registration
3. **Role Cannot be Changed**: Users cannot change their own role via profile update
4. **Self-Lock Prevention**: Admins cannot deactivate their own account
5. **Tenant Assignment**: Users are assigned to a tenant during registration

---

## 🧪 Testing with cURL

### Register a User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "tenantId": "your-tenant-id"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)

```bash
curl -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📁 Project Structure

```
apps/api-server/src/
├── auth/
│   ├── decorators/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── user/
│   ├── dto/
│   │   ├── update-profile.dto.ts
│   │   └── change-password.dto.ts
│   ├── user.controller.ts
│   ├── user.module.ts
│   └── user.service.ts
├── admin/
│   ├── dto/
│   │   ├── admin-user-query.dto.ts
│   │   ├── update-user-status.dto.ts
│   │   ├── create-tenant.dto.ts
│   │   └── update-tenant.dto.ts
│   ├── admin.controller.ts
│   ├── admin-tenant.controller.ts
│   ├── admin.module.ts
│   ├── user-admin.service.ts
│   └── tenant-admin.service.ts
├── course/
│   ├── dto/
│   ├── course.controller.ts
│   ├── course.module.ts
│   └── course.service.ts
├── lesson/
│   ├── dto/
│   ├── lesson.controller.ts
│   ├── lesson.module.ts
│   └── lesson.service.ts
├── progress/
│   ├── dto/
│   ├── progress.controller.ts
│   ├── progress.module.ts
│   └── progress.service.ts
└── common/
    ├── dto/
    ├── filters/
    ├── interceptors/
    ├── middleware/
    └── services/
```
