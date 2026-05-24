import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RiskFlagService } from '../admin-reports/risk-flag.service';

interface RiskRecomputeJobPayload {
  tenantId: string;
  courseId?: string;
  cohortId?: string;
}

@Processor('reporting')
export class ReportingProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportingProcessor.name);

  constructor(private readonly riskFlags: RiskFlagService) {
    super();
  }

  async process(job: Job<RiskRecomputeJobPayload, unknown, string>): Promise<unknown> {
    this.logger.log(`Processing reporting job ${job.id} (${job.name})`);

    if (job.name !== 'recompute-risk-flags') {
      this.logger.warn(`Unknown reporting job name: ${job.name}`);
      return { success: false, error: 'Unknown job name' };
    }

    return this.riskFlags.recomputeRiskSnapshots(job.data.tenantId, {
      cohortId: job.data.cohortId,
      courseId: job.data.courseId,
    });
  }
}
