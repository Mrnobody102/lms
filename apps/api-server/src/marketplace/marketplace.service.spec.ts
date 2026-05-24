import { describe, expect, it, vi } from 'vitest';
import {
  MarketplacePricingModel,
  MarketplaceResourceType,
  MarketplaceUsageEventType,
  ResourceSubscriptionStatus,
} from '@repo/database';
import { MarketplaceService } from './marketplace.service';

function buildMarketplaceItem() {
  return {
    id: 'item-1',
    ownerTenantId: 'tenant-provider',
    resourceType: MarketplaceResourceType.MEDIA_ASSET,
    resourceId: 'asset-1',
    title: 'Shared video pack',
    description: null,
    pricingModel: MarketplacePricingModel.ONE_TIME,
    priceCents: 10000,
    currency: 'USD',
    revenueShareBps: 7000,
    isPublished: true,
    publishedAt: new Date(),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerTenant: {
      id: 'tenant-provider',
      name: 'Provider',
      slug: 'provider',
    },
  };
}

describe('MarketplaceService', () => {
  it('records provider revenue share when a tenant subscribes to a published item', async () => {
    const item = buildMarketplaceItem();
    const prisma = {
      marketplaceItem: {
        findFirst: vi.fn().mockResolvedValue(item),
      },
      resourceSubscription: {
        upsert: vi.fn().mockResolvedValue({ id: 'sub-1', marketplaceItem: item }),
      },
      marketplaceUsageEvent: {
        create: vi.fn().mockResolvedValue({ id: 'usage-1' }),
      },
    };
    const service = new MarketplaceService(prisma as never, {} as never);

    await service.subscribe('tenant-subscriber', 'item-1', {});

    expect(prisma.resourceSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          providerTenantId: 'tenant-provider',
          subscriberTenantId: 'tenant-subscriber',
          status: ResourceSubscriptionStatus.ACTIVE,
          priceCents: 10000,
        }),
      }),
    );
    expect(prisma.marketplaceUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: MarketplaceUsageEventType.SUBSCRIPTION_STARTED,
          revenueShareCents: 7000,
        }),
      }),
    );
  });

  it('creates a signed media URL only after cross-tenant subscription access is verified', async () => {
    const item = buildMarketplaceItem();
    const prisma = {
      marketplaceItem: {
        findFirst: vi.fn().mockResolvedValue(item),
      },
      resourceSubscription: {
        findFirst: vi.fn().mockResolvedValue({ id: 'sub-1' }),
      },
      mediaAsset: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'asset-1',
          filename: 'lesson.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1000,
          storageKey: 'tenant-provider/media/lesson.mp4',
        }),
      },
      marketplaceUsageEvent: {
        create: vi.fn().mockResolvedValue({ id: 'usage-1' }),
      },
    };
    const storage = {
      generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://signed.example/video'),
    };
    const service = new MarketplaceService(prisma as never, storage as never);

    const result = await service.createMediaSignedUrl('item-1', 'tenant-subscriber', 'user-1', {
      expiresInSeconds: 600,
    });

    expect(storage.generatePresignedDownloadUrl).toHaveBeenCalledWith(
      'tenant-provider/media/lesson.mp4',
      600,
    );
    expect(prisma.marketplaceUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriberTenantId: 'tenant-subscriber',
          userId: 'user-1',
          eventType: MarketplaceUsageEventType.MEDIA_SIGNED_URL,
        }),
      }),
    );
    expect(result.downloadUrl).toBe('https://signed.example/video');
  });
});
