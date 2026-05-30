import { createPrismaClient } from '@repo/database';
import * as bcrypt from 'bcrypt';

const prisma = createPrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }

  const hashedPassword = await bcrypt.hash('password123', 12);
  const email = 'instructor1@example.com';

  const identity = await prisma.globalUserIdentity.upsert({
    where: { normalizedEmail: email },
    update: { displayName: 'Instructor One' },
    create: {
      normalizedEmail: email,
      displayName: 'Instructor One',
    },
  });

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        email,
        tenantId: tenant.id,
      },
    },
    update: {
      role: 'INSTRUCTOR',
    },
    create: {
      email,
      password: hashedPassword,
      fullName: 'Instructor One',
      globalIdentityId: identity.id,
      tenantId: tenant.id,
      role: 'INSTRUCTOR',
    },
  });

  console.log('Instructor created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
