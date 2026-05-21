import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { MediaAsset } from '@repo/database';
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
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.tenantId !== tenantId) {
      throw new NotFoundException('Media asset not found');
    }

    const publicUrl = this.storage.getPublicUrl(asset.storageKey);

    const updatedAsset = await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        status: 'READY',
        url: publicUrl,
      },
    });

    this.logger.log(`Media asset ${assetId} marked as READY.`);
    return updatedAsset;
  }

  async validateAudioAsset(tenantId: string, assetId: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.tenantId !== tenantId) {
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
