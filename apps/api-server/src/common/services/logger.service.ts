import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';
import { redactLogMeta } from './log-redaction.util';

export interface LogMeta {
  [key: string]: unknown;
  context?: string;
  requestId?: string;
  userId?: string;
  tenantId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: unknown;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly usePrettyTransport =
    process.env.NODE_ENV !== 'production' && process.stdout.isTTY === true;

  private readonly logger: Logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: this.usePrettyTransport
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });

  private sanitizeMeta(meta?: LogMeta): Record<string, unknown> | undefined {
    if (!meta) return undefined;

    return redactLogMeta(meta);
  }

  log(message: string, meta?: LogMeta) {
    this.logger.info(this.sanitizeMeta(meta), message);
  }

  info(message: string, meta?: LogMeta) {
    this.logger.info(this.sanitizeMeta(meta), message);
  }

  warn(message: string, meta?: LogMeta) {
    this.logger.warn(this.sanitizeMeta(meta), message);
  }

  error(message: string, meta?: LogMeta) {
    this.logger.error(this.sanitizeMeta(meta), message);
  }

  debug(message: string, meta?: LogMeta) {
    this.logger.debug(this.sanitizeMeta(meta), message);
  }

  verbose(message: string, meta?: LogMeta) {
    this.logger.debug(this.sanitizeMeta(meta), message);
  }
}
