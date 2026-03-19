# Prisma Workflow Reference

Complete migration workflow, seeding patterns, and data safety checklists for the LMS platform.

---

## Prisma Package Location

All database operations are scoped to the shared `packages/database` package:

```
packages/database/
  prisma/
    schema.prisma    # Data model definition
    migrations/       # SQL migration files
    seed.ts          # Database seeder
    .env             # DATABASE_URL
```

Run all Prisma commands from the package root or via pnpm filter:

```bash
pnpm --filter @lms/database prisma <command>
```

---

## Migration Workflow

### Step 1: Understand the Current Schema

Before making changes, review the existing schema at `packages/database/prisma/schema.prisma`. Identify:
- All models and their fields
- Relations between models (1:N, N:M, 1:1)
- Existing indexes and unique constraints
- Tenant scoping (`tenantId` fields on primary models)

### Step 2: Modify the Schema

Edit `packages/database/prisma/schema.prisma`. Common additions:

```prisma
model Course {
  id        String   @id @default(uuid())
  title     String
  tenantId  String   // Required for multi-tenancy
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}
```

### Step 3: Generate Prisma Client

```bash
pnpm --filter @lms/database prisma generate
```

This regenerates the TypeScript types in `node_modules/.prisma/client`. Always do this even if you plan to use `db push`.

### Step 4: Choose Migration Strategy

**For Development (fast iteration):**
```bash
pnpm --filter @lms/database prisma db push
```
- No migration file created
- Directly applies schema changes to the database
- Good for: exploring ideas, rapid prototyping, resetting dev DB

**For Tracked Changes (create migration file):**
```bash
pnpm --filter @lms/database prisma migrate dev --name descriptive_name
```
- Creates a timestamped migration file in `prisma/migrations/`
- Migration is tracked in version control
- Good for: feature branches, staging, production deployments

### Step 5: Apply Migrations

**Development:**
```bash
pnpm --filter @lms/database prisma migrate dev
```

**Staging/Production:**
```bash
pnpm --filter @lms/database prisma migrate deploy
```

Never use `migrate dev` or `migrate reset` in staging/production.

### Step 6: Verify

- Restart the API server to pick up the new Prisma Client.
- Run relevant tests to verify data integrity.
- Check that all foreign key relationships are intact.

---

## Migration Safety Checklist

Before running any migration in non-dev environments:

- [ ] Backup the database (for staging and production)
- [ ] Review the generated SQL in the migration file
- [ ] Check for destructive changes (drop column, drop table, type changes)
- [ ] Verify no code references the column/table being modified
- [ ] Run `prisma migrate diff --from-schema-datasource... --to-schema-datasource...` to preview changes
- [ ] Test the migration on a staging database with a copy of production data
- [ ] Ensure `prisma generate` has been run after the schema change
- [ ] Plan a rollback strategy if the migration fails

### Destructive Change Rules

| Operation | Risk | Mitigation |
|---|---|---|
| Drop column | Data loss | Check all code references first |
| Change column type | Data truncation | Use compatible types or create new column + migrate data |
| Drop table | Data loss | Ensure no code references the table |
| Remove index | Query performance impact | Verify the index is not critical |
| Rename field | Code breakage | Use `@map()` to rename in DB without changing Prisma field name |

---

## Seeding Patterns

### Seed File Location

`packages/database/prisma/seed.ts`

### Basic Seed Structure

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create or find the demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "trung-tam-demo" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Trung tam Demo",
      slug: "trung-tam-demo",
      // ... other required fields
    },
  });

  // 2. Create sample user linked to tenant
  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      fullName: "Demo User",
      password: "hashed_password",
      tenantId: tenant.id,
      role: "STUDENT",
    },
  });

  // 3. Create courses linked to tenant
  const course = await prisma.course.create({
    data: {
      title: "Khoa hoc Demo",
      description: "Day la khoa hoc mau",
      tenantId: tenant.id,
    },
  });

  // 4. Create lessons linked to course
  await prisma.lesson.createMany({
    data: [
      { title: "Bai 1", courseId: course.id, order: 1, tenantId: tenant.id },
      { title: "Bai 2", courseId: course.id, order: 2, tenantId: tenant.id },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Seed Best Practices

1. **Use `upsert`** for idempotent seeding -- safe to run multiple times.
2. **Always link data to tenantId** -- courses, lessons, users, and enrollments must have a tenant reference.
3. **Use fixed UUIDs** for demo tenant (e.g., `00000000-0000-0000-0000-000000000001`) so it is consistent across environments.
4. **Order matters** -- seed parents before children (Tenant -> User -> Enrollment -> Course -> Lesson).
5. **Handle empty seed gracefully** -- use try/catch and meaningful error messages.

### Running the Seed

```bash
pnpm --filter @lms/database db:seed
```

Add to `package.json` of the database package:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\\"module\\":\\"CommonJS\\"} prisma/seed.ts"
  }
}
```

---

## Cross-Package Prisma Client Usage

The Prisma Client generated in `packages/database` is used by `apps/api-server`:

```typescript
// apps/api-server/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@lms/database";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

After any schema change:
1. Run `prisma generate` in `packages/database`
2. Restart the API server
3. Verify the service imports the updated types correctly

---

## Resetting the Development Database

```bash
# WARNING: This deletes all data in the development database
pnpm --filter @lms/database prisma migrate reset
```

This is equivalent to:
1. Drop all tables
2. Apply all migrations from scratch
3. Run the seed file

Only use in local development. Never run this in staging or production.
