import { Controller, Get, Header, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';
import { MetricsService, PROMETHEUS_CONTENT_TYPE } from '../metrics/metrics.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Backward-compatible readiness summary' })
  async check(@Res({ passthrough: true }) response: Response) {
    return this.getReadinessResponse(response);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for dependencies' })
  async getReadiness(@Res({ passthrough: true }) response: Response) {
    return this.getReadinessResponse(response);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Basic in-memory request metrics' })
  getMetrics() {
    return this.metricsService.getSnapshot();
  }

  @Get('metrics/prometheus')
  @Header('Content-Type', PROMETHEUS_CONTENT_TYPE)
  @ApiOperation({ summary: 'Prometheus text exposition for request metrics' })
  getPrometheusMetrics() {
    return this.metricsService.getPrometheusSnapshot();
  }

  @Get('docs')
  @ApiOperation({ summary: 'Human-readable health endpoint reference' })
  getDocs() {
    return this.healthService.getDocs();
  }

  private async getReadinessResponse(response: Response) {
    const startedAt = Date.now();
    const readiness = await this.healthService.getReadiness();
    this.metricsService.recordReadiness({
      status: readiness.status === 'ok' ? 'ok' : 'unhealthy',
      durationMs: Date.now() - startedAt,
      checks: readiness.checks,
    });

    if (readiness.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return readiness;
  }
}
