import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis | undefined;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      });
      this.redis.on('error', (error) => {
        this.logger.warn(
          `Redis throttler unavailable; rate limiting is temporarily bypassed: ${error.message}`,
        );
      });
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const namespacedKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${namespacedKey}:blocked`;

    try {
      if (!this.redis) {
        return this.allowRequest(ttl);
      }

      const blockTtl = await this.redis.pttl(blockKey);

      if (blockTtl > 0) {
        const currentHits = Number((await this.redis.get(namespacedKey)) ?? 0);
        return {
          totalHits: currentHits,
          timeToExpire: await this.getTimeToExpire(namespacedKey),
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockTtl / 1000),
        };
      }

      const totalHits = await this.redis.incr(namespacedKey);
      if (totalHits === 1) {
        await this.redis.pexpire(namespacedKey, ttl);
      }

      const isBlocked = totalHits > limit;
      if (isBlocked) {
        await this.redis.psetex(blockKey, blockDuration, '1');
      }

      return {
        totalHits,
        timeToExpire: await this.getTimeToExpire(namespacedKey),
        isBlocked,
        timeToBlockExpire: isBlocked ? Math.ceil(blockDuration / 1000) : 0,
      };
    } catch (error) {
      this.logger.warn(
        `Redis throttler increment failed; rate limiting is temporarily bypassed: ${
          error instanceof Error ? error.message : 'Unknown Redis error'
        }`,
      );
      return this.allowRequest(ttl);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis && this.redis.status !== 'end') {
      if (this.redis.status === 'ready') {
        await this.redis.quit();
        return;
      }
      this.redis.disconnect();
    }
  }

  private async getTimeToExpire(key: string): Promise<number> {
    if (!this.redis) return 0;
    const ttl = await this.redis.pttl(key);
    return ttl > 0 ? Math.ceil(ttl / 1000) : 0;
  }

  private allowRequest(ttl: number): ThrottlerStorageRecord {
    return {
      totalHits: 0,
      timeToExpire: Math.ceil(ttl / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
