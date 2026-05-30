const prisma = createPrismaClient();
async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log(tenants);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
