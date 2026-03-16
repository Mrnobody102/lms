# API Test Suite Builder

**Tier:** POWERFUL
**Category:** Engineering
**Domain:** Testing / API Quality

---

## Overview

Scans API route definitions across frameworks (Next.js App Router, Express, FastAPI, Django REST) and
auto-generates comprehensive test suites covering auth, input validation, error codes, pagination, file
uploads, and rate limiting. Outputs ready-to-run test files for Vitest+Supertest (Node) or Pytest+httpx
(Python).

---

## Core Capabilities

- **Route detection** — scan source files to extract all API endpoints
- **Auth coverage** — valid/invalid/expired tokens, missing auth header
- **Input validation** — missing fields, wrong types, boundary values, injection attempts
- **Error code matrix** — 400/401/403/404/422/500 for each route
- **Pagination** — first/last/empty/oversized pages
- **File uploads** — valid, oversized, wrong MIME type, empty
- **Rate limiting** — burst detection, per-user vs global limits

---

## When to Use

- New API added — generate test scaffold before writing implementation (TDD)
- Legacy API with no tests — scan and generate baseline coverage
- API contract review — verify existing tests match current route definitions
- Pre-release regression check — ensure all routes have at least smoke tests
- Security audit prep — generate adversarial input tests

---

## Route Detection

### Next.js App Router (PowerShell - Windows)

```powershell
# Tìm tất cả route handlers
Get-ChildItem -Path ./app/api -Filter "route.ts" -Recurse | Select-Object FullName

# Tìm các HTTP Methods (GET, POST, ...)
Select-String -Path "app/api/**/route.ts" -Pattern "export (async )?function (GET|POST|PUT|PATCH|DELETE)" | ForEach-Object { $_.Matches.Groups[2].Value } | Sort-Object -Unique
```

### Express (PowerShell - Windows)

```powershell
# Tìm các file router
Get-ChildItem -Path ./src -Include "*.ts","*.js" -Recurse | Select-String -Pattern "router\.(get|post|put|delete|patch)" | Select-Object -Unique Path
```

---

## Test Generation Patterns

### Auth Test Matrix

For every authenticated endpoint, generate:

| Test Case                    | Expected Status |
| ---------------------------- | --------------- |
| No Authorization header      | 401             |
| Invalid token format         | 401             |
| Valid token, wrong user role | 403             |
| Expired JWT token            | 401             |
| Valid token, correct role    | 2xx             |
| Token from deleted user      | 401             |

### Input Validation Matrix

For every POST/PUT/PATCH endpoint with a request body:

| Test Case               | Expected Status |
| ----------------------- | --------------- |
| Empty body `{}`         | 400 or 422      |
| Missing required fields | 400 or 422      |
| Wrong type              | 400 or 422      |
| Boundary tests          | 400/2xx         |
| Injection attempts      | 400 or 200      |

---

## Example Test Files

→ See references/example-test-files.md for details

## Generating Tests from Route Scan

1. **Scan routes** using the detection commands above
2. **Read each route handler** to understand schema, auth, and logic
3. **Generate test file** per route group
4. **Name tests descriptively**
5. **Use factories/fixtures**
6. **Assert response shape**

---

## Common Pitfalls

- **Testing only happy paths**
- **Hardcoded test data IDs**
- **Shared state between tests**
- **Testing implementation, not behavior**

---

## Best Practices

1. One describe block per endpoint
2. Seed minimal data
3. Use `beforeAll`/`afterAll` wisely
4. Assert specific error messages
5. Test sensitive field exclusion
6. Isolated auth tests
7. Rate limit tests last
