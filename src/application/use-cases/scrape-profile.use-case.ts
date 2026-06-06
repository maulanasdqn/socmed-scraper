import type { CachePort } from "../../domain/ports/cache.port";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import { detectPlatform } from "../services/platform-detector";
import { ScraperRegistry } from "../services/scraper-registry";
import { buildCacheKey, type ScrapeOutput } from "./scrape-output";

const TTL_SECONDS = 1800;

export class ScrapeProfileUseCase {
  constructor(
    private readonly registry: ScraperRegistry,
    private readonly cache: CachePort,
  ) {}

  async execute(url: string, proxyUrl = ""): Promise<ScrapeOutput> {
    const platform = detectPlatform(url);
    const key = buildCacheKey("profile", platform, url);

    const cached = await this.cache.get<ScrapeResult<NormalizedProfile>>(key);
    if (cached) return { ...cached, cached: true };

    const result = await this.registry.resolve(platform).profile(url, { proxyUrl });
    if (!result.degraded && result.data.length > 0) {
      await this.cache.set(key, result, TTL_SECONDS);
    }
    return { ...result, cached: false };
  }
}
