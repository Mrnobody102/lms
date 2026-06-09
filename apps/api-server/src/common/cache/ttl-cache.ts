/**
 * Minimal in-process TTL cache for small, hot, read-mostly lookups
 * (tenant resolution, JWT user validation). Values live in the Node process,
 * so reads never hit the network and cannot hang when Redis is unavailable.
 *
 * This is intentionally per-instance: entries are short-lived and each app
 * replica keeps its own copy. It is not a substitute for the shared Redis
 * cache used for response caching — it only removes a per-request database
 * round-trip on the auth/tenant hot path.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 5_000,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Bound memory: when full, drop the oldest inserted key (Map preserves
    // insertion order) before adding the new one.
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteWhere(predicate: (value: T, key: string) => boolean): void {
    for (const [key, entry] of this.store.entries()) {
      if (predicate(entry.value, key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}
