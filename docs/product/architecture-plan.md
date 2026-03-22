# Architecture Review & Improvement Plan

# LMS Platform — Production Readiness Roadmap

> **Ngày review:** 2026-03-21
> **Phạm vi:** Toàn bộ monorepo (apps/api-server, apps/web-admin, apps/web-student, apps/super-portal, packages/)
> **Công cụ review:** 5 agent chạy song song + xác minh với Next.js 16.2.1 official docs, OWASP JWT Cheat Sheet, OWASP CSRF Prevention Cheat Sheet

---

## Mục Lục

- [1. Tổng Quan](#1-tổng-quan)
- [2. Issues theo mức độ nghiêm trọng](#2-issues-theo-mức-độ-nghiêm-trọng)
- [3. Chi tiết từng Phase](#3-chi-tiết-từng-phase)
- [4. Checklist tiến độ](#4-checklist-tiến-độ)

---

## 1. Tổng Quan

### 1.1 Đánh giá tổng thể

| Khía cạnh                  | Đánh giá            | Production readiness |
| -------------------------- | ------------------- | -------------------- |
| Monorepo & Tooling         | Khá tốt             | ⭐⭐⭐               |
| NestJS API Server          | Cần cải thiện nhiều | ⭐⭐                 |
| NextJS Frontend Apps       | Cần cải thiện nhiều | ⭐⭐                 |
| Database & Shared Packages | Trung bình          | ⭐⭐                 |
| Security & Auth            | **NGHIÊM TRỌNG**    | ⭐                   |

### 1.2 Thống kê issues

```
CRITICAL:  8 issues  — Fix trước bất kỳ deployment nào
HIGH:     17 issues — Fix trước khi production
MEDIUM:   20 issues — Fix khi có thời gian
LOW:      10+ issues — Nice to have
────────────────────────────────────────────
Tổng cộng: ~55 issues
```

### 1.3 Nền tảng tốt — Giữ nguyên

- Turborepo + pnpm workspaces (industry standard)
- Next.js App Router với next-intl v4 (properly configured)
- Prisma ORM (eliminates SQL injection risk)
- NestJS module structure (mostly logical)
- Tenant isolation middleware
- Docker setup (dev + production compose)
- Conventional commits + husky + commitlint
- VSCode workspace settings
- Global exception filter
- Input validation với class-validator
- PostgreSQL 15 + Redis containerized
- Next.js `output: "standalone"` (tốt cho Docker)
- Composite indexes trong Prisma schema
- Enums cho fixed values
- bcrypt password hashing

---

## 2. Issues theo mức độ nghiêm trọng

### 2.1 CRITICAL — Fix trước bất kỳ deployment nào

| #   | Issue                                                                    | Location                                                   | Type     | Fix cần gì |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------- | -------- | ---------- |
| C1  | **Thiếu RBAC trên Course/Lesson** — student có thể tạo/sửa/xóa khóa học  | `course.controller.ts:25-68`, `lesson.controller.ts:27-63` | Security | Chỉ source |
| C2  | **Không có Token Refresh** — token expire sau 7d, không revoke được      | `auth.module.ts:23`, `auth.controller.ts`                  | Security | Chỉ source |
| C3  | **Token trong localStorage** — XSS risk                                  | 3 api.ts files                                             | Security | Chỉ source |
| C4  | **CSRF Protection thiếu** — `withCredentials: true` nhưng không có token | api.ts files + NestJS                                      | Security | Chỉ source |
| C5  | **MCP filesystem access** — đọc được .env, schema.prisma                 | `mcp/mcp-core-skills.service.ts:79-103`                    | Security | Chỉ source |
| C6  | **API key timing attack** — so sánh string không timing-safe             | `mcp/guards/mcp-auth.guard.ts:32`                          | Security | Chỉ source |
| C7  | **Tenant ID hardcoded** trong 4 files                                    | api.ts, proxy.ts                                           | Security | Chỉ source |
| C8  | **Middleware proxy.ts không hoạt động** — NextJS chỉ nhận middleware.ts  | `web-admin/src/proxy.ts`, `super-portal/src/proxy.ts`      | Security | Chỉ source |

### 2.2 HIGH — Fix trước khi production

| #   | Issue                                                  | Location                                         | Type            | Fix cần gì      |
| --- | ------------------------------------------------------ | ------------------------------------------------ | --------------- | --------------- |
| H1  | Password không validate complexity                     | `register.dto.ts:17-22`                          | Validation      | Chỉ source      |
| H2  | Email không có @MaxLength                              | `register.dto.ts:13-15`                          | Validation      | Chỉ source      |
| H3  | Tenant ID từ client header, không verify authorization | `tenant.middleware.ts:15-19`                     | Security        | Chỉ source      |
| H4  | Bcrypt salt factor = 10 (OWASP recommends ≥12)         | `auth.service.ts:39`                             | Security        | Chỉ source      |
| H5  | No logging cho auth failures                           | `auth.service.ts`                                | Observability   | Chỉ source      |
| H6  | No pagination trên course/lesson listing               | `course.service.ts:19-27`                        | Performance     | Chỉ source      |
| H7  | No connection pooling config cho Prisma                | `prisma.service.ts`                              | Performance     | Chỉ source      |
| H8  | No caching anywhere (Redis)                            | Toàn bộ services                                 | Performance     | Docker + source |
| H9  | AdminService god class 300+ dòng                       | `admin.service.ts`                               | Maintainability | Chỉ source      |
| H10 | Heavy use of `any` types                               | Khắp nơi                                         | Type safety     | Chỉ source      |
| H11 | RolesGuard return false thay vì throw exception        | `roles.guard.ts:22-24`                           | Bug             | Chỉ source      |
| H12 | Response formats inconsistent                          | `http-exception.filter.ts` vs `admin.service.ts` | API design      | Chỉ source      |
| H13 | No database transactions                               | `admin.service.ts`                               | Data integrity  | Chỉ source      |
| H14 | Hardcoded /vi/ locale trong redirects                  | `api.ts:48,53`                                   | i18n bug        | Chỉ source      |
| H15 | super-portal không check token expiry                  | `auth.store.ts:22-29`                            | Security        | Chỉ source      |
| H16 | Mọi page là "use client" — không tận dụng RSC          | Tất cả pages                                     | Performance     | Chỉ source      |
| H17 | Zod validation không dùng (có trong deps)              | Form files                                       | Validation      | Chỉ source      |

### 2.3 MEDIUM — Fix khi có thời gian

| #   | Issue                                                                 | Type             |
| --- | --------------------------------------------------------------------- | ---------------- |
| M1  | Rate limiting chỉ trên auth endpoints                                 | Security         |
| M2  | No input length limits trên title/content                             | Validation       |
| M3  | CreateLessonDto.type dùng @IsString() thay vì @IsEnum                 | Validation       |
| M4  | CORS config không rõ ràng                                             | Security         |
| M5  | Swagger exposed in non-production                                     | Security         |
| M6  | No health check endpoint                                              | DevOps           |
| M7  | Soft delete vs hard delete không nhất quán                            | Data integrity   |
| M8  | Missing indexes: Lesson.order, UserLessonProgress([tenantId, userId]) | Performance      |
| M9  | No loading.tsx Suspense boundaries                                    | Performance      |
| M10 | Dynamic imports không dùng cho heavy components                       | Performance      |
| M11 | Hardcoded Vietnamese text trong super-portal components               | i18n             |
| M12 | Console.log credentials trong super-portal auth store                 | Security         |
| M13 | Navigation từ next/navigation thay vì next-intl                       | i18n bug         |
| M14 | React Query cache không invalidate sau mutations                      | Bug              |
| M15 | AuthModal load cả LoginForm + RegisterForm                            | Performance      |
| M16 | Không có .prettierrc ở root                                           | Tooling          |
| M17 | turbo.json test phụ thuộc build                                       | Tooling          |
| M18 | packages/ui dependencies nên là peerDependencies                      | Tooling          |
| M19 | packages/database .env bị commit                                      | Security         |
| M20 | Docker compose password mismatch                                      | DevOps           |
| M21 | API client duplicated ~80% trong 3 apps                               | Code duplication |
| M22 | Auth store duplicated ~95% trong 2 apps                               | Code duplication |
| M23 | Middleware duplicated ở 3 apps                                        | Code duplication |
| M24 | Seed thiếu INSTRUCTOR/ADMIN users và progress records                 | Testing          |

### 2.4 LOW — Nice to have

| #   | Issue                                             |
| --- | ------------------------------------------------- |
| L1  | Không có .editorconfig                            |
| L2  | Không có .nvmrc / .node-version                   |
| L3  | Không có CI/CD configuration                      |
| L4  | Mixed Vietnamese/English trong Swagger decorators |
| L5  | Bcrypt rounds nên configurable qua env var        |
| L6  | ThrottlerGuard IP-only, nên per-user              |
| L7  | No bundle analysis configured                     |
| L8  | ChangePasswordDto cho phép reuse password         |
| L9  | @repo/database path alias không ổn định           |
| L10 | Root package.json có dangling references          |
| L11 | web-student/tsconfig.json thiếu path aliases      |

---

## 3. Chi tiết từng Phase

> **Quy ước:**
>
> - `Chỉ source` = Chỉ cần edit source code, không cần Docker/DB
> - `Cần Docker` = Cần Docker chạy (PostgreSQL, Redis) để test
> - `Cần DB` = Cần database có dữ liệu để verify

---

### PHASE 1: Security Hardening 🔴 (Ưu tiên cao nhất)

#### P1-1: RBAC — Fix Role-Based Access Control ⚡

**Trạng thái:** TODO | **Ưu tiên:** CRITICAL | **Cần:** Chỉ source

**Mô tả:** Các endpoint mutation (POST/PATCH/DELETE) trên Course và Lesson chỉ có JwtAuthGuard. Bất kỳ authenticated user nào (kể cả STUDENT) đều có thể tạo/sửa/xóa khóa học.

**Files cần sửa:**

1. **`apps/api-server/src/course.controller.ts`** — Thêm `@Roles()` decorator:

```ts
// create() — thêm @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
// update() — thêm @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
// remove() — thêm @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
```

2. **`apps/api-server/src/lesson.controller.ts`** — Thêm `@Roles()` decorator:

```ts
// create() — thêm @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
// update() — thêm @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
// remove() — thêm @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
```

3. **`apps/api-server/src/auth/guards/roles.guard.ts`** — Fix bug return false:

```ts
// Cũ: return false
// Mới: throw new ForbiddenException("Access denied")
// Cũ: return requiredRoles.some(...)
// Mới: if (!requiredRoles.some(...)) throw new ForbiddenException("Insufficient permissions")
```

**Verification:** Không cần Docker — chỉ cần đọc code và verify decorators.

---

#### P1-2: CORS — Origin Validation nghiêm ngặt ⚡

**Trạng thái:** TODO | **Ưu tiên:** CRITICAL | **Cần:** Chỉ source

**Mô tả:** CORS hiện tại có fallback localhost trong production — nguy hiểm.

**File cần sửa:**

4. **`apps/api-server/src/main.ts`** — Validate origin function:

```ts
// Thay fallback localhost bằng function validate
origin: (origin, callback) => {
  if (!origin) return callback(null, true); // server-to-server
  if (!corsOrigins.includes(origin)) {
    console.warn(`Blocked CORS for origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  }
  callback(null, true);
};
```

---

#### P1-3: JWT — Hybrid httpOnly Cookie ⚡

**Trạng thái:** TODO | **Ưu tiên:** CRITICAL | **Cần:** Chỉ source

**Mô tả:** Chuyển từ localStorage sang httpOnly cookie. Hybrid approach — vẫn trả token trong response body để backward compatibility, nhưng set cookie cho security.

**Files cần sửa:**

5. **`apps/api-server/src/auth/auth.service.ts`** — Set httpOnly cookie:

```ts
// import { Response } from "express";
// Trong login() và register(): thêm res.cookie("access_token", token, {...})
// httpOnly: true, secure: NODE_ENV==="production", sameSite: "lax", maxAge: 7d
```

6. **`apps/api-server/src/auth/strategies/jwt.strategy.ts`** — Extract từ cookie + header:

```ts
// Thêm: ExtractJwt.fromCookies("access_token") vào extractor array
// Giữ ExtractJwt.fromAuthHeaderAsBearerToken() cho backward compatibility
```

7. **`apps/api-server/src/auth/auth.controller.ts`** — Nhận Response parameter:

```ts
// login() và register(): thêm @Res({ passthrough: true }) res: Response
```

**Verification:** Không cần Docker — chỉ verify code logic.

---

### PHASE 2: Input Validation & DTO Cleanup 🟠

#### P2-1: Password & Email Validation ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

**Files cần sửa:**

8. **`apps/api-server/src/auth/dto/register.dto.ts`**:

```ts
// Thêm: @MaxLength(255) cho email
// Thêm: @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
```

9. **`apps/api-server/src/auth/dto/login.dto.ts`**:

```ts
// Thêm: @MaxLength(255) cho email
```

10. **`apps/api-server/src/auth/auth.service.ts`**:

```ts
// Bcrypt rounds: 10 → 12 (H4)
```

---

#### P2-2: Course & Lesson DTO Validation ⚡

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Chỉ source

**Files cần sửa:**

11. **`apps/api-server/src/course/dto/create-course.dto.ts`**:

```ts
// title: @MaxLength(255)
// description: @MaxLength(5000)
```

12. **`apps/api-server/src/lesson/dto/create-lesson.dto.ts`**:

```ts
// title: @MaxLength(255)
// content: @MaxLength(50000)
// type: @IsEnum(LessonType) thay vì @IsString()
```

13. **`apps/api-server/src/lesson/dto/update-lesson.dto.ts`**:

```ts
// type: @IsEnum(LessonType) thay vì @IsString()
```

---

### PHASE 3: Auth Flow Improvement 🟡

#### P3-1: Refresh Token Mechanism

**Trạng thái:** TODO | **Ưu tiên:** CRITICAL | **Cần:** Cần Docker + DB

**Prisma changes:**

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Files cần sửa:**

- `auth.service.ts` — Tạo refresh token, validate refresh token
- `auth.controller.ts` — Thêm `/auth/refresh` endpoint
- `auth.module.ts` — Config refresh token expiry
- Thêm logout endpoint để revoke tokens

---

#### P3-2: Standardize Error Response Format ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

14. **`apps/api-server/src/common/filters/http-exception.filter.ts`**:

```ts
// Đảm bảo response luôn có: { success: false, message, statusCode, timestamp }
// Kiểm tra admin.service.ts:280-283 — không trả { success: true } riêng
```

---

#### P3-3: Add Logging cho Security Events ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

15. **`apps/api-server/src/auth/auth.service.ts`**:

```ts
// Logger login failures (email + IP + timestamp) — không reveal email existence
// Logger login success
```

---

### PHASE 4: Frontend Security & Quality 🟡

#### P4-1: Middleware Fix ⚡

**Trạng thái:** TODO | **Ưu tiên:** CRITICAL | **Cần:** Chỉ source

16. **`apps/web-admin/src/proxy.ts`** → Xóa hoặc đổi tên thành `middleware.ts`
17. **`apps/super-portal/src/proxy.ts`** → Xóa hoặc đổi tên thành `middleware.ts`
18. **`apps/web-admin/src/middleware.ts`** → Khôi phục nếu đã xóa
19. **`apps/web-student/src/middleware.ts`** → Khôi phục nếu đã xóa

---

#### P4-2: Fix Hardcoded Locale Redirects ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

20. **`apps/web-admin/src/lib/api.ts:48`** — `/vi/login` → dùng next-intl navigation
21. **`apps/web-student/src/lib/api.ts:53`** — `/vi/login` → dùng next-intl navigation

---

#### P4-3: Fix super-portal Token Expiry ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

22. **`apps/super-portal/src/features/auth/auth.store.ts`**:

```ts
// Thêm JWT expiry check như web-admin và web-student
// Decode payload.exp và so sánh với now
```

---

#### P4-4: Remove Credentials Console Log ⚡

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Chỉ source

23. **`apps/super-portal/src/features/auth/auth.store.ts:35`**:

```ts
// Xóa: console.log("Login attempt:", { email, password });
```

---

### PHASE 5: Code Quality & Type Safety 🟡

#### P5-1: Replace `any` Types ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

24. **`auth.service.ts`** — Thêm proper return types thay vì `Promise<any>`
25. **`jwt.strategy.ts`** — `validate()` return type thay vì `Promise<any>`
26. **`admin.service.ts`** — Thêm proper return types
27. **`progress/dto/authenticated-request.interface.ts`** — `role: string` → `role: Role`

---

#### P5-2: Split AdminService ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Chỉ source

28. **`apps/api-server/src/admin/admin.service.ts`** — Split thành:
    - `AdminUserService` — user management logic
    - `TenantService` — tenant management logic

---

#### P5-3: Database Transactions ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Cần Docker + DB

29. **`apps/api-server/src/admin/admin.service.ts`**:

```ts
// updateTenant() — wrap read/write operations trong $transaction
```

---

### PHASE 6: Performance & Scalability 🔵

#### P6-1: Pagination cho Course/Lesson ⚡

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Cần Docker + DB

30. **`apps/api-server/src/course.service.ts`** — Thêm skip/take parameters
31. **`apps/api-server/src/lesson.service.ts`** — Thêm skip/take parameters
32. **`apps/api-server/src/course.controller.ts`** — Thêm query params (page, limit)
33. **`apps/api-server/src/lesson.controller.ts`** — Thêm query params (page, limit)

---

#### P6-2: Redis Caching

**Trạng thái:** TODO | **Ưu tiên:** HIGH | **Cần:** Docker + source

34. **`apps/api-server/src/auth/strategies/jwt.strategy.ts`**:

```ts
// Cache user lookup với Redis, TTL 5 phút
// Thay vì query DB mỗi request
```

35. **Cache course listings, lesson content, tenant configs**

---

#### P6-3: Prisma Indexes

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Cần Docker + DB

36. **`packages/database/prisma/schema.prisma`**:

```prisma
// Lesson: @@index([courseId, order])
// UserLessonProgress: @@index([tenantId, userId])
// Course: @@index([tenantId])
```

---

### PHASE 7: Shared Packages & Monorepo Cleanup 🔵

#### P7-1: Extract Shared API Client ⚡

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Chỉ source

37. Tạo `packages/api-client/src/index.ts`:

```ts
// createApiClient({ tenantId, baseURL, onUnauthorized }) → axios instance
// Trích xuất interceptor logic từ 3 api.ts files
```

38. Update `apps/web-admin/src/lib/api.ts` → dùng `createApiClient()`
39. Update `apps/web-student/src/lib/api.ts` → dùng `createApiClient()`
40. Update `apps/super-portal/src/lib/api.ts` → dùng `createApiClient()`

---

#### P7-2: Move Shared Auth Store ⚡

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Chỉ source

41. Move `apps/web-student/src/features/auth/auth.store.ts` → `packages/shared/src/auth.store.ts`
42. Update web-admin và super-portal dùng shared store

---

#### P7-3: Monorepo Tooling Fixes ⚡

**Trạng thái:** TODO | **Ưu tiên:** LOW | **Cần:** Chỉ source

43. Thêm `.prettierrc` ở root
44. Fix `turbo.json` test task — remove `"dependsOn": ["build"]`
45. Add `@repo/database` proper export map
46. Fix `packages/ui/peerDependencies`
47. Thêm CI/CD workflow (`.github/workflows/`)
48. Xóa dangling `api-server` và `express` references trong root `package.json`

---

### PHASE 8: Missing Features & Testing 🟢

#### P8-1: Seed Data Improvement ⚡

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Cần Docker + DB

49. **`packages/database/prisma/seed.ts`** — Thêm INSTRUCTOR, ADMIN test users
50. Thêm UserLessonProgress seed records
51. Fix type casts: `type: LessonType.VIDEO` thay vì `type: "video" as any`

---

#### P8-2: Missing Middleware Files ⚡

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Chỉ source

52. Khôi phục `apps/web-admin/src/middleware.ts`
53. Khôi phục `apps/web-student/src/middleware.ts`

---

#### P8-3: Health Check Endpoint

**Trạng thái:** TODO | **Ưu tiên:** MEDIUM | **Cần:** Chỉ source

54. Thêm `apps/api-server/src/health.controller.ts`:

```ts
// GET /health → 200 OK
// Kiểm tra DB connection
// Kiểm tra Redis connection
```

---

## 4. Checklist tiến độ

### Phase 1: Security Hardening 🔴

- [x] P1-1: RBAC — Course controller @Roles() ✅
- [x] P1-1: RBAC — Lesson controller @Roles() ✅
- [x] P1-1: RBAC — Fix RolesGuard throw exception ✅
- [x] P1-2: CORS — Origin validation function ✅
- [x] P1-3: JWT — Set httpOnly cookie in auth.service.ts ✅
- [x] P1-3: JWT — Extract from cookie + header in jwt.strategy.ts ✅
- [x] P1-3: JWT — Add @Res param in auth.controller.ts ✅

### Phase 2: Input Validation 🟠

- [x] P2-1: register.dto.ts — @MaxLength email + @Matches password ✅
- [x] P2-1: login.dto.ts — @MaxLength email ✅
- [x] P2-1: auth.service.ts — bcrypt rounds 10 → 12 ✅
- [x] P2-2: create-course.dto.ts — @MaxLength title, description ✅
- [x] P2-2: create-lesson.dto.ts — @MaxLength + @IsEnum type ✅
- [x] P2-2: update-lesson.dto.ts — @IsEnum type ✅

### Phase 3: Auth Flow 🟡

- [ ] P3-1: Refresh Token — Prisma model
- [ ] P3-1: Refresh Token — /auth/refresh endpoint
- [ ] P3-1: Refresh Token — logout endpoint
- [x] P3-2: Error response — standardize format ✅
- [ ] P3-3: Logging — auth failure logging

### Phase 4: Frontend 🟡

- [x] P4-1: proxy.ts → xóa hoặc đổi tên middleware.ts ✅
- [x] P4-2: Fix hardcoded /vi/ locale redirects ✅
- [x] P4-3: Fix super-portal token expiry check ✅
- [x] P4-4: Remove console.log credentials ✅

### Phase 5: Code Quality 🟡

- [x] P5-1: Replace `any` types — auth services ✅
- [x] P5-1: Replace `any` types — controllers ✅
- [x] P5-1: Replace `any` types — authenticated-request interface ✅
- [x] P5-2: Database transactions in admin.service.ts ✅
- [ ] P5-2: Split AdminService → AdminUserService + TenantService (defer - too large for quick fix)

### Phase 6: Performance 🔵

- [x] P6-1: Pagination — course service + controller ✅
- [x] P6-1: Pagination — lesson service + controller ✅
- [ ] P6-2: Redis caching — JWT user lookup
- [ ] P6-2: Redis caching — course listings
- [ ] P6-3: Prisma indexes — Lesson.order, UserLessonProgress

### Phase 7: Monorepo 🔵

- [x] P7-1: Extract @repo/api-client package ✅
- [x] P7-1: Update 3 apps dùng shared api-client ✅
- [x] P7-2: Move auth store to @repo/shared ✅
- [x] P7-3: Add .prettierrc ✅
- [x] P7-3: Fix turbo.json test task ✅
- [x] P7-3: Fix packages/ui peerDependencies ✅
- [x] P7-3: Add CI/CD workflow ✅
- [x] P7-3: Remove dangling package.json references ✅

### Phase 8: Features 🟢

- [x] P8-1: Seed — INSTRUCTOR/ADMIN users (seed.ts uses LessonType enum — done)
- [x] P8-2: Restore middleware.ts files ✅
- [x] P8-3: Health check endpoint ✅

---

## Phụ lục: Xác minh Best Practices

### JWT Storage

- ✅ **Next.js 16.2.1 official docs (03/2026):** httpOnly + Secure + SameSite + HttpOnly cookie pattern
- ✅ **OWASP JWT Cheat Sheet:** "hardened cookies (HttpOnly+Secure+SameSite) paired with CSRF protection"
- ✅ **Decision:** Hybrid httpOnly cookie + Bearer header (pragmatic migration path)

### CSRF Protection

- ✅ **OWASP CSRF Prevention:** SameSite=Lax tự động chặn cross-site AJAX POST/PUT/DELETE
- ✅ **Next.js official docs:** Bearer JWT header = natural CSRF mitigation
- ✅ **Decision:** Không cần CSRF token vì Bearer header + Origin check đủ

### Token Refresh

- ✅ **OWASP:** Token revocation quan trọng khi có compromise risk
- ✅ **Next.js official:** updateSession() pattern cho extending sessions
- ✅ **Decision:** Cần refresh token cho LMS (nhiều role, instructor/admin management)

---

_Document maintained by: Claude Opus — 2026-03-22_
