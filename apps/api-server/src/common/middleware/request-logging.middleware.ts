import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const start = Date.now();

    // Attach requestId to request for downstream use
    (req as Request & { requestId: string }).requestId = requestId;

    // Log incoming request
    this.logger.info('Incoming request', {
      method: req.method,
      path: req.originalUrl,
      requestId,
      userAgent: req.headers['user-agent'],
    });

    // Hook into response finish to log completion
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? (res.statusCode >= 500 ? 'error' : 'warn') : 'info';

      this.logger[level]('Request completed', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        requestId,
      });
    });

    next();
  }
}
