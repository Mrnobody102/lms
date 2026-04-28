# Authentication Standards

**Tier:** POWERFUL
**Category:** Engineering / Security
**Domain:** Authentication & Authorization
**Maintainer:** LMS Agent Team

---

## Overview

Authentication flow for the LMS platform using HttpOnly auth cookies for browser sessions, a CSRF double-submit cookie/header, and Zustand for client UX state. Applies to `web-student`, `web-admin`, and `super-portal`. Multi-tenancy is resolved by the API from trusted host/domain context, with `x-tenant-id` used only as a local/dev or explicitly trusted deployment hint.

## Core Capabilities

- **auth_store_management**: Managing login state and safe user info via Zustand; never treat localStorage as auth authority.
- **secure_cookie_handling**: Browser sessions use the `access_token` HttpOnly cookie and `csrf_token` readable cookie for state-changing requests.
- **multi_tenant_auth**: Enforcing tenant isolation with backend tenant middleware and tenant-scoped queries.
- **centralized_401_handling**: Axios response interceptor clears legacy local auth data and redirects to login.
- **dto_alignment**: Frontend-backend field alignment (fullName, password minLength 8, tenantId).

## When to Use

Use when:

- Implementing login, registration, or logout flows.
- Making authenticated API calls from any frontend app.
- Adding role-based access control guards.
- Modifying JWT payload, cookie options, CSRF behavior, or token extraction logic.

Skip when:

- Working on purely public pages (marketing, landing).
- Server-side API calls that use service-level auth (not user JWT).
- Working in the API server auth module (see `nestjs-standards` instead).

## Key Workflows

### Registration Flow

1. Collect `fullName`, `email`, `password` (min 8 characters) on the frontend form.
2. POST to `/api/auth/register` with `{ fullName, email, password }`.
3. Provide tenant context through the request host/domain in production, or `x-tenant-id` in local/dev.
4. On success, backend sets `access_token` (HttpOnly) and `csrf_token` cookies, then returns `{ user }`.
5. Store only safe user data in Zustand/localStorage when `persistUser` is enabled.
6. Redirect to the appropriate dashboard based on user role.

### Login Flow

1. Collect `email`, `password` on the login form.
2. POST to `/api/auth/login` with `{ email, password }`.
3. On success, backend sets `access_token` (HttpOnly) and `csrf_token` cookies, then returns `{ user }`.
4. Store only safe user data and update Zustand state.
5. Axios sends cookies with `withCredentials: true` and attaches `x-csrf-token` from the CSRF cookie on state-changing requests.

### Session Restore

1. `checkAuth()` runs on app initialization and calls `/api/users/me` with credentials.
2. If the cookie-backed session is valid, store the returned safe user data.
3. If the API returns 401, clear legacy local auth keys (`token`, `user`, `tenantId`) and redirect to login when appropriate.
4. Return URL is preserved via query param for post-login redirect.

### Multi-Tenant Request Pattern

Browser API calls must use the shared `@repo/api-client` client:

- `withCredentials: true` so the `access_token` cookie is sent by the browser.
- `x-csrf-token` copied from `csrf_token` cookie when present.
- `x-tenant-id` only on local browser hosts by default, unless `sendTenantHeaderInProduction` is intentionally enabled.

`Authorization: Bearer <token>` is still accepted by the API for tooling, manual API tests, server-to-server clients, and Swagger-style exploration. Do not use Bearer/localStorage for normal browser auth.

## Common Pitfalls

| Pitfall                                                   | Fix                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Storing JWTs in `localStorage` for browser auth           | Use the HttpOnly `access_token` cookie; Zustand may persist only safe user data.                  |
| Missing CSRF header on cookie-backed state changes        | Use `@repo/api-client`; it reads `csrf_token` and sends `x-csrf-token`.                           |
| Sending `x-tenant-id` from production browsers by default | Resolve tenant by host/domain unless a trusted deployment explicitly opts in.                     |
| Clearing only user but not legacy token keys              | Clear `token`, `user`, and `tenantId` on logout/401 to remove old sessions.                       |
| Not handling 401 on all API calls                         | The Axios response interceptor handles 401 globally for all apps using the shared `api` instance. |
| Hardcoding tenant context in services                     | Use request tenant scope and tenant-aware Prisma filters.                                         |

## Best Practices

1. **Always use the shared API client** for cookie, CSRF, tenant hint, and 401 behavior.
2. **Do not read or decode JWTs in browser code**; validate the session with `/users/me`.
3. **Clear all legacy auth data on 401**: token, user, and any cached tenant data.
4. **Preserve return URL** when redirecting to login so users return to their original page after auth.
5. **Keep password minimum at 8 chars** -- align DTO validation with frontend form validation.
6. **Store only serializable, non-sensitive user data** in localStorage -- never store access tokens.

## Related Skills

| Skill               | Use When                                                        |
| ------------------- | --------------------------------------------------------------- |
| nestjs-standards    | Implementing auth controllers/services in the NestJS API server |
| api-design-reviewer | Reviewing auth-related API endpoints for REST compliance        |
| db-intelligence     | Managing user/tenant data in the database                       |
| testing-strategy    | Writing tests for auth flows (unit, integration, E2E)           |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
