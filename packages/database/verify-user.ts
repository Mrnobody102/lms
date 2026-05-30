const prisma = createPrismaClient();
async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@lms.com' } });
  console.log('Admin user:', admin);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
