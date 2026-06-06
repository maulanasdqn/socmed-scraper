import type { Scraper } from "../../domain/ports/scraper.port";
import type { HttpClientPort } from "../../domain/ports/http-client.port";
import type { BrowserPort } from "../../domain/ports/browser.port";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { NormalizedPost } from "../../domain/entities/post";
import { Platform } from "../../domain/entities/platform";
import { extractUsername } from "../../application/services/platform-detector";
import { parseJsonLoose } from "./parsers/html-json";
import { parseInstagramPosts, parseInstagramProfile } from "./parsers/instagram.parser";

const APP_ID = "936619743392459";
const HEADERS = { "x-ig-app-id": APP_ID, "x-requested-with": "XMLHttpRequest" };

const profileUrl = (username: string): string =>
  `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

const tagUrl = (tag: string): string =>
  `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${encodeURIComponent(tag)}`;

export class InstagramScraper implements Scraper {
  constructor(
    private readonly http: HttpClientPort,
    private readonly browser: BrowserPort,
  ) {}

  private async fetchJson(url: string): Promise<unknown> {
    const res = await this.http.get(url, { headers: HEADERS, referer: "https://www.instagram.com/" });
    if (res.ok) return parseJsonLoose(res.body);
    const html = await this.browser.renderHtml(url).catch(() => "");
    return html ? parseJsonLoose(html) : null;
  }

  async profile(url: string): Promise<ScrapeResult<NormalizedProfile>> {
    const data = await this.fetchJson(profileUrl(extractUsername(url)));
    const profile = data ? parseInstagramProfile(data, url) : null;
    return {
      platform: Platform.Instagram,
      data: profile ? [profile] : [],
      degraded: !profile,
    };
  }

  async feeds(url: string, niche: string): Promise<ScrapeResult<NormalizedPost>> {
    const target = niche ? tagUrl(niche) : profileUrl(extractUsername(url));
    const data = await this.fetchJson(target);
    const posts = data ? parseInstagramPosts(data) : [];
    return { platform: Platform.Instagram, data: posts, degraded: posts.length === 0 };
  }
}
