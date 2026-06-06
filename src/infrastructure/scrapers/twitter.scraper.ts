import type { Scraper, ScrapeOptions } from "../../domain/ports/scraper.port";
import type { HttpClientPort } from "../../domain/ports/http-client.port";
import type { ScrapeResult } from "../../domain/entities/scrape-result";
import type { NormalizedProfile } from "../../domain/entities/profile";
import type { NormalizedPost } from "../../domain/entities/post";
import { Platform } from "../../domain/entities/platform";
import { extractUsername } from "../../application/services/platform-detector";
import { extractScriptJson } from "./parsers/html-json";
import { parseTwitterPosts, parseTwitterProfile } from "./parsers/twitter.parser";

const timelineUrl = (username: string): string =>
  `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`;

const filterByNiche = (posts: NormalizedPost[], niche: string): NormalizedPost[] => {
  if (!niche) return posts;
  const needle = niche.toLowerCase();
  return posts.filter((p) => p.text.toLowerCase().includes(needle));
};

export class TwitterScraper implements Scraper {
  constructor(private readonly http: HttpClientPort) {}

  private async load(username: string, proxyUrl?: string): Promise<unknown> {
    const res = await this.http.get(timelineUrl(username), {
      referer: "https://twitter.com/",
      proxyUrl,
    });
    if (!res.ok) return null;
    return extractScriptJson(res.body, "__NEXT_DATA__");
  }

  async profile(url: string, options?: ScrapeOptions): Promise<ScrapeResult<NormalizedProfile>> {
    const data = await this.load(extractUsername(url), options?.proxyUrl);
    const profile = data ? parseTwitterProfile(data, url) : null;
    return {
      platform: Platform.Twitter,
      data: profile ? [profile] : [],
      degraded: !profile,
    };
  }

  async feeds(
    url: string,
    niche: string,
    options?: ScrapeOptions,
  ): Promise<ScrapeResult<NormalizedPost>> {
    const data = await this.load(extractUsername(url), options?.proxyUrl);
    const posts = data ? filterByNiche(parseTwitterPosts(data), niche) : [];
    return { platform: Platform.Twitter, data: posts, degraded: posts.length === 0 };
  }
}
