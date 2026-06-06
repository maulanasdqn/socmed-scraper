import type { Platform } from "../../domain/entities/platform";
import type { Scraper } from "../../domain/ports/scraper.port";

export class ScraperRegistry {
  private readonly scrapers: Map<Platform, Scraper>;

  constructor(entries: Array<[Platform, Scraper]>) {
    this.scrapers = new Map(entries);
  }

  resolve(platform: Platform): Scraper {
    const scraper = this.scrapers.get(platform);
    if (!scraper) throw new Error(`No scraper registered for platform: ${platform}`);
    return scraper;
  }
}
