import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Tạo một Tenant mẫu để test
  const tenant = await prisma.tenant.upsert({
    where: { slug: "trung-tam-demo" },
    update: {},
    create: {
      name: "Trung Tâm Tiếng Trung Demo",
      slug: "trung-tam-demo",
      domain: "demo.lms.com",
      settings: {
        themeColor: "#ff0000",
        logoUrl: "https://example.com/logo.png",
      },
    },
  });
  console.log(`Created/Updated Tenant: ${tenant.name}`);

  // Tạo Super Admin
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: {},
    create: {
      email: "admin@lms.com",
      password: hashedPassword,
      fullName: "Super Admin",
      role: Role.SUPER_ADMIN,
      tenantId: tenant.id,
    },
  });
  console.log(`Created/Updated Admin User: ${admin.email}`);

  // Tạo tài khoản Học Sinh
  const student = await prisma.user.upsert({
    where: { email: "student@lms.com" },
    update: {},
    create: {
      email: "student@lms.com",
      password: hashedPassword,
      fullName: "Học Viên A",
      role: Role.STUDENT,
      tenantId: tenant.id,
    },
  });
  console.log(`Created/Updated Student User: ${student.email}`);

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
