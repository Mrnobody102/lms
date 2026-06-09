import { Logger } from '@nestjs/common';
import type { CacheOptions } from '@nestjs/cache-manager';
import KeyvRedis, { type RedisClientOptions } from '@keyv/redis';

const logger = new Logger('ResilientCache');

const DEFAULT_TTL_MS = 60_000;
const CONNECT_TIMEOUT_MS = 2_000;
// Hard ceiling for any single cache operation. If Redis is slow or mid-reconnect
// the awaited command can otherwise never settle, which would block the request
// thread. On timeout we treat the operation as a miss/no-op so the request falls
// through to its source (the database).
const OPERATION_TIMEOUT_MS = 250;

/**
 * Resolve `promise` to `fallback` if it does not settle within `OPERATION_TIMEOUT_MS`.
 * A rejected cache operation also resolves to the fallback so callers never see
 * a cache error — the request simply behaves as a cache miss.
 */
function withTimeout<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const finish = (value: T) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const timer = setTimeout(() => finish(fallback), OPERATION_TIMEOUT_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }

    operation().then(
      (value) => {
        clearTimeout(timer);
        finish(value);
      },
      () => {
        clearTimeout(timer);
        finish(fallback);
      },
    );
  });
}

/**
 * Wrap the hot-path store methods so a Redis outage or stall can never block a
 * request. Reads resolve to a miss, writes/deletes become no-ops. The store
 * keeps reconnecting in the background, so it self-heals once Redis returns.
 */
function makeStoreResilient(store: KeyvRedis<unknown>): void {
  const originalGet = store.get.bind(store);
  const originalGetMany = store.getMany.bind(store);
  const originalSet = store.set.bind(store);
  const originalSetMany = store.setMany.bind(store);
  const originalHas = store.has.bind(store);
  const originalDelete = store.delete.bind(store);
  const originalDeleteMany = store.deleteMany.bind(store);

  store.get = ((key: string) => withTimeout(() => originalGet(key), undefined)) as typeof store.get;
  store.getMany = ((keys: string[]) =>
    withTimeout(
      () => originalGetMany(keys),
      keys.map(() => undefined),
    )) as typeof store.getMany;
  store.set = ((key: string, value: string, ttl?: number) =>
    withTimeout(() => originalSet(key, value, ttl), undefined)) as typeof store.set;
  store.setMany = ((entries: Parameters<typeof originalSetMany>[0]) =>
    withTimeout(() => originalSetMany(entries), undefined)) as typeof store.setMany;
  store.has = ((key: string) => withTimeout(() => originalHas(key), false)) as typeof store.has;
  store.delete = ((key: string) =>
    withTimeout(() => originalDelete(key), false)) as typeof store.delete;
  store.deleteMany = ((keys: string[]) =>
    withTimeout(() => originalDeleteMany(keys), false)) as typeof store.deleteMany;
}

/**
 * Build cache options whose Redis store fails fast instead of hanging when
 * Redis is unavailable. Two layers protect the request path:
 *  1. Connection-level: `disableOfflineQueue` + a bounded `reconnectStrategy`
 *     so commands are not buffered indefinitely while Redis is unreachable.
 *  2. Operation-level: every store call is wrapped with a hard timeout so a
 *     slow or mid-reconnect client turns into a fast cache miss rather than a
 *     hung request.
 */
export function buildResilientCacheOptions(redisUrl: string | undefined): CacheOptions {
  if (!redisUrl) {
    return {};
  }

  const clientOptions: RedisClientOptions = {
    url: redisUrl,
    // Fail fast instead of buffering commands while Redis is unreachable.
    disableOfflineQueue: true,
    socket: {
      connectTimeout: CONNECT_TIMEOUT_MS,
      // Keep trying to reconnect in the background, but cap the backoff so a
      // recovered Redis is picked up again without hammering it.
      reconnectStrategy: (retries: number) => Math.min(retries * 200, 5_000),
    },
  };

  const store = new KeyvRedis(clientOptions);

  // node-redis emits 'error' on every failed (re)connect attempt. Without a
  // listener these would surface as unhandled errors; we log once at warn level
  // and let cache operations no-op so the DB serves the request.
  store.on('error', (error: unknown) => {
    logger.warn(
      `Redis cache unavailable; serving from source until it recovers: ${
        error instanceof Error ? error.message : 'Unknown Redis error'
      }`,
    );
  });

  makeStoreResilient(store);

  return {
    stores: [store],
    ttl: DEFAULT_TTL_MS,
  };
}
