# Database Intelligence

**Tier:** POWERFUL
**Category:** Engineering / DevOps
**Domain:** Database Management / Prisma
**Maintainer:** LMS Agent Team

---

## Overview

This skill enables deep understanding of the LMS project's data structure, performing schema reviews, planning database changes safely, and avoiding data loss. It works alongside `database-operations` but focuses on analysis and planning rather than execution.

## Core Capabilities

- **db_schema_review**: Reading and analyzing the entire `schema.prisma` file, understanding model relationships, indexes, and constraints.
- **migration_planning**: Proposing model changes and generating safe migration commands based on requirements.
- **data_safety_checks**: Warning against dangerous changes such as dropping columns with data, incompatible type changes, or unsafe cascades.
- **relationship_analysis**: Mapping 1:N, N:M, and 1:1 relationships across the schema to predict the impact of changes.

## When to Use

Use when:
- Planning to add, modify, or delete models, fields, or relationships.
- Reviewing the schema to understand how two features relate.
- Auditing indexes or constraints for performance.
- Assessing the safety of a proposed database change.
- Writing Prisma queries that span multiple models.

Skip when:
- You need to run migrations or generate Prisma Client (use `database-operations`).
- Making read-only queries without schema modifications (just read the schema directly).
- The task is purely about NestJS service implementation (use `nestjs-standards`).

## Key Workflows

### Adding New Models or Fields

1. Run `db_schema_review` to understand existing relationships and naming conventions.
2. Propose the new model or field code, ensuring it follows LMS conventions (UUID id, timestamps, tenantId).
3. Identify required relationships and indexes.
4. Generate a migration plan with `prisma migrate dev --name descriptive_name`.

### Modifying or Deleting Fields (High Caution)

1. Search the codebase for all references to the field being modified.
2. If deleting: confirm no code references the field; propose a two-phase deprecation if needed.
3. If changing type: assess data migration needs.
4. Present the migration plan with safety warnings before proceeding.

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Deleting a column still referenced in code | Search all source files for the field name before proposing deletion. |
| Adding a required field to an existing model without a default | Use `@default()` or make the field optional first, then migrate data. |
| Creating N:M relations without an explicit join model | Use explicit junction tables for extra fields; use `@relation` for simple many-to-many. |
| Forgetting `@index` on foreign keys and filter fields | Add indexes for fields used in `where` clauses and `join` conditions. |
| Not accounting for tenantId in new models | Every primary data model must include `tenantId String` and a `@relation` to Tenant. |
| Renaming a field without using `@map()` | Use `@map("old_column_name")` to rename without dropping and recreating the column. |

## Best Practices

1. **Always review `schema.prisma` first** -- understand the full picture before proposing changes.
2. **Use UUID for all primary keys** (`@id @default(uuid())`) -- never use auto-increment integers.
3. **Add `createdAt` and `updatedAt` to every model** via `@default(now())` and `@updatedAt`.
4. **Index frequently filtered fields** -- add `@@index([fieldName])` for columns used in `where` clauses or joins.
5. **Define relations on both sides** -- ensure `hasMany` and `fields` sides of a relation match.
6. **Use explicit transaction boundaries** for multi-step writes that must be atomic.
7. **Validate tenant scoping** -- every service query should filter by `tenantId` when the model supports multi-tenancy.

## Related Skills

| Skill | Use When |
|---|---|
| database-operations | Running migrations, seeding data, generating Prisma Client |
| nestjs-standards | Implementing database access in NestJS services |
| api-design-reviewer | Reviewing API endpoints that expose database models |
| testing-strategy | Writing database integration tests |

## Reference Documentation

-> See `references/` directory for deep-dive documentation.
