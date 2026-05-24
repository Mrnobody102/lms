import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MarketplacePricingModel,
  MarketplaceResourceType,
  MarketplaceUsageEventType,
  MediaAssetStatus,
  Prisma,
  ResourceSubscriptionStatus,
} from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { CreateMarketplaceUsageEventDto } from './dto/create-marketplace-usage-event.dto';
import { MarketplaceQueryDto } from './dto/marketplace-query.dto';
import { MarketplaceReportQueryDto } from './dto/marketplace-report-query.dto';
import { SignedUrlRequestDto } from './dto/signed-url-request.dto';
import { SubscribeMarketplaceItemDto } from './dto/subscribe-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';

type MarketplaceItemWithOwner = Prisma.MarketplaceItemGetPayload<{
  include: { ownerTenant: { select: { id: true; name: true; slug: true } } };
}>;

interface MarketplaceAccess {
  item: MarketplaceItemWithOwner;
  isOwner: boolean;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createItem(ownerTenantId: string, dto: CreateMarketplaceItemDto) {
    await this.ensureResourceBelongsToTenant(ownerTenantId, dto.resourceType, dto.resourceId);

    return this.prisma.marketplaceItem.create({
      data: {
        ownerTenantId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        title: dto.title,
        description: dto.description,
        pricingModel: dto.pricingModel ?? MarketplacePricingModel.FREE,
        priceCents: dto.priceCents ?? 0,
        currency: (dto.currency ?? 'USD').toUpperCase(),
        revenueShareBps: dto.revenueShareBps ?? 7000,
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : undefined,
        metadata: this.toJsonInput(dto.metadata),
      },
      include: this.itemInclude(),
    });
  }

