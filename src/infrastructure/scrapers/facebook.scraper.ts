import type { Scraper } from "../../domain/ports/scraper.port";
import type { HttpClientPort } from "../../domain/ports/http-client.port";
import type { BrowserPort } from "../../domain/ports/browser.port";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { NormalizedPost } from "../../domain/entities/post";
import { Platform } from "../../domain/entities/platform";
import { extractAllJsonScripts } from "./parsers/html-json";
import { parseFacebookPosts, parseFacebookProfile } from "./parsers/facebook.parser";

const filterByNiche = (posts: NormalizedPost[], niche: string): NormalizedPost[] => {
  if (!niche) return posts;
  const needle = niche.toLowerCase();
  return posts.filter((p) => p.text.toLowerCase().includes(needle));
};

export class FacebookScraper implements Scraper {
  constructor(
    private readonly http: HttpClientPort,
    private readonly browser: BrowserPort,
  ) {}

  private async loadHtml(url: string): Promise<string> {
    const res = await this.http.get(url, { referer: "https://www.facebook.com/" });
    if (res.ok && res.body.includes("og:title")) return res.body;
    return this.browser.renderHtml(url, { timeoutMs: 25_000 }).catch(() => res.body ?? "");
  }

  async profile(url: string): Promise<ScrapeResult<NormalizedProfile>> {
    const html = await this.loadHtml(url);
    const profile = html ? parseFacebookProfile(html, url) : null;
    return {
      platform: Platform.Facebook,
      data: profile ? [profile] : [],
      degraded: !profile,
    };
  }

  async feeds(url: string, niche: string): Promise<ScrapeResult<NormalizedPost>> {
    const html = await this.loadHtml(url);
    const posts = html ? filterByNiche(parseFacebookPosts(extractAllJsonScripts(html)), niche) : [];
    return { platform: Platform.Facebook, data: posts, degraded: posts.length === 0 };
  }
}
