import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [PrismaModule, MetricsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
