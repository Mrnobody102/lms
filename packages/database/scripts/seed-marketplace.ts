import { createPrismaClient } from '../src';
import { MarketplaceResourceType, MarketplacePricingModel } from '../.prisma/client';

const prisma = createPrismaClient();

async function main() {
  console.log('Seeding marketplace item...');
  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } });
  const course = await prisma.course.findFirst({ where: { tenantId: tenant?.id } });

  if (!tenant || !course) {
    console.error('No tenant or course found.');
    process.exit(1);
  }

  const item = await prisma.marketplaceItem.create({
    data: {
      ownerTenantId: tenant.id,
      title: 'Khóa Học Mẫu Cho Thuê',
      description:
        'Đây là khóa học mẫu được đóng gói để chia sẻ lên Marketplace cho các trung tâm khác thuê lại.',
      resourceType: MarketplaceResourceType.COURSE,
      resourceId: course.id,
      pricingModel: MarketplacePricingModel.MONTHLY,
      priceCents: 500000,
      currency: 'VND',
      isPublished: true,
    },
  });

  console.log('Created Marketplace Item:', item.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export {};