  async updateItem(ownerTenantId: string, itemId: string, dto: UpdateMarketplaceItemDto) {
    const current = await this.ensureOwnerItem(ownerTenantId, itemId);
    const nextResourceType = dto.resourceType ?? current.resourceType;
    const nextResourceId = dto.resourceId ?? current.resourceId;

    if (dto.resourceType !== undefined || dto.resourceId !== undefined) {
      await this.ensureResourceBelongsToTenant(ownerTenantId, nextResourceType, nextResourceId);
    }

    const nextPublished = dto.isPublished ?? current.isPublished;
    const shouldSetPublishedAt = nextPublished && !current.publishedAt;

    return this.prisma.marketplaceItem.update({
      where: { id: itemId },
      data: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        title: dto.title,
        description: dto.description,
        pricingModel: dto.pricingModel,
        priceCents: dto.priceCents,
        currency: dto.currency?.toUpperCase(),
        revenueShareBps: dto.revenueShareBps,
        isPublished: dto.isPublished,
        publishedAt: shouldSetPublishedAt
          ? new Date()
          : dto.isPublished === false
            ? null
            : undefined,
        metadata: this.toJsonInput(dto.metadata),
      },
      include: this.itemInclude(),
    });
  }

  async listPublished(query: MarketplaceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MarketplaceItemWhereInput = {
      isPublished: true,
      resourceType: query.resourceType,
      ownerTenantId: query.ownerTenantId,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where,
        include: this.itemInclude(),
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketplaceItem.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listOwnerItems(ownerTenantId: string, query: MarketplaceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MarketplaceItemWhereInput = {
      ownerTenantId,
      resourceType: query.resourceType,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where,
        include: this.itemInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketplaceItem.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getItem(itemId: string, tenantId: string) {
    const item = await this.findItem(itemId);
    if (item.isPublished || item.ownerTenantId === tenantId) {
      return item;
    }

    await this.ensureActiveSubscription(item.id, tenantId);
    return item;
  }

  async subscribe(tenantId: string, itemId: string, dto: SubscribeMarketplaceItemDto) {
    const item = await this.findPublishedItem(itemId);
    if (item.ownerTenantId === tenantId) {
      throw new BadRequestException(
        'Publishing tenant cannot subscribe to its own marketplace item',
      );
    }

    const now = new Date();
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= now) {
      throw new BadRequestException('Subscription end date must be in the future');
    }

    const subscription = await this.prisma.resourceSubscription.upsert({
      where: {
        marketplaceItemId_subscriberTenantId: {
          marketplaceItemId: item.id,
          subscriberTenantId: tenantId,
        },
      },
      update: {
        status: ResourceSubscriptionStatus.ACTIVE,
        startsAt: now,
        endsAt,
        purchasedAt: now,
        priceCents: item.priceCents,
        currency: item.currency,
        metadata: this.toJsonInput(dto.metadata),
      },
      create: {
        marketplaceItemId: item.id,
        providerTenantId: item.ownerTenantId,
        subscriberTenantId: tenantId,
        status: ResourceSubscriptionStatus.ACTIVE,
        startsAt: now,
        endsAt,
        priceCents: item.priceCents,
        currency: item.currency,
        metadata: this.toJsonInput(dto.metadata),
      },
      include: { marketplaceItem: { include: this.itemInclude() } },
    });

    await this.recordUsageEvent({
      item,
      subscriberTenantId: tenantId,
      eventType: MarketplaceUsageEventType.SUBSCRIPTION_STARTED,
      quantity: 1,
      revenueShareCents: this.computeRevenueShare(item.priceCents, item.revenueShareBps),
    });

    return subscription;
  }

  async listSubscriptions(tenantId: string) {
    return this.prisma.resourceSubscription.findMany({
      where: {
        subscriberTenantId: tenantId,
        status: ResourceSubscriptionStatus.ACTIVE,
      },
      include: { marketplaceItem: { include: this.itemInclude() } },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async getCoursePackage(itemId: string, tenantId: string, userId: string) {
    const { item, isOwner } = await this.ensureReadAccess(itemId, tenantId);
    if (item.resourceType !== MarketplaceResourceType.COURSE) {
      throw new BadRequestException('Marketplace item is not a course package');
    }

    const course = await this.prisma.course.findFirst({
      where: { id: item.resourceId, tenantId: item.ownerTenantId, deletedAt: null },
      include: {
        units: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
        lessons: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Marketplace course package no longer exists');
    }

    if (!isOwner) {
      await this.recordUsageEvent({
        item,
        subscriberTenantId: tenantId,
        userId,
        eventType: MarketplaceUsageEventType.COURSE_PACKAGE_VIEWED,
        quantity: 1,
      });
    }

    return { item, course };
  }

  async createMediaSignedUrl(
    itemId: string,
    tenantId: string,
    userId: string,
    dto: SignedUrlRequestDto,
  ) {
    const { item, isOwner } = await this.ensureReadAccess(itemId, tenantId);
    if (item.resourceType !== MarketplaceResourceType.MEDIA_ASSET) {
      throw new BadRequestException('Marketplace item is not a media asset');
    }

    const asset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: item.resourceId,
        tenantId: item.ownerTenantId,
        status: MediaAssetStatus.READY,
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        storageKey: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Marketplace media asset no longer exists or is not ready');
    }

    const expiresInSeconds = dto.expiresInSeconds ?? 900;
    const downloadUrl = await this.storage.generatePresignedDownloadUrl(
      asset.storageKey,
      expiresInSeconds,
    );

    if (!isOwner) {
      await this.recordUsageEvent({
        item,
        subscriberTenantId: tenantId,
        userId,
        eventType: MarketplaceUsageEventType.MEDIA_SIGNED_URL,
        quantity: 1,
      });
    }

    return {
      asset: {
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
      },
      downloadUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  async createUsageEvent(
    itemId: string,
    tenantId: string,
    userId: string,
    dto: CreateMarketplaceUsageEventDto,
  ) {
    if (dto.eventType === MarketplaceUsageEventType.SUBSCRIPTION_STARTED) {
      throw new BadRequestException(
        'Subscription usage events are recorded by the subscription flow',
      );
    }

    const { item, isOwner } = await this.ensureReadAccess(itemId, tenantId);
    if (isOwner) {
      return { recorded: false, reason: 'Owner access is not counted as cross-tenant usage' };
    }

    const event = await this.recordUsageEvent({
      item,
      subscriberTenantId: tenantId,
      userId,
      eventType: dto.eventType,
      quantity: dto.quantity ?? 1,
      seconds: dto.seconds,
    });

    return { recorded: true, event };
  }

  async getRevenueReport(providerTenantId: string, query: MarketplaceReportQueryDto) {
    const occurredAt =
      query.startDate || query.endDate
        ? {
            gte: query.startDate ? new Date(query.startDate) : undefined,
            lte: query.endDate ? new Date(query.endDate) : undefined,
          }
        : undefined;
    const where: Prisma.MarketplaceUsageEventWhereInput = {
      providerTenantId,
      marketplaceItemId: query.itemId,
      occurredAt,
    };

    const events = await this.prisma.marketplaceUsageEvent.findMany({
      where,
      include: {
        marketplaceItem: {
          select: {
            id: true,
            title: true,
            resourceType: true,
            pricingModel: true,
            priceCents: true,
            currency: true,
            revenueShareBps: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });

    const rows = new Map<
      string,
      {
        itemId: string;
        title: string;
        resourceType: MarketplaceResourceType;
        pricingModel: MarketplacePricingModel;
        currency: string;
        usageCount: number;
        subscriberTenantCount: number;
        streamSeconds: number;
        grossRevenueCents: number;
        providerRevenueCents: number;
      }
    >();
    const subscribersByItem = new Map<string, Set<string>>();

    for (const event of events) {
      const current = rows.get(event.marketplaceItemId) ?? {
        itemId: event.marketplaceItemId,
        title: event.marketplaceItem.title,
        resourceType: event.marketplaceItem.resourceType,
        pricingModel: event.marketplaceItem.pricingModel,
        currency: event.marketplaceItem.currency,
        usageCount: 0,
        subscriberTenantCount: 0,
        streamSeconds: 0,
        grossRevenueCents: 0,
        providerRevenueCents: 0,
      };
      const subscriberSet = subscribersByItem.get(event.marketplaceItemId) ?? new Set<string>();

      current.usageCount += event.quantity;
      current.streamSeconds += event.seconds ?? 0;
      current.grossRevenueCents +=
        event.eventType === MarketplaceUsageEventType.SUBSCRIPTION_STARTED
          ? event.marketplaceItem.priceCents
          : 0;
      current.providerRevenueCents += event.revenueShareCents;
      subscriberSet.add(event.subscriberTenantId);
      current.subscriberTenantCount = subscriberSet.size;

      subscribersByItem.set(event.marketplaceItemId, subscriberSet);
      rows.set(event.marketplaceItemId, current);
    }

    return {
      generatedAt: new Date().toISOString(),
      rows: Array.from(rows.values()).sort((left, right) => right.usageCount - left.usageCount),
      totals: Array.from(rows.values()).reduce(
        (totals, row) => ({
          usageCount: totals.usageCount + row.usageCount,
          streamSeconds: totals.streamSeconds + row.streamSeconds,
          grossRevenueCents: totals.grossRevenueCents + row.grossRevenueCents,
          providerRevenueCents: totals.providerRevenueCents + row.providerRevenueCents,
        }),
        { usageCount: 0, streamSeconds: 0, grossRevenueCents: 0, providerRevenueCents: 0 },
      ),
    };
  }

  private async ensureResourceBelongsToTenant(
    ownerTenantId: string,
    resourceType: MarketplaceResourceType,
    resourceId: string,
  ) {
    if (resourceType === MarketplaceResourceType.COURSE) {
      const course = await this.prisma.course.findFirst({
        where: { id: resourceId, tenantId: ownerTenantId, deletedAt: null },
        select: { id: true },
      });
      if (!course) {
        throw new NotFoundException('Course resource not found in publishing tenant');
      }
      return;
    }

    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: resourceId, tenantId: ownerTenantId, status: MediaAssetStatus.READY },
      select: { id: true },
    });
    if (!asset) {
      throw new NotFoundException('READY media asset resource not found in publishing tenant');
    }
  }

  private async ensureOwnerItem(ownerTenantId: string, itemId: string) {
    const item = await this.prisma.marketplaceItem.findFirst({
      where: { id: itemId, ownerTenantId },
      include: this.itemInclude(),
    });
    if (!item) {
      throw new NotFoundException('Marketplace item not found in publishing tenant');
    }
    return item;
  }

  private async findItem(itemId: string) {
    const item = await this.prisma.marketplaceItem.findFirst({
      where: { id: itemId },
      include: this.itemInclude(),
    });
    if (!item) {
      throw new NotFoundException('Marketplace item not found');
    }
    return item;
  }

  private async findPublishedItem(itemId: string) {
    const item = await this.prisma.marketplaceItem.findFirst({
      where: { id: itemId, isPublished: true },
      include: this.itemInclude(),
    });
    if (!item) {
      throw new NotFoundException('Published marketplace item not found');
    }
    return item;
  }

  private async ensureReadAccess(itemId: string, tenantId: string): Promise<MarketplaceAccess> {
    const item = await this.findItem(itemId);
    if (item.ownerTenantId === tenantId) {
      return { item, isOwner: true };
    }

    if (!item.isPublished) {
      throw new ForbiddenException('Marketplace item is not published');
    }

    await this.ensureActiveSubscription(item.id, tenantId);
    return { item, isOwner: false };
  }

  private async ensureActiveSubscription(marketplaceItemId: string, tenantId: string) {
    const now = new Date();
    const subscription = await this.prisma.resourceSubscription.findFirst({
      where: {
        marketplaceItemId,
        subscriberTenantId: tenantId,
        status: ResourceSubscriptionStatus.ACTIVE,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      select: { id: true },
    });

    if (!subscription) {
      throw new ForbiddenException('Active resource subscription is required');
    }
  }

  private async recordUsageEvent(input: {
    item: MarketplaceItemWithOwner;
    subscriberTenantId: string;
    eventType: MarketplaceUsageEventType;
    quantity: number;
    userId?: string;
    seconds?: number;
    revenueShareCents?: number;
  }) {
    return this.prisma.marketplaceUsageEvent.create({
      data: {
        marketplaceItemId: input.item.id,
        providerTenantId: input.item.ownerTenantId,
        subscriberTenantId: input.subscriberTenantId,
        userId: input.userId,
        resourceType: input.item.resourceType,
        resourceId: input.item.resourceId,
        eventType: input.eventType,
        quantity: input.quantity,
        seconds: input.seconds,
        revenueShareCents: input.revenueShareCents ?? 0,
      },
    });
  }

  private computeRevenueShare(amountCents: number, revenueShareBps: number) {
    return Math.round((amountCents * revenueShareBps) / 10000);
  }

  private itemInclude() {
    return {
      ownerTenant: { select: { id: true, name: true, slug: true } },
    } satisfies Prisma.MarketplaceItemInclude;
  }

  private toJsonInput(value: Record<string, unknown> | undefined) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
  }
}
