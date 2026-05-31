import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MediaAssetStatus,
  SubscriptionStatus,
  UsageLedgerType,
  type MediaAsset,
} from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { StorageService } from '../storage/storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createPresignedUrl(
    tenantId: string,
    userId: string,
    filename: string,
    mimeType: string,
    sizeBytes: number,
  ) {
    await this.ensureStorageQuota(tenantId, sizeBytes);
    // Generate a unique storage key: {tenantId}/media/{uuid}_{filename}
    // Using a sanitized filename could be better, but UUID ensures no collision.
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storageKey = `${tenantId}/media/${randomUUID()}_${safeFilename}`;

    // Create DB record with UPLOADING status
    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        tenantId,
        userId,
        filename,
        mimeType,
        sizeBytes,
        storageKey,
        status: 'UPLOADING',
      },
    });

    // Generate Presigned URL (valid for 1 hour)
    const uploadUrl = await this.storage.generatePresignedUploadUrl(storageKey, mimeType, 3600);

    return {
      assetId: mediaAsset.id,
      uploadUrl,
      storageKey,
    };
  }

  async markUploadComplete(tenantId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, tenantId },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    const publicUrl = this.storage.getPublicUrl(asset.storageKey);

    await this.prisma.mediaAsset.updateMany({
      where: { id: assetId, tenantId },
      data: {
        status: 'READY',
        url: publicUrl,
      },
    });

    await this.prisma.usageLedger.create({
      data: {
        tenantId,
        type: UsageLedgerType.MEDIA_UPLOAD,
        quantity: BigInt(asset.sizeBytes),
        unit: 'bytes',
        sourceType: 'MediaAsset',
        sourceId: asset.id,
        description: `Uploaded ${asset.filename}`,
      },
    });

    const updatedAsset = await this.prisma.mediaAsset.findFirstOrThrow({
      where: { id: assetId, tenantId },
    });

    this.logger.log(`Media asset ${assetId} marked as READY.`);
    return updatedAsset;
  }

  private async ensureStorageQuota(tenantId: string, nextSizeBytes: number) {
    const [usage, subscription] = await Promise.all([
      this.prisma.mediaAsset.aggregate({
        where: { tenantId, status: { in: [MediaAssetStatus.UPLOADING, MediaAssetStatus.READY] } },
        _sum: { sizeBytes: true },
      }),
      this.prisma.tenantSubscription.findFirst({
        where: {
          tenantId,
          status: { in: [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE] },
        },
        orderBy: { createdAt: 'desc' },
        select: { storageQuotaBytes: true, plan: { select: { storageQuotaBytes: true } } },
      }),
    ]);

    const quota = subscription
      ? subscription.storageQuotaBytes > BigInt(0)
        ? subscription.storageQuotaBytes
        : subscription.plan.storageQuotaBytes
      : BigInt(0);

    if (quota <= BigInt(0)) {
      return;
    }

    const used = BigInt(usage._sum.sizeBytes ?? 0);
    if (used + BigInt(nextSizeBytes) > quota) {
      throw new BadRequestException('Tenant storage quota would be exceeded');
    }
  }

  async validateAudioAsset(tenantId: string, assetId: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, tenantId } });
    if (!asset) {
      throw new BadRequestException('Audio asset not found in this tenant');
    }
    if (asset.status !== 'READY') {
      throw new BadRequestException('Audio asset is not ready (still uploading)');
    }
    if (!asset.mimeType.startsWith('audio/')) {
      throw new BadRequestException('Asset is not an audio file');
    }
    return asset;
  }
}
