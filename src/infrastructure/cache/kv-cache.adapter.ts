import type { CachePort } from "../../domain/ports/cache.port";

export class KvCacheAdapter implements CachePort {
  constructor(private readonly kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    return this.kv.get<T>(key, "json");
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const jitter = Math.floor(ttlSeconds * 0.1 * Math.random());
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds + jitter,
    });
  }
}
