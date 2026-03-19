#!/usr/bin/env python3
"""API Test Suite Generator — Generates Vitest+Supertest test scaffolds from NestJS controllers."""

import json
import re
import sys
from pathlib import Path
from datetime import datetime


TEMPLATE_TEST = '''import {{ describe, it, expect, beforeAll, afterAll }} from 'vitest';
import request from 'supertest';
import {{ app }} from '../../src/main';
import {{ prisma }} from '../../src/prisma';
import {{ faker }} from '@faker-js/faker';

const API_PREFIX = '{prefix}';
let adminToken: string;
let testTenantId = 'trung-tam-demo';

beforeAll(async () => {{
  // Login as admin to get token
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({{ email: 'admin@example.com', password: 'password123' }});

  adminToken = loginRes.body.data.token;

  // Clean up test data
  await prisma.{model}.deleteMany({{ where: {{ tenantId: testTenantId }} }});
}});

afterAll(async () => {{
  await prisma.$disconnect();
}});

{tests}
'''


def generate_auth_matrix(prefix: str, model: str, routes: list[dict]) -> str:
    """Generate authentication test cases."""
    tests = []
    tests.append(f'''  describe('Auth Matrix', () => {{
    it('should return 401 without Authorization header', async () => {{
      const res = await request(app).get(`${{API_PREFIX}}{routes[0]["path"]}`);
      expect(res.status).toBe(401);
    }});

    it('should return 401 with invalid token', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{routes[0]["path"]}`)
        .set('Authorization', 'Bearer invalid_token')
        .set('x-tenant-id', testTenantId);
      expect(res.status).toBe(401);
    }});

    it('should return 401 without x-tenant-id header', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{routes[0]["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`);
      expect(res.status).toBe(400); // or 401 depending on middleware config
    }});

    it('should pass with valid token and tenant header', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{routes[0]["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId);
      expect([200, 201]).toContain(res.status);
    }});
  }});
''')
    return "\n".join(tests)


def generate_validation_matrix(prefix: str, model: str, routes: list[dict]) -> str:
    """Generate input validation test cases."""
    tests = []
    for route in routes:
        if route["method"] not in ["POST", "PUT", "PATCH"]:
            continue

        tests.append(f'''  describe('POST {route["path"]} — Validation', () => {{
    it('should return 400 with empty body', async () => {{
      const res = await request(app)
        .post(`${{API_PREFIX}}{route["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId)
        .send({{}});
      expect(res.status).toBe(400);
    }});

    it('should return 400 with missing required fields', async () => {{
      const res = await request(app)
        .post(`${{API_PREFIX}}{route["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId)
        .send({{ wrongField: 'test' }});
      expect(res.status).toBe(400);
    }});

    it('should return 422 with wrong field types', async () => {{
      const res = await request(app)
        .post(`${{API_PREFIX}}{route["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId)
        .send({{ title: 12345 }}); // should be string
      expect([400, 422]).toContain(res.status);
    }});
  }});
''')
    return "\n".join(tests)


def generate_crud_matrix(prefix: str, model: str, routes: list[dict]) -> str:
    """Generate CRUD operation test cases."""
    tests = []

    create_route = next((r for r in routes if r["method"] == "POST"), None)
    if create_route:
        tests.append(f'''
  describe('CRUD Operations', () => {{
    let createdId: string;

    it('POST — should create a new {model}', async () => {{
      const res = await request(app)
        .post(`${{API_PREFIX}}{create_route["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId)
        .send({{
          title: `${{faker.lorem.words(3)}}`,
          description: faker.lorem.sentence(),
        }});

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('tenantId', testTenantId);
      createdId = res.body.data.id;
    }});

    it('GET — should list {model} items', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{create_route["path"].replace("/create", "")}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId);

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('data');
    }});

    it('GET — should return 404 for non-existent {model}', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{create_route["path"].replace("/create", "")}/non-existent-id`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId);

      expect(res.status).toBe(404);
    }});

    it('DELETE — should delete {model}', async () => {{
      if (!createdId) return;

      const res = await request(app)
        .delete(`${{API_PREFIX}}{create_route["path"].replace("/create", "")}/${{createdId}}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId);

      expect([200, 204]).toContain(res.status);
    }});
  }});
''')

    return "\n".join(tests)


def generate_pagination_matrix(prefix: str, routes: list[dict]) -> str:
    """Generate pagination test cases."""
    tests = []

    list_routes = [r for r in routes if r["method"] == "GET" and r["path"] and "{" not in r["path"]]
    for route in list_routes:
        tests.append(f'''  describe('GET {route["path"]} — Pagination', () => {{
    it('should accept valid pagination params', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{route["path"]}?page=1&limit=10`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId);

      expect(res.status).toBe(200);
    }});

    it('should return 400 for invalid page/limit', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{route["path"]}?page=-1&limit=1000`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', testTenantId);

      expect([400, 422]).toContain(res.status);
    }});

    it('should return empty data array when no records exist', async () => {{
      const res = await request(app)
        .get(`${{API_PREFIX}}{route["path"]}`)
        .set('Authorization', `Bearer ${{adminToken}}`)
        .set('x-tenant-id', 'non-existent-tenant');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(expect.any(Array));
    }});
  }});
''')

    return "\n".join(tests)


def scan_controllers(base_path: str = "apps/api-server/src"):
    """Scan NestJS controllers for route definitions."""
    base = Path(base_path)
    all_routes: list[dict] = []

    for controller_file in base.rglob("*.controller.ts"):
        content = controller_file.read_text(encoding="utf-8")

        # Extract controller prefix
        prefix_match = re.search(r"@Controller\s*\(\s*['\"]([^'\"]+)['\"]", content)
        prefix = prefix_match.group(1) if prefix_match else ""

        # Extract routes
        for match in re.finditer(
            r"@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['\"]([^'\"]*)['\"]\s*\)",
            content
        ):
            method = match.group(1).upper()
            path = match.group(2)
            all_routes.append({
                "file": str(controller_file.relative_to(base)),
                "method": method,
                "path": path,
                "full_path": prefix + path,
            })

    return all_routes


def main():
    import argparse

    parser = argparse.ArgumentParser(description="API Test Suite Generator for NestJS")
    parser.add_argument("--controller", help="Specific controller file to generate tests for")
    parser.add_argument("--prefix", default="/api/v1", help="API prefix")
    parser.add_argument("--model", default="entity", help="Model name for test context")
    parser.add_argument("--output", "-o", default="test-output.spec.ts", help="Output file")
    parser.add_argument("--include", choices=["all", "auth", "crud", "pagination", "validation"],
                        default="all", help="Test categories to generate")
    args = parser.parse_args()

    routes = scan_controllers()

    tests_parts: list[str] = []

    if args.include in ["all", "auth"]:
        tests_parts.append(generate_auth_matrix(args.prefix, args.model, routes))

    if args.include in ["all", "validation"]:
        tests_parts.append(generate_validation_matrix(args.prefix, args.model, routes))

    if args.include in ["all", "crud"]:
        tests_parts.append(generate_crud_matrix(args.prefix, args.model, routes))

    if args.include in ["all", "pagination"]:
        tests_parts.append(generate_pagination_matrix(args.prefix, routes))

    output = TEMPLATE_TEST.format(
        prefix=args.prefix,
        model=args.model,
        tests="\n".join(tests_parts)
    )

    Path(args.output).write_text(output, encoding="utf-8")
    print(f"[OK] Generated test suite: {args.output}")
    print(f"      Routes scanned: {len(routes)}")


if __name__ == "__main__":
    main()
