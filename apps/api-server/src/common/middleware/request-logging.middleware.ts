import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import { REQUEST_ID_HEADER, resolveRequestId } from '../utils/request-id.util';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    const start = Date.now();

    // Attach requestId to request for downstream use
    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

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
