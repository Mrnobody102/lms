# MCP Server Builder

**Tier:** POWERFUL
**Category:** Engineering
**Domain:** AI / API Integration
**Maintainer:** LMS Agent Team

---

## Overview

Use this skill to design and ship production-ready MCP servers from API contracts instead of hand-written one-off tool wrappers. It focuses on fast scaffolding, schema quality, validation, and safe evolution for the LMS platform.

The workflow supports both Python and TypeScript MCP implementations and treats OpenAPI as the source of truth.

## Core Capabilities

- **openapi_to_mcp**: Convert OpenAPI paths/operations into MCP tool definitions
- **scaffold_generation**: Generate starter server scaffolds (Python or TypeScript)
- **naming_enforcement**: Enforce consistent naming, descriptions, and schema quality
- **manifest_validation**: Validate MCP tool manifests for common production failures
- **versioning_checks**: Apply versioning and backward-compatibility checks
- **runtime_isolation**: Separate transport/runtime decisions from tool contract design

## When to Use

Use when:
- You need to expose an internal LMS REST API to an LLM agent
- You are replacing brittle browser automation with typed, verifiable tools
- You want one MCP server shared across LMS platform assistants
- You need repeatable quality checks before publishing MCP tools
- You want to bootstrap an MCP server from existing LMS OpenAPI specs
- You need to build AI agent capabilities that interact with LMS data (courses, lessons, enrollments, users)

Skip when:
- Building general-purpose NestJS features without MCP integration
- Working on UI-only changes with no agent-facing API surface

## Key Workflows

### OpenAPI to MCP Scaffold

1. Start from a valid LMS OpenAPI spec (auto-generated from NestJS Swagger)
2. Generate tool manifest + starter server code
3. Review naming, descriptions, and auth strategy
4. Add endpoint-specific runtime logic
5. Validate the manifest in strict mode

```bash
python3 scripts/openapi_to_mcp.py \
  --input openapi.json \
  --server-name lms-admin-mcp \
  --language typescript \
  --output-dir ./out \
  --format text
```

### Validate MCP Tool Definitions

Run validator before integration tests:

```bash
python3 scripts/mcp_validator.py --input out/tool_manifest.json --strict --format text
```

Checks include: duplicate names, invalid schema shape, missing descriptions, empty required fields, and naming hygiene.

### Runtime Selection

| Runtime | Best For |
|---|---|
| Python | Fast iteration, data-heavy backends, ML integration |
| TypeScript | Unified JS/TS stack, shared types with Next.js apps |

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Tool names derived directly from raw paths (`get__v1__users___id`) | Use `operationId` as canonical tool name; human-readable format |
| Missing operation descriptions (agents choose tools poorly) | Add action-verb descriptions to every tool |
| Ambiguous parameter schemas with no required fields | Define explicit `required` arrays in JSON Schema |
| Mixing transport errors and domain errors in one opaque message | Return structured errors with `code`, `message`, `details` fields |
| Building tool contracts that expose secret values | Keep secrets in env vars; never in tool schemas |
| Breaking clients by changing schema keys without versioning | Introduce new tool IDs for breaking changes; additive-only for non-breaking |

## Best Practices

1. Use `operationId` as the canonical tool name when available from OpenAPI spec
2. Keep one task intent per tool; avoid mega-tools that do multiple things
3. Add concise descriptions with action verbs: "Create a new course enrollment" not "Creates enrollment"
4. Validate contracts in CI using strict mode (`--strict`) before merging
5. Keep generated scaffold committed, then customize incrementally
6. Pair contract changes with changelog entries documenting tool additions/removals
7. Separate tool contracts (what) from runtime implementations (how)

## Related Skills

| Skill | Use When |
|---|---|
| api-design-reviewer | Ensuring the OpenAPI spec is well-designed before generating MCP tools |
| architecture-core | Understanding LMS monorepo structure for MCP server placement |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
