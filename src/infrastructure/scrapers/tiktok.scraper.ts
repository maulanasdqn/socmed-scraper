import type { Scraper } from "../../domain/ports/scraper.port";
import type { HttpClientPort } from "../../domain/ports/http-client.port";
import type { BrowserPort } from "../../domain/ports/browser.port";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { NormalizedPost } from "../../domain/entities/post";
import { Platform } from "../../domain/entities/platform";
import { extractUsername } from "../../application/services/platform-detector";
import { extractScriptJson, parseJsonLoose } from "./parsers/html-json";
import {
  parseTikTokOembed,
  parseTikTokPosts,
  parseTikTokProfile,
} from "./parsers/tiktok.parser";

const DATA_ID = "__UNIVERSAL_DATA_FOR_REHYDRATION__";

const profilePage = (username: string): string => `https://www.tiktok.com/@${username}`;
const tagPage = (niche: string): string =>
  `https://www.tiktok.com/tag/${encodeURIComponent(niche)}`;
const oembedUrl = (url: string): string =>
  `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

export class TikTokScraper implements Scraper {
  constructor(
    private readonly http: HttpClientPort,
    private readonly browser: BrowserPort,
  ) {}

  private async loadData(url: string): Promise<unknown> {
    const res = await this.http.get(url, { referer: "https://www.tiktok.com/" });
    let html = res.ok ? res.body : "";
    if (!html.includes(DATA_ID)) {
      html = await this.browser
        .renderHtml(url, { waitForSelector: `#${DATA_ID}` })
        .catch(() => "");
    }
    return extractScriptJson(html, DATA_ID);
  }

  private async oembed(url: string): Promise<NormalizedPost[]> {
    const res = await this.http.get(oembedUrl(url), { referer: "https://www.tiktok.com/" });
    const json = res.ok ? parseJsonLoose<Record<string, unknown>>(res.body) : null;
    return json ? parseTikTokOembed(json, url) : [];
  }

  async profile(url: string): Promise<ScrapeResult<NormalizedProfile>> {
    const data = await this.loadData(profilePage(extractUsername(url)));
    const profile = data ? parseTikTokProfile(data, url) : null;
    return {
      platform: Platform.TikTok,
      data: profile ? [profile] : [],
      degraded: !profile,
    };
  }

  async feeds(url: string, niche: string): Promise<ScrapeResult<NormalizedPost>> {
    const target = niche ? tagPage(niche) : profilePage(extractUsername(url));
    const data = await this.loadData(target);
    let posts = data ? parseTikTokPosts(data) : [];
    if (posts.length === 0 && url.includes("/video/")) posts = await this.oembed(url);
    return { platform: Platform.TikTok, data: posts, degraded: posts.length === 0 };
  }
}
