import { Platform } from "./domain/entities/platform";
import { ScraperRegistry } from "./application/services/scraper-registry";
import { ScrapeProfileUseCase } from "./application/use-cases/scrape-profile.use-case";
import { ScrapeFeedsUseCase } from "./application/use-cases/scrape-feeds.use-case";
import { KvCacheAdapter } from "./infrastructure/cache/kv-cache.adapter";
import { FetchHttpClientAdapter } from "./infrastructure/http/fetch-http-client.adapter";
import { PuppeteerBrowserAdapter } from "./infrastructure/browser/puppeteer-browser.adapter";
import type { BrowserManager } from "./infrastructure/browser/browser-manager.do";
import { TwitterScraper } from "./infrastructure/scrapers/twitter.scraper";
import { InstagramScraper } from "./infrastructure/scrapers/instagram.scraper";
import { ThreadsScraper } from "./infrastructure/scrapers/threads.scraper";
import { TikTokScraper } from "./infrastructure/scrapers/tiktok.scraper";
import { FacebookScraper } from "./infrastructure/scrapers/facebook.scraper";
import { ScrapeController } from "./presentation/controllers/scrape.controller";

export const buildController = (env: CloudflareBindings): ScrapeController => {
  const http = new FetchHttpClientAdapter();
  const cache = new KvCacheAdapter(env.SCRAPE_CACHE);
  const browser = new PuppeteerBrowserAdapter(
    env.BROWSER_MANAGER as DurableObjectNamespace<BrowserManager>,
  );

  const registry = new ScraperRegistry([
    [Platform.Twitter, new TwitterScraper(http)],
    [Platform.Instagram, new InstagramScraper(http, browser)],
    [Platform.Threads, new ThreadsScraper(http, browser)],
    [Platform.TikTok, new TikTokScraper(http, browser)],
    [Platform.Facebook, new FacebookScraper(http, browser)],
  ]);

  return new ScrapeController(
    new ScrapeProfileUseCase(registry, cache),
    new ScrapeFeedsUseCase(registry, cache),
  );
};
