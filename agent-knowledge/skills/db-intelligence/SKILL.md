# Database Intelligence

**Tier:** POWERFUL
**Category:** Engineering / DevOps
**Domain:** Database Management / Prisma

---

## Overview

This skill enables the AI Agent to have a deep understanding of the LMS project's data structure, perform schema reviews, and plan database changes safely to avoid data loss.

## Core Capabilities

- **db_schema_review**: Read and analyze the entire `schema.prisma` file.
- **generate_migration_plan**: Propose model changes and migration commands based on new requirements.
- **check_data_safety**: Warn against dangerous changes (e.g., dropping columns with data, incompatible type changes).

## Usage Guidelines

1. Before performing any database-related changes, you **MUST** run `db_schema_review`.
2. Always use `generate_migration_plan` to preview changes and discuss them with the User.
3. Never directly execute commands like `prisma migrate dev --force` without warning the User if there is a risk of data loss.

## Key Workflows

### 1. Adding New Fields/Tables

1. Run `db_schema_review` to understand current relationships.
2. Propose the new `model` code.
3. Provide the `pnpm db:push` command (for dev) or `pnpm db:migrate` (for staging).

### 2. Modifying/Deleting Fields (High Caution)

1. Check if the field is being used in the code (use `grep_search`).
2. If deleting, propose a migration that drops the column only after ensuring the code no longer references it.

---

## Best Practices

- Prioritize using `UUID` for primary keys.
- Always add `createdAt` and `updatedAt` to important models.
- Use `@@index` for fields frequently used for filtering or joining.
- 1-to-Many (1-N) relationships must be clearly defined on both sides of the models.
