import { Injectable } from '@nestjs/common';
import * as net from 'node:net';
import { URL } from 'node:url';
import { PrismaService } from '../services/prisma.service';

interface DependencyCheck {
  status: 'up' | 'down' | 'skipped';
  latencyMs?: number;
  message?: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      service: 'api-server',
      version: process.env.npm_package_version ?? '0.0.0',
    };
  }

  async getReadiness() {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const status = database.status === 'up' && redis.status !== 'down' ? 'ok' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      service: 'api-server',
      version: process.env.npm_package_version ?? '0.0.0',
      checks: {
        database,
        redis,
      },
    };
  }

  private async checkDatabase(): Promise<DependencyCheck> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'up',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkRedis(): Promise<DependencyCheck> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        status: 'skipped',
        message: 'REDIS_URL is not configured',
      };
    }

    const startedAt = Date.now();

    try {
      const response = await this.pingRedis(redisUrl, 3000);
      return {
        status: response === '+PONG' ? 'up' : 'down',
        latencyMs: Date.now() - startedAt,
        message: response === '+PONG' ? undefined : `Unexpected Redis response: ${response}`,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  }

  private pingRedis(redisUrl: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(redisUrl);
      const socket = net.createConnection({
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port || 6379),
      });

      const cleanup = () => {
        socket.removeAllListeners();
        socket.destroy();
      };

      socket.setTimeout(timeoutMs);

      socket.once('connect', () => {
        socket.write('*1\r\n$4\r\nPING\r\n');
      });

      socket.once('data', (buffer) => {
        const response = buffer.toString('utf8').trim();
        cleanup();
        resolve(response);
      });

      socket.once('timeout', () => {
        cleanup();
        reject(new Error('Redis health check timed out'));
      });

      socket.once('error', (error) => {
        cleanup();
        reject(error);
      });
    });
  }
}
