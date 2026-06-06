import type { Platform } from "../../domain/entities/platform";
import type { ScrapeItem } from "../../domain/entities/scrape-result";

export interface ScrapeOutput {
  platform: Platform;
  data: ScrapeItem[];
  degraded: boolean;
  cached: boolean;
}

export const buildCacheKey = (kind: string, platform: Platform, suffix: string): string =>
  `${kind}:${platform}:${suffix.toLowerCase()}`;
