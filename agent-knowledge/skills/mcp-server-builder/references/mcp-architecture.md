# MCP Architecture (Deep Reference)

## Script Interfaces

### openapi_to_mcp.py

```bash
python3 scripts/openapi_to_mcp.py --help
```

Reads OpenAPI from stdin or `--input`. Produces manifest + server scaffold. Emits JSON summary or text report.

```bash
# From file
python3 scripts/openapi_to_mcp.py --input openapi.json \
  --server-name billing-mcp --language python --output-dir ./out --format text

# From stdin
cat openapi.json | python3 scripts/openapi_to_mcp.py \
  --server-name billing-mcp --language typescript --format text
```

### mcp_validator.py

```bash
python3 scripts/mcp_validator.py --help
```

Validates manifests and optional runtime config. Returns non-zero exit in strict mode when errors exist.

```bash
python3 scripts/mcp_validator.py --input out/tool_manifest.json --strict --format text
```

## Architecture Decisions

| Approach | Use When |
|---|---|
| Python runtime | Fast iteration, data pipelines, backend-heavy teams |
| TypeScript runtime | Shared types with JS stack, frontend-heavy teams |
| Single MCP server | Easiest operations, broader blast radius, fewer deployment targets |
| Split domain servers | Cleaner ownership, safer change boundaries, independent deployments |

## Contract Quality Gates

Before publishing a manifest:

1. Every tool has a clear verb-first name (e.g., `listCourses`, `createEnrollment`)
2. Every tool description explains intent and expected result
3. Every required field is explicitly typed with JSON Schema
4. Destructive actions include confirmation parameters
5. Error payload format is consistent across all tools (`code`, `message`, `details`)
6. Validator returns zero errors in strict mode

## Tool Naming Convention

```
Good:  listCourses, getLessonById, createEnrollment, updateUserProfile
Bad:   get__v1__courses, list_courses, GetCourses, courseList
```

## Testing Strategy

| Level | What | How |
|---|---|---|
| Unit | OpenAPI operation to MCP tool schema transformation | Jest/Pytest with fixture assertions |
| Contract | Snapshot `tool_manifest.json` | PR diff review on schema changes |
| Integration | Call generated tool handlers against staging API | E2E tests against test tenant |
| Resilience | Simulate 4xx/5xx upstream errors | Verify structured error responses |

## Deployment Practices

1. Pin MCP runtime dependencies per environment
2. Roll out server updates behind versioned endpoint/process
3. Maintain backward compatibility for one release window minimum
4. Add changelog notes for new/removed/changed tool contracts per release
5. Deploy MCP servers as separate Node.js or Python processes; not co-located with NestJS

## Security Controls

| Control | Implementation |
|---|---|
| Host allowlisting | Explicit list of allowed outbound hosts in server config |
| No arbitrary proxying | Never proxy user-provided URLs; validate against allowlist |
| Secret redaction | Strip auth headers and secrets from all log output |
| Rate limiting | Apply per-tool rate limits; add request timeouts per handler |
| Input validation | Validate all MCP tool inputs before forwarding to backend |

## LMS-Specific Considerations

When building MCP servers for the LMS platform:

- Authenticate via JWT Bearer token passed in server config, not embedded in tool calls
- Apply `tenantId` filtering for all data-retrieval tools (use the authenticated user's tenant)
- Scope tools to LMS domains: courses, lessons, enrollments, users, grades, analytics
- Use the LMS OpenAPI spec auto-generated from NestJS Swagger decorators as the source of truth
- Prisma types from `@lms/database` should be used as the canonical data types in tool schemas
