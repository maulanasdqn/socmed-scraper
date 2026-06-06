import type { Scraper } from "../../domain/ports/scraper.port";
import type { HttpClientPort } from "../../domain/ports/http-client.port";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { NormalizedPost } from "../../domain/entities/post";
import { Platform } from "../../domain/entities/platform";
import { extractUsername } from "../../application/services/platform-detector";
import { parseJsonLoose } from "./parsers/html-json";
import { parseInstagramPosts, parseInstagramProfile } from "./parsers/instagram.parser";

const APP_ID = "936619743392459";
const HOME = "https://www.instagram.com/";

const profileUrl = (username: string): string =>
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

const tagUrl = (tag: string): string =>
  `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${encodeURIComponent(tag)}`;

export class InstagramScraper implements Scraper {
  constructor(private readonly http: HttpClientPort) {}

  private async csrfToken(): Promise<string> {
    const res = await this.http.get(HOME, { referer: HOME, retries: 1 });
    return res.setCookie.match(/csrftoken=([^;]+)/)?.[1] ?? "";
  }

  private async fetchJson(url: string, referer: string): Promise<unknown> {
    const csrf = await this.csrfToken();
    const headers = {
      "x-ig-app-id": APP_ID,
      "x-requested-with": "XMLHttpRequest",
      "x-csrftoken": csrf,
      cookie: `csrftoken=${csrf}`,
    };
    const res = await this.http.get(url, { headers, referer, retries: 1 });
    return res.ok ? parseJsonLoose(res.body) : null;
  }

  async profile(url: string): Promise<ScrapeResult<NormalizedProfile>> {
    const username = extractUsername(url);
    const data = await this.fetchJson(profileUrl(username), `${HOME}${username}/`);
    const profile = data ? parseInstagramProfile(data, url) : null;
    return {
      platform: Platform.Instagram,
      data: profile ? [profile] : [],
      degraded: !profile,
    };
  }

  async feeds(url: string, niche: string): Promise<ScrapeResult<NormalizedPost>> {
    const username = extractUsername(url);
    const target = niche ? tagUrl(niche) : profileUrl(username);
    const referer = niche ? `${HOME}explore/tags/${niche}/` : `${HOME}${username}/`;
    const data = await this.fetchJson(target, referer);
    const posts = data ? parseInstagramPosts(data) : [];
    return { platform: Platform.Instagram, data: posts, degraded: posts.length === 0 };
  }
}
