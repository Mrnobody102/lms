import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { getRequestPath } from '../utils/request-path.util';
import { TenantAwareRequest } from '../utils/tenant-request.util';
import { MetricsService } from './metrics.service';

@Injectable()
export class RequestMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      const tenantAwareRequest = req as TenantAwareRequest;
      this.metricsService.recordRequest({
        method: req.method,
        path: getRequestPath(req),
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        tenantId: tenantAwareRequest.tenantId,
      });
    });

    next();
  }
}
