import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Prisma, PronunciationAssessmentStatus } from '@repo/database';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/services/prisma.service';
import { PronunciationAssessmentProvider } from './pronunciation-provider.interface';

interface PronunciationAssessmentJobPayload {
  tenantId: string;
  assessmentId: string;
}

@Injectable()
export class PronunciationAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: PronunciationAssessmentProvider,
    @InjectQueue('pronunciation-assessment')
    private readonly queue: Queue<PronunciationAssessmentJobPayload>,
  ) {}

  async createAndAssess(params: {
    tenantId: string;
    sessionId: string;
    messageId: string;
    mediaAssetId: string;
    mediaUrl: string | null;
    expectedText?: string;
    targetLanguage: string;
  }) {
    const assessment = await this.prisma.pronunciationAssessment.create({
      data: {
        tenantId: params.tenantId,
        sessionId: params.sessionId,
        messageId: params.messageId,
        mediaAssetId: params.mediaAssetId,
        expectedText: params.expectedText,
        status: PronunciationAssessmentStatus.QUEUED,
      },
    });

    await this.queue.add('assess-pronunciation', {
      tenantId: params.tenantId,
      assessmentId: assessment.id,
    });

    return assessment;
  }

  async processAssessment(tenantId: string, assessmentId: string) {
    const assessment = await this.prisma.pronunciationAssessment.findFirst({
      where: { id: assessmentId, tenantId },
      include: {
        mediaAsset: { select: { id: true, url: true } },
        session: { select: { scenarioRef: { select: { targetLanguage: true } } } },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Pronunciation assessment not found');
    }

    await this.prisma.pronunciationAssessment.update({
      where: { id_tenantId: { id: assessment.id, tenantId } },
      data: { status: PronunciationAssessmentStatus.PROCESSING },
    });

    try {
      const result = await this.provider.assess({
        mediaAssetId: assessment.mediaAsset.id,
        mediaUrl: assessment.mediaAsset.url,
        expectedText: assessment.expectedText ?? undefined,
        targetLanguage: assessment.session.scenarioRef?.targetLanguage ?? 'en-US',
      });

      return this.prisma.pronunciationAssessment.update({
        where: { id_tenantId: { id: assessment.id, tenantId } },
        data: {
          status:
            result.status === 'COMPLETED'
              ? PronunciationAssessmentStatus.COMPLETED
              : PronunciationAssessmentStatus.FAILED,
          transcript: result.transcript,
          overallScore: result.overallScore,
          fluencyScore: result.fluencyScore,
          accuracyScore: result.accuracyScore,
          completenessScore: result.completenessScore,
          wordScores: this.toJsonInput(result.wordScores),
          provider: result.provider,
          rawProviderPayload: this.toJsonInput(result.rawProviderPayload),
          errorMessage: result.errorMessage,
        },
      });
    } catch (error) {
      return this.prisma.pronunciationAssessment.update({
        where: { id_tenantId: { id: assessment.id, tenantId } },
        data: {
          status: PronunciationAssessmentStatus.FAILED,
          provider: 'provider-error',
          errorMessage: error instanceof Error ? error.message : 'Pronunciation assessment failed',
        },
      });
    }
  }

  async listForSession(tenantId: string, sessionId: string) {
    return this.prisma.pronunciationAssessment.findMany({
      where: { tenantId, sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private toJsonInput(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}
