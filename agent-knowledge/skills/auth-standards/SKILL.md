# Authentication Standards

**Tier:** POWERFUL  
**Category:** Engineering / Security  
**Maintainer:** LMS Agent Team

---

## Overview

Detailed guidelines for the standard Authentication flow (Zustand + JWT) within the LMS system, applicable to both Student and Admin portals.

## Core Capabilities

- **auth_store_management**: Managing login state, tokens, and user info via Zustand.
- **secure_session_handling**: Ensuring tokens are stored and refreshed safely (localStorage/Cookies).
- **dto_alignment**: Synchronizing data between Frontend and Backend (fullName, password minLength 8).

## Registration Process

1. **Frontend**: Collect `fullName`, `email`, and `password` (minimum 8 characters).
2. **Payload**: Backend requires the `fullName` field. `tenantId` can be sent in the body or automatically inferred from the `x-tenant-id` header.
3. **Validation**: Always check email format and password strength before sending the request.

## Authentication Flow

1. User logs in -> Receives JWT Token.
2. Store Token and User Info in `AuthStore` (with `localStorage` persistence).
3. Attach `Authorization: Bearer <token>` to all subsequent API requests.
4. Handle 401 (Unauthorized) logic centrally in Axios interceptors for automatic logout.
