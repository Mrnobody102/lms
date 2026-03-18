import { PrismaClient, Role } from "../generated/client";
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

  // Create a sample Course
  const course = await prisma.course.create({
    data: {
      title: "Khóa học Nhập môn Tiếng Trung (HSK 1 - Demo)",
      tenantId: tenant.id,
      totalDuration: 30,
      lessons: {
        create: [
          {
            title: "Bài 1: Giới thiệu Pinyin (Thanh mẫu, Vận mẫu)",
            type: "video" as any,
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
            duration: 15,
            order: 1,
            tenantId: tenant.id,
          },
          {
            title: "Bài 2: Từ vựng cơ bản (Chào hỏi)",
            type: "text" as any,
            content:
              "<h2>Chào hỏi trong tiếng Trung</h2><p>Nǐ hǎo (你好) - Chào bạn</p><p>Zàijiàn (再见) - Tạm biệt</p>",
            duration: 10,
            order: 2,
            tenantId: tenant.id,
          },
          {
            title: "Bài 3: Bài tập ôn tập Bài 1 & 2",
            type: "quiz" as any,
            duration: 5,
            order: 3,
            tenantId: tenant.id,
            quiz: {
              questions: [
                {
                  question: "Từ 'Xin chào' trong tiếng Trung là gì?",
                  options: ["Zàijiàn", "Nǐ hǎo", "Xièxiè", "Bù kèqì"],
                  correctAnswer: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`Created Course: ${course.title} with 3 lessons`);

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
