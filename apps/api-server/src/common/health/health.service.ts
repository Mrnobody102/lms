import { Injectable } from '@nestjs/common';
import * as net from 'node:net';
import * as tls from 'node:tls';
import { URL } from 'node:url';
import { PrismaService } from '../services/prisma.service';

interface DependencyCheck {
  status: 'up' | 'down' | 'skipped';
  latencyMs?: number;
  message?: string;
}

interface HealthEndpointDoc {
  path: string;
  audience: 'monitoring' | 'human';
  purpose: string;
}

type RedisSocket = net.Socket | tls.TLSSocket;

interface RedisConnectionOptions {
  host: string;
  port: number;
  tls: boolean;
  username?: string;
  password?: string;
}

export function parseRedisConnectionUrl(redisUrl: string): RedisConnectionOptions {
  const parsedUrl = new URL(redisUrl);

  if (!['redis:', 'rediss:'].includes(parsedUrl.protocol)) {
    throw new Error('REDIS_URL must use redis:// or rediss://');
  }

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 6379),
    tls: parsedUrl.protocol === 'rediss:',
    username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
    password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
  };
}

export function buildRedisCommand(parts: string[]): string {
  return [
    `*${parts.length}`,
    ...parts.flatMap((part) => [`$${Buffer.byteLength(part)}`, part]),
    '',
  ].join('\r\n');
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

  getDocs() {
    return {
      service: 'api-server',
      generatedAt: new Date().toISOString(),
      endpoints: [
        {
          path: '/api/health/live',
          audience: 'monitoring',
          purpose: 'Liveness probe. Does not check downstream dependencies.',
        },
        {
          path: '/api/health/ready',
          audience: 'monitoring',
          purpose: 'Readiness probe. Checks database and Redis connectivity.',
        },
        {
          path: '/api/health/metrics',
          audience: 'monitoring',
          purpose:
            'In-memory request counters, error counts, readiness counters, and latency summary by API group.',
        },
        {
          path: '/api/health/metrics/prometheus',
          audience: 'monitoring',
          purpose:
            'Prometheus text exposition for per-instance request counters and latency summary.',
        },
        {
          path: '/api/health/docs',
          audience: 'human',
          purpose: 'Human-readable health and monitoring endpoint reference.',
        },
      ] satisfies HealthEndpointDoc[],
      notes: [
        '/api/health remains as a backward-compatible readiness alias.',
        'Monitoring systems should prefer /api/health/live, /api/health/ready, and /api/health/metrics.',
      ],
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
      const redisOptions = parseRedisConnectionUrl(redisUrl);
      const authCommand = redisOptions.password
        ? buildRedisCommand(
            redisOptions.username
              ? ['AUTH', redisOptions.username, redisOptions.password]
              : ['AUTH', redisOptions.password],
          )
        : null;
      const pingCommand = buildRedisCommand(['PING']);
      const socket: RedisSocket = redisOptions.tls
        ? tls.connect({
            host: redisOptions.host,
            port: redisOptions.port,
            servername: redisOptions.host,
          })
        : net.createConnection({
            host: redisOptions.host,
            port: redisOptions.port,
          });
      let responseBuffer = '';
      let waitingFor: 'auth' | 'ping' = authCommand ? 'auth' : 'ping';

      const cleanup = () => {
        socket.removeAllListeners();
        socket.destroy();
      };

      socket.setTimeout(timeoutMs);

      socket.once(redisOptions.tls ? 'secureConnect' : 'connect', () => {
        socket.write(authCommand ?? pingCommand);
      });

      socket.on('data', (buffer) => {
        responseBuffer += buffer.toString('utf8');

        while (responseBuffer.includes('\r\n')) {
          const separatorIndex = responseBuffer.indexOf('\r\n');
          const response = responseBuffer.slice(0, separatorIndex).trim();
          responseBuffer = responseBuffer.slice(separatorIndex + 2);

          if (response.startsWith('-')) {
            cleanup();
            reject(new Error(`Redis health check failed: ${response.slice(1)}`));
            return;
          }

          if (waitingFor === 'auth') {
            if (response !== '+OK') {
              cleanup();
              reject(new Error(`Unexpected Redis AUTH response: ${response}`));
              return;
            }

            waitingFor = 'ping';
            socket.write(pingCommand);
            continue;
          }

          cleanup();
          resolve(response);
          return;
        }
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
