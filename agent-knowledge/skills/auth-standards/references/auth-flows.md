# Authentication Flows Reference

Detailed documentation for cookie-backed browser authentication, CSRF handling, API tooling auth, and multi-tenancy patterns in the LMS platform.

---

## Browser Session Flow

```text
User login/register
    |
    v
POST /api/auth/login or /api/auth/register
    |
    v
Backend validates tenant, credentials, and active account state
    |
    v
Backend sets access_token HttpOnly cookie and csrf_token readable cookie
    |
    v
Backend returns { user } without returning the JWT body to browser code
    |
    v
Frontend stores safe user data for UX state only
    |
    v
Axios sends cookies with withCredentials and x-csrf-token when csrf_token exists
```

The JWT still exists server-side, but browser code must not store it in localStorage or treat it as client authority.

---

## Cookie Storage Pattern

The LMS browser flow uses:

- `access_token`: HttpOnly cookie set by the API. JavaScript cannot read it.
- `csrf_token`: readable cookie set by the API. `@repo/api-client` copies it into `x-csrf-token`.
- `user`: optional safe localStorage cache when `persistUser` is enabled.
- `token` and `tenantId`: legacy localStorage keys that must be removed on login, logout, and 401.

```typescript
// On login success, the response shape is { user }.
const response = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
persistSafeUser(response.data.user);

// Never persist the JWT in browser storage.
localStorage.removeItem('token');
localStorage.removeItem('tenantId');
```

### JWT Payload Structure

Typical JWT payload from the LMS auth service:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "STUDENT | ADMIN | SUPER_ADMIN",
  "tenantId": "tenant-uuid",
  "iat": 1710000000,
  "exp": 1710086400
}
```

This payload is validated by the API. Browser apps should restore auth by calling `/api/users/me`, not by decoding the token.

---

## API Client Pattern

All apps use `createApiClient` from `@repo/api-client`:

```typescript
// apps/web-student/src/lib/api.ts
import { createApiClient } from '@repo/api-client';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
});
```

The shared client:

- Enables `withCredentials: true`.
- Reads `csrf_token` from `document.cookie` and sends `x-csrf-token`.
- Sends `x-tenant-id` only from local browser hosts by default.
- Clears legacy auth keys and redirects on 401.
- Unwraps API responses that use `{ success: true, data }`.

Use `sendTenantHeaderInProduction: true` only for trusted deployments where a production browser is intentionally allowed to provide the tenant hint. The preferred production path is host/domain-based tenant resolution.

---

## Bearer Token Compatibility

The API accepts `Authorization: Bearer <token>` because `JwtStrategy` extracts credentials from both the header and the `access_token` cookie.

Use Bearer auth only for:

- Swagger/manual API exploration.
- Server-to-server clients.
- Integration tests that are not exercising browser cookie behavior.
- Operational tooling.

Do not add Bearer injection to web portal API clients.

---

## Multi-Tenancy Auth Patterns

### Backend: TenantMiddleware

Located at `apps/api-server/src/common/middleware/tenant.middleware.ts`.

Priority order:

1. Trusted tenant hint from request headers in local/dev or explicit deployment configuration.
2. Host/domain-derived tenant context.
3. Authenticated user's `tenantId` for protected routes when no separate request tenant is present.

The middleware validates that the tenant is active before attaching `req.tenantId`.

### Tenant Scoping in Services

Services requiring tenant isolation receive the scoped tenant ID and include it in Prisma filters:

```typescript
async findAllByTenant(tenantId: string): Promise<Course[]> {
  return this.prisma.course.findMany({
    where: { tenantId, deletedAt: null },
  });
}
```

For learning resources, prefer `LearningAccessService.courseWhere()` and `lessonWhere()` so student enrollment checks stay consistent.

---

## Auth Store Pattern

All web apps use the shared store factory from `@repo/shared`:

```typescript
import { createAuthStore } from '@repo/shared';
import api from '../../lib/api';

export const useAuthStore = createAuthStore({
  api,
  persistUser: true,
});
```

Key behaviors:

- `checkAuth()` calls `/users/me` with `skipUnauthorizedRedirect: true`.
- `login()` and `register()` expect `{ user }`; cookies are handled by the browser.
- `logout()` calls `/auth/logout`, then clears local state.
- Legacy `token` and `tenantId` localStorage keys are removed.
- `user` can be persisted for UX hydration, but it is not an auth authority.

---

## Registration DTO Alignment

Frontend form fields must match backend DTOs:

| Field        | Frontend        | Backend DTO                | Validation                     |
| ------------ | --------------- | -------------------------- | ------------------------------ |
| display name | `fullName`      | `fullName: string`         | `@IsString()`, `@MinLength(2)` |
| email        | `email`         | `email: string`            | `@IsEmail()`                   |
| password     | `password`      | `password: string`         | `@MinLength(8)`                |
| tenant       | request context | middleware-resolved tenant | active tenant required         |

---

## Logout Flow

```text
User clicks logout
    |
    v
Zustand logout() POSTs /api/auth/logout with x-csrf-token
    |
    v
API clears access_token and csrf_token cookies
    |
    v
Store clears user and legacy localStorage keys
    |
    v
Router redirects to /vi/login
```
