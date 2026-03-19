# Authentication Standards

**Tier:** POWERFUL
**Category:** Engineering / Security
**Domain:** Authentication & Authorization
**Maintainer:** LMS Agent Team

---

## Overview

Authentication flow for the LMS platform using Zustand for state management and JWT for session handling. Applies to both the Student Portal (`web-student`) and Admin Portal (`web-admin`). Multi-tenancy is enforced via the `x-tenant-id` header on every request.

## Core Capabilities

- **auth_store_management**: Managing login state, tokens, and user info via Zustand with localStorage persistence.
- **secure_token_handling**: Storing JWT in localStorage with expiry validation on the client side.
- **multi_tenant_auth**: Enforcing tenant isolation via `x-tenant-id` header on every API request.
- **centralized_401_handling**: Axios response interceptor handles token expiry and redirects to login.
- **dto_alignment**: Frontend-backend field alignment (fullName, password minLength 8, tenantId).

## When to Use

Use when:
- Implementing login, registration, or logout flows.
- Making authenticated API calls from any frontend app.
- Adding role-based access control guards.
- Modifying JWT payload or token refresh logic.

Skip when:
- Working on purely public pages (marketing, landing).
- Server-side API calls that use service-level auth (not user JWT).
- Working in the API server auth module (see `nestjs-standards` instead).

## Key Workflows

### Registration Flow

1. Collect `fullName`, `email`, `password` (min 8 characters) on the frontend form.
2. POST to `/api/auth/register` with `{ fullName, email, password }`.
3. Optionally include `tenantId` in the body or rely on the `x-tenant-id` header.
4. On success, backend returns `{ token, user }` wrapped in `{ success: true, data: { token, user } }`.
5. Store `token` and `user` in localStorage via Zustand store.
6. Redirect to the appropriate dashboard based on user role.

### Login Flow

1. Collect `email`, `password` on the login form.
2. POST to `/api/auth/login` with `{ email, password }`.
3. On success, extract `token` and `user` from `response.data.data`.
4. Store in localStorage and update Zustand state.
5. Axios interceptor automatically attaches `Authorization: Bearer <token>` and `x-tenant-id` on subsequent requests.

### Token Refresh (Client-Side)

1. `checkAuth()` runs on app initialization to restore session from localStorage.
2. Decode JWT payload (`JSON.parse(atob(token.split(".")[1]))`) to check `exp`.
3. If expired, clear localStorage and redirect to `/vi/login`.
4. Return URL is preserved via query param for post-login redirect.

### Multi-Tenant Request Pattern

Every API call from a frontend app must include:
- `Authorization: Bearer <token>` - JWT token from login.
- `x-tenant-id: <uuid>` - Tenant UUID stored in localStorage after tenant selection.

Both are injected automatically by the Axios request interceptor.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Storing tokens in plain localStorage without expiry check | Always validate JWT `exp` claim in `checkAuth()` before trusting the token. |
| Missing `x-tenant-id` header on tenant-scoped requests | Rely on the Axios request interceptor to inject it automatically from localStorage. |
| Clearing only token but not user on logout | Always clear both `token` and `user` from localStorage in the `logout()` action. |
| Not handling 401 on all API calls | The Axios response interceptor handles 401 globally for all apps using the shared `api` instance. |
| Hardcoding tenant context instead of using middleware | Use `TenantMiddleware` on the backend to extract `x-tenant-id` from headers. |

## Best Practices

1. **Always use the Axios interceptor** for attaching tokens -- never manually set headers in individual API calls.
2. **Validate JWT expiry client-side** on app load to prevent stale sessions.
3. **Clear all auth data on 401**: token, user, and any cached tenant data.
4. **Preserve return URL** when redirecting to login so users return to their original page after auth.
5. **Keep password minimum at 8 chars** -- align DTO validation with frontend form validation.
6. **Store only serializable user data** in localStorage -- the `user` object should be JSON-serializable.

## Related Skills

| Skill | Use When |
|---|---|
| nestjs-standards | Implementing auth controllers/services in the NestJS API server |
| api-design-reviewer | Reviewing auth-related API endpoints for REST compliance |
| db-intelligence | Managing user/tenant data in the database |
| testing-strategy | Writing tests for auth flows (unit, integration, E2E) |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
