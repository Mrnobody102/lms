# Authentication Flows Reference

Detailed documentation for JWT flows, token storage, Axios interceptors, and multi-tenancy patterns in the LMS platform.

---

## JWT Token Flow

```
User Login
    |
    v
POST /api/auth/login { email, password }
    |
    v
Backend validates credentials, generates JWT with { userId, email, role, tenantId }
    |
    v
Returns { token: "<jwt>", user: { id, email, fullName, role } }
    |
    v
Frontend stores token + user in Zustand (localStorage persisted)
    |
    v
Axios interceptor auto-attaches Authorization header on every request
```

---

## Token Storage Pattern

The LMS platform stores auth data in localStorage via Zustand:

```typescript
// On login success
localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));
localStorage.setItem("tenantId", tenantId); // Set during tenant selection

// On logout
localStorage.removeItem("token");
localStorage.removeItem("user");
// tenantId is kept for convenience but can also be cleared
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

---

## Axios Interceptor Examples

### Request Interceptor (Token + Tenant Injection)

This pattern is used across `web-student`, `web-admin`, and `super-portal`:

```typescript
// apps/web-student/src/lib/api.ts
import axios, { InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Inject tenant ID
  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
  }

  // Inject auth token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

### Response Interceptor (401 Handling)

```typescript
api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear auth state
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Preserve return URL
        const returnUrl = window.location.pathname;
        const loginPath = "/vi/login";
        const redirect =
          returnUrl !== loginPath
            ? `${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`
            : loginPath;

        window.location.href = redirect;
      }
    }
    return Promise.reject(error);
  },
);
```

### Server Response Wrapper

The NestJS backend wraps all responses via `ResponseInterceptor`:

```typescript
// apps/api-server/src/common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Preserve existing wrapped responses
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }
        // Wrap unwrapped responses
        return { success: true, data };
      }),
    );
  }
}
```

Therefore, the frontend accesses auth data via:
```typescript
const { token, user } = response.data.data;
```

---

## Multi-Tenancy Auth Patterns

### Backend: TenantMiddleware

Located at `apps/api-server/src/common/middleware/tenant.middleware.ts`:

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === "OPTIONS") return next();

    const tenantId =
      req.headers["x-tenant-id"] ||
      this.getTenantFromDomain(req); // Fallback: subdomain parsing

    if (!tenantId) throw new BadRequestException("Tenant ID is missing");

    (req as any).tenantId = tenantId;
    next();
  }
}
```

Priority order:
1. `x-tenant-id` header (explicit, client-supplied)
2. Subdomain parsing (e.g., `trung-tam-demo.lms.com` -> `trung-tam-demo`)

### Tenant Scoping in Services

Services requiring tenant isolation receive `tenantId` from the middleware:

```typescript
// In a NestJS service
async findAllByTenant(tenantId: string): Promise<Course[]> {
  return this.prisma.course.findMany({
    where: { tenantId },
  });
}
```

### Frontend: Tenant Selection

On tenant selection (e.g., after login or from a tenant picker):
```typescript
localStorage.setItem("tenantId", selectedTenant.id);
```

All subsequent API calls automatically include the tenant ID via the request interceptor.

---

## Auth Store Pattern (Zustand)

All three apps (`web-student`, `web-admin`, `super-portal`) use the same pattern:

```typescript
// apps/web-student/src/features/auth/auth.store.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}
```

Key behaviors:
- `isInitialized: false` until `checkAuth()` runs on mount.
- `checkAuth()` validates token expiry before restoring session.
- `logout()` clears localStorage and resets state.
- `register()` includes `fullName` field (required by backend DTO).

---

## Registration DTO Alignment

Frontend form fields must match backend DTOs:

| Field | Frontend | Backend DTO | Validation |
|---|---|---|---|
| display name | `fullName` | `fullName: string` | `@IsString()`, `@MinLength(2)` |
| email | `email` | `email: string` | `@IsEmail()` |
| password | `password` | `password: string` | `@MinLength(8)` |
| tenant | `tenantId` | body or `x-tenant-id` header | UUID format |

---

## Logout Flow

```
User clicks logout
    |
    v
Zustand logout() clears localStorage (token + user)
    |
    v
State resets: isAuthenticated = false, user = null, token = null
    |
    v
Router redirects to /vi/login
    |
    v
checkAuth() finds no token -> isInitialized = true, no redirect
```
