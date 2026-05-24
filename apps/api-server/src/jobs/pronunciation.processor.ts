import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PronunciationAssessmentService } from '../roleplay/pronunciation-assessment.service';

interface PronunciationAssessmentJobPayload {
  tenantId: string;
  assessmentId: string;
}

@Processor('pronunciation-assessment')
export class PronunciationProcessor extends WorkerHost {
  private readonly logger = new Logger(PronunciationProcessor.name);

  constructor(private readonly pronunciationAssessment: PronunciationAssessmentService) {
    super();
  }

  async process(job: Job<PronunciationAssessmentJobPayload, unknown, string>): Promise<unknown> {
    this.logger.log(`Processing pronunciation job ${job.id} (${job.name})`);

    if (job.name !== 'assess-pronunciation') {
      this.logger.warn(`Unknown pronunciation job name: ${job.name}`);
      return { success: false, error: 'Unknown job name' };
    }

    return this.pronunciationAssessment.processAssessment(job.data.tenantId, job.data.assessmentId);
  }
}
