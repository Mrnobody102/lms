import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { MetricsService } from '../metrics/metrics.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Backward-compatible readiness summary' })
  async check() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for dependencies' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Basic in-memory request metrics' })
  getMetrics() {
    return this.metricsService.getSnapshot();
  }

  @Get('docs')
  @ApiOperation({ summary: 'Human-readable health endpoint reference' })
  getDocs() {
    return this.healthService.getDocs();
  }
}
