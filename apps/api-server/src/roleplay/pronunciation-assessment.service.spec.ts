import { describe, expect, it, vi } from 'vitest';
import { PronunciationAssessmentStatus } from '@repo/database';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';

describe('PronunciationAssessmentService', () => {
  it('marks assessments as failed when the provider throws', async () => {
    const prisma = {
      pronunciationAssessment: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'assessment-1',
          tenantId: 'tenant-1',
          expectedText: 'ni hao',
          mediaAsset: { id: 'asset-1', url: 'https://cdn.example.com/audio.wav' },
          session: { scenarioRef: { targetLanguage: 'en-US' } },
        }),
        update: vi.fn().mockResolvedValue({ id: 'assessment-1' }),
      },
    };
    const provider = {
      assess: vi.fn().mockRejectedValue(new Error('provider timeout')),
    };
    const queue = { add: vi.fn() };
    const service = new PronunciationAssessmentService(
      prisma as never,
      provider as never,
      queue as never,
    );

    await service.processAssessment('tenant-1', 'assessment-1');

    expect(prisma.pronunciationAssessment.update).toHaveBeenNthCalledWith(1, {
      where: { id_tenantId: { id: 'assessment-1', tenantId: 'tenant-1' } },
      data: { status: PronunciationAssessmentStatus.PROCESSING },
    });
    expect(prisma.pronunciationAssessment.update).toHaveBeenNthCalledWith(2, {
      where: { id_tenantId: { id: 'assessment-1', tenantId: 'tenant-1' } },
      data: {
        errorMessage: 'provider timeout',
        provider: 'provider-error',
        status: PronunciationAssessmentStatus.FAILED,
      },
    });
  });
});
