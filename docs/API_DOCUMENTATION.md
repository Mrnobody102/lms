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

### 3. Start API Server

```bash
# From project root
pnpm dev
```

The API server will be available at: `http://localhost:4000/api`

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
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
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
│   │   └── update-user-status.dto.ts
│   ├── admin.controller.ts
│   ├── admin.module.ts
│   └── admin.service.ts
├── common/
│   ├── dto/
│   │   └── base-response.dto.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── middleware/
│   │   └── tenant.middleware.ts
│   └── services/
│       └── prisma.service.ts
├── app.module.ts
└── main.ts
```
