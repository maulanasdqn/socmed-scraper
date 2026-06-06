import type { Scraper, ScrapeOptions } from "../../domain/ports/scraper.port";
import type { HttpClientPort } from "../../domain/ports/http-client.port";
import type { BrowserPort } from "../../domain/ports/browser.port";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { NormalizedPost } from "../../domain/entities/post";
import { Platform } from "../../domain/entities/platform";
import { extractUsername } from "../../application/services/platform-detector";
import { extractAllJsonScripts } from "./parsers/html-json";
import { parseThreadsPosts, parseThreadsProfile } from "./parsers/threads.parser";

const profilePage = (username: string): string => `https://www.threads.net/@${username}`;

const searchPage = (niche: string): string =>
  `https://www.threads.net/search?q=${encodeURIComponent(niche)}&serp_type=default`;

export class ThreadsScraper implements Scraper {
  constructor(
    private readonly http: HttpClientPort,
    private readonly browser: BrowserPort,
  ) {}

  private async loadScripts(url: string, proxyUrl?: string): Promise<unknown[]> {
    const res = await this.http.get(url, { referer: "https://www.threads.net/", proxyUrl });
    const html = res.ok ? res.body : await this.browser.renderHtml(url).catch(() => "");
    return html ? extractAllJsonScripts(html) : [];
  }

  async profile(url: string, options?: ScrapeOptions): Promise<ScrapeResult<NormalizedProfile>> {
    const scripts = await this.loadScripts(profilePage(extractUsername(url)), options?.proxyUrl);
    const profile = parseThreadsProfile(scripts, url);
    return {
      platform: Platform.Threads,
      data: profile ? [profile] : [],
      degraded: !profile,
    };
  }

  async feeds(
    url: string,
    niche: string,
    options?: ScrapeOptions,
  ): Promise<ScrapeResult<NormalizedPost>> {
    const target = niche ? searchPage(niche) : profilePage(extractUsername(url));
    const scripts = await this.loadScripts(target, options?.proxyUrl);
    const posts = parseThreadsPosts(scripts);
    return { platform: Platform.Threads, data: posts, degraded: posts.length === 0 };
  }
}
