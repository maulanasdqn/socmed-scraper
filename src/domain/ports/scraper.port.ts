import type { ScrapeResult } from "../entities/scrape-result";
import type { NormalizedProfile } from "../entities/profile";
import type { NormalizedPost } from "../entities/post";

export interface Scraper {
  profile(url: string): Promise<ScrapeResult<NormalizedProfile>>;
  feeds(url: string, niche: string): Promise<ScrapeResult<NormalizedPost>>;
}
