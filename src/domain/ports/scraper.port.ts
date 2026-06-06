import type { ScrapeResult } from "../entities/scrape-result";
import type { NormalizedProfile } from "../entities/profile";
import type { NormalizedPost } from "../entities/post";

export interface ScrapeOptions {
  proxyUrl?: string;
}

export interface Scraper {
  profile(url: string, options?: ScrapeOptions): Promise<ScrapeResult<NormalizedProfile>>;
  feeds(url: string, niche: string, options?: ScrapeOptions): Promise<ScrapeResult<NormalizedPost>>;
}
