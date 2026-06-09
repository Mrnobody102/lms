import { Logger } from '@nestjs/common';
import type { RedisClientOptions } from '@keyv/redis';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type RedisErrorHandler = (error: unknown) => void;

const redisMocks = vi.hoisted(() => {
  let errorHandler: RedisErrorHandler | undefined;
  // The factory reassigns these store methods (makeStoreResilient wraps them),
  // so each test reinstalls fresh mocks via resetStore() to undo prior wrapping.
  const redisStore = {} as Record<string, unknown>;

  const resetStore = () => {
    redisStore.get = vi.fn(async () => undefined);
    redisStore.getMany = vi.fn(async (keys: string[]) => keys.map(() => undefined));
    redisStore.set = vi.fn(async () => undefined);
    redisStore.setMany = vi.fn(async () => undefined);
    redisStore.has = vi.fn(async () => false);
    redisStore.delete = vi.fn(async () => false);
    redisStore.deleteMany = vi.fn(async () => false);
    redisStore.on = vi.fn((event: string, handler: RedisErrorHandler) => {
      if (event === 'error') {
        errorHandler = handler;
      }
    });
  };

  resetStore();

  return {
    keyvRedis: vi.fn(function KeyvRedisMock(_options: RedisClientOptions) {
      return redisStore;
    }),
    redisStore,
    resetStore,
    getErrorHandler: () => errorHandler,
    clearErrorHandler: () => {
      errorHandler = undefined;
    },
  };
});

vi.mock('@keyv/redis', () => ({
  default: redisMocks.keyvRedis,
}));

import { buildResilientCacheOptions } from './resilient-cache.factory';

describe('buildResilientCacheOptions', () => {
  beforeEach(() => {
    redisMocks.keyvRedis.mockClear();
    redisMocks.resetStore();
    redisMocks.clearErrorHandler();
  });

  it('should return empty cache options when Redis URL is not configured', () => {
    expect(buildResilientCacheOptions(undefined)).toEqual({});
    expect(redisMocks.keyvRedis).not.toHaveBeenCalled();
  });

  it('should configure Redis to fail fast and log connection errors', () => {
    const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const options = buildResilientCacheOptions('redis://localhost:6379');
    const [clientOptions] = redisMocks.keyvRedis.mock.calls[0] as [RedisClientOptions];

    expect(clientOptions.url).toBe('redis://localhost:6379');
    expect(clientOptions.disableOfflineQueue).toBe(true);
    expect(clientOptions.socket?.connectTimeout).toBe(2_000);

    const reconnectStrategy = clientOptions.socket?.reconnectStrategy;
    expect(typeof reconnectStrategy).toBe('function');
    if (typeof reconnectStrategy !== 'function') {
      throw new Error('Expected Redis reconnect strategy to be a function');
    }
    expect(reconnectStrategy(2, new Error('redis down'))).toBe(400);
    expect(reconnectStrategy(30, new Error('redis down'))).toBe(5_000);

    expect(options.ttl).toBe(60_000);
    expect(options.stores).toEqual([redisMocks.redisStore]);
    expect(redisMocks.redisStore.on as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );

    redisMocks.getErrorHandler()?.(new Error('connection refused'));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Redis cache unavailable; serving from source until it recovers'),
    );

    warnSpy.mockRestore();
  });

  it('should resolve a hanging cache read to a miss within the operation timeout', async () => {
    vi.useFakeTimers();
    try {
      // Simulate Redis mid-reconnect: the underlying get never settles.
      (redisMocks.redisStore.get as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => new Promise<undefined>(() => {}),
      );

      const options = buildResilientCacheOptions('redis://localhost:6379');
      const store = options.stores?.[0] as unknown as { get: (key: string) => Promise<unknown> };

      const readPromise = store.get('any-key');
      // Advance past the 250ms operation timeout; the read must resolve to a
      // miss (undefined) instead of hanging on the stalled Redis client.
      await vi.advanceTimersByTimeAsync(300);

      await expect(readPromise).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
