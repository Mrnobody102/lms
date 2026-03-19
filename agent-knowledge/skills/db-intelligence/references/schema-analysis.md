# Schema Analysis Reference

Detailed schema review checklist and migration planning guide for the LMS platform.

---

## Schema Review Checklist

Run through this checklist when analyzing or planning changes to the Prisma schema.

### Multi-Tenancy Compliance

- [ ] Every primary data model has a `tenantId String` field.
- [ ] Every `tenantId` field has a `@relation` pointing to the `Tenant` model.
- [ ] All queries in services filter by `tenantId` where applicable.
- [ ] The `Tenant` model itself does NOT have a `tenantId` field (it is the root entity).

### Model Structure

- [ ] All models use `@id @default(uuid())` for primary keys.
- [ ] All models have `createdAt @default(now())` and `updatedAt @updatedAt`.
- [ ] All string fields that are required have appropriate length constraints (e.g., `@db.VarChar(255)`).
- [ ] Enum fields use Prisma enums rather than raw string fields where applicable.
- [ ] Optional fields are explicitly marked `@?` or `@optional()`.

### Relationships

- [ ] All 1:N relations are defined on the "one" side with `fields` and `references`.
- [ ] All N:M relations use explicit junction models when extra data is needed; `@relation` for simple many-to-many.
- [ ] Optional relations (e.g., a course with an optional instructor) use `?` on the field side.
- [ ] No orphaned relations -- if a related model is deleted, the behavior is defined (`@relation(onDelete: ...)`).

### Indexes and Constraints

- [ ] Foreign key fields are indexed (`@@index([tenantId])`, `@@index([courseId])`).
- [ ] Fields used in unique constraints have `@@unique([field1, field2])`.
- [ ] No duplicate indexes on the same field.
- [ ] Full-text search fields use appropriate types (`@db.Text` with manual indexing strategy).

### Naming Conventions

- [ ] Model names are PascalCase singular (`Course`, not `Courses` or `course`).
- [ ] Field names are camelCase (`fullName`, not `full_name`).
- [ ] Relation field names follow the model name (`course Course`, `courses Course[]`).
- [ ] Enum values are SCREAMING_SNAKE_CASE (`STUDENT`, `ADMIN`).

---

## Migration Planning Guide

### Scenario 1: Adding a New Model

**Example:** Adding a `Lesson` model linked to a `Course`.

1. **Analyze existing models:**
   - `Course` exists with `id`, `title`, `tenantId`.
   - `Lesson` should have `id`, `title`, `content`, `order`, `courseId`, `tenantId`.

2. **Draft the model:**

   ```prisma
   model Lesson {
     id        String   @id @default(uuid())
     title     String
     content   String? @db.Text
     order     Int
     courseId  String
     course    Course  @relation(fields: [courseId], references: [id])
     tenantId  String
     tenant    Tenant  @relation(fields: [tenantId], references: [id])
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     @@index([courseId])
     @@index([tenantId])
   }
   ```

3. **Update the Course model** to add the reverse relation:
   ```prisma
   model Course {
     // ... existing fields
     lessons   Lesson[]
   }
   ```

4. **Plan the migration:**
   ```bash
   prisma migrate dev --name add_lesson_model
   ```

### Scenario 2: Adding a Field to an Existing Model

**Example:** Adding `thumbnailUrl` to `Course`.

1. **Check existing code references** -- search for all usages of `Course` in the codebase.
2. **Draft the field:**
   ```prisma
   model Course {
     // ... existing fields
     thumbnailUrl String? @db.VarChar(500)
   }
   ```
3. **No code changes needed** if the field is optional -- Prisma will handle the migration.
4. **If required:** provide a default value or make optional first, then migrate data, then make required.

### Scenario 3: Renaming a Field (Safe)

**Example:** Renaming `title` to `name` on `Course`.

1. **Use `@map()` for safe renaming:**
   ```prisma
   model Course {
     name    String @map("title")
     @@map("courses")
   }
   ```
2. This renames the DB column to `name` without dropping and recreating.
3. Update all Prisma queries to use `name` instead of `title`.
4. Update all TypeScript references in the codebase.

### Scenario 4: Deleting a Field

**Example:** Removing `legacyField` from `Course`.

1. **Search for all usages:**
   ```bash
   grep -r "legacyField" --include="*.ts" --include="*.tsx"
   ```

2. **If references exist:** remove them first, then propose the migration.

3. **If no references:** safe to delete. Draft the migration:
   ```prisma
   // Remove the field from the model
   // Remove @@index entries that reference it
   ```

4. **Backup and test** before applying in staging.

### Scenario 5: Changing a Column Type

**Example:** Changing `summary String` to `summary String?` (making it optional).

1. This is a non-destructive change in most databases.
2. If changing from optional to required, provide a default or migrate data first.

**Example:** Changing `price Float` to `price Int` (storing cents instead of dollars).

1. This is **destructive** -- it may truncate decimal values.
2. Plan: add new field `priceInCents Int`, migrate data, remove old field, rename new field.

---

## Schema Relationship Map

Typical LMS models and their relationships:

```
Tenant (root)
  |-- User (tenantId)
  |     |-- Enrollment (tenantId, userId)
  |-- Course (tenantId)
  |     |-- Lesson (tenantId, courseId)
  |     |-- Enrollment (tenantId, courseId)
  |-- Category (tenantId)
        |-- Course (categoryId)

User
  |-- Enrollment (userId, courseId)
  |-- LessonProgress (userId, lessonId)
```

Every link in the chain carries `tenantId` for proper isolation.

---

## Index Planning

Add `@@index` to a field when:

| Scenario | Example |
|---|---|
| Field is used in `where` clauses | `@@index([tenantId])` on all models |
| Field is a foreign key | `@@index([courseId])` on Lesson |
| Field is used in `orderBy` | `@@index([createdAt])` on Course |
| Field is used in `distinct` | `@@index([email])` on User |
| Composite filter conditions | `@@index([tenantId, status])` |

Avoid over-indexing -- each index adds write overhead.
