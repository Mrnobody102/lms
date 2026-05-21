import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';

function createService(mediaAsset: Partial<Record<string, unknown>> | null) {
  const prisma = {
    mediaAsset: {
      findUnique: vi.fn().mockResolvedValue(mediaAsset),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  const storage = {
    generatePresignedUploadUrl: vi.fn(),
    deleteObject: vi.fn(),
    getPublicUrl: vi.fn(),
  };
  return new MediaService(prisma as never, storage as never);
}

describe('MediaService.validateAudioAsset', () => {
  it('returns the asset when it is ready, audio mime, and tenant matches', async () => {
    const asset = {
      id: 'asset-1',
      tenantId: 'tenant-1',
      status: 'READY',
      mimeType: 'audio/mpeg',
    };
    const service = createService(asset);

    await expect(service.validateAudioAsset('tenant-1', 'asset-1')).resolves.toEqual(asset);
  });

  it('rejects when asset is missing', async () => {
    const service = createService(null);

    await expect(service.validateAudioAsset('tenant-1', 'missing')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when asset belongs to another tenant', async () => {
    const service = createService({
      id: 'asset-1',
      tenantId: 'other-tenant',
      status: 'READY',
      mimeType: 'audio/mpeg',
    });

    await expect(service.validateAudioAsset('tenant-1', 'asset-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when asset is still uploading', async () => {
    const service = createService({
      id: 'asset-1',
      tenantId: 'tenant-1',
      status: 'UPLOADING',
      mimeType: 'audio/mpeg',
    });

    await expect(service.validateAudioAsset('tenant-1', 'asset-1')).rejects.toThrow('not ready');
  });

  it('rejects when asset is not an audio file', async () => {
    const service = createService({
      id: 'asset-1',
      tenantId: 'tenant-1',
      status: 'READY',
      mimeType: 'image/png',
    });

    await expect(service.validateAudioAsset('tenant-1', 'asset-1')).rejects.toThrow(
      'not an audio file',
    );
  });
});
