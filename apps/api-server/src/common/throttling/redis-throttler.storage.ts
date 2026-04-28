import { Injectable, OnModuleDestroy } from '@nestjs/common';
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
  private readonly redis: Redis | undefined;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
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
    if (!this.redis) {
      throw new Error('REDIS_URL is required for RedisThrottlerStorage');
    }

    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }

    const namespacedKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${namespacedKey}:blocked`;
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
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis && this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }

  private async getTimeToExpire(key: string): Promise<number> {
    if (!this.redis) return 0;
    const ttl = await this.redis.pttl(key);
    return ttl > 0 ? Math.ceil(ttl / 1000) : 0;
  }
}
