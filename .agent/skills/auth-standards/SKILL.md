---
name: LMS Authentication Standards
description: Instructions for managing the Zustand + JWT authentication flow across student and admin portals.
---

# LMS Authentication Standards Skill

This skill ensures consistent and secure authentication implementation across the platform.

## 1. Auth Store (Zustand)

- Store location: `src/features/auth/auth.store.ts`.
- Persists to `localStorage`: `token` and `user`.
- Methods: `login`, `register`, `logout`, `checkAuth`.

## 2. Registration Requirements

- **FullName**: Backend expects `fullName` field.
- **Password**: Minimum 8 characters.
- **TenantID**: Automatically handled via `AuthController` in the backend by injecting `req.tenantId` from the middleware. Frontend should NOT strictly need to send UUID in body if header is present, but it's optional in DTO.

## 3. Login Flow

- On success: Store token, update `isAuthenticated`, close modal.
- On error: Use `auth.store` errors and `t("auth.error...")` for display.

## 4. Protected Routes

- Use `useAuthStore`'s `isAuthenticated` for client-side guards.
- Check `user.role` for permission-based UI rendering.
