import type { CachePort } from "../../domain/ports/cache.port";
import type { NormalizedPost } from "../../domain/entities/post";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import { detectPlatform } from "../services/platform-detector";
import { ScraperRegistry } from "../services/scraper-registry";
import { buildCacheKey, type ScrapeOutput } from "./scrape-output";

const TTL_SECONDS = 600;

export class ScrapeFeedsUseCase {
  constructor(
    private readonly registry: ScraperRegistry,
    private readonly cache: CachePort,
  ) {}

  async execute(url: string, niche: string, proxyUrl = ""): Promise<ScrapeOutput> {
    const platform = detectPlatform(url);
    const key = buildCacheKey("feeds", platform, `${url}|${niche}`);

    const cached = await this.cache.get<ScrapeResult<NormalizedPost>>(key);
    if (cached) return { ...cached, cached: true };

    const result = await this.registry.resolve(platform).feeds(url, niche, { proxyUrl });
    if (!result.degraded && result.data.length > 0) {
      await this.cache.set(key, result, TTL_SECONDS);
    }
    return { ...result, cached: false };
  }
}
