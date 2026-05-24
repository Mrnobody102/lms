import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { CohortComparisonService } from './cohort-comparison.service';
import { RiskFlagService } from './risk-flag.service';

@Module({
  controllers: [AdminReportsController],
  providers: [AdminReportsService, RiskFlagService, CohortComparisonService],
  exports: [AdminReportsService, RiskFlagService, CohortComparisonService],
})
export class AdminReportsModule {}
