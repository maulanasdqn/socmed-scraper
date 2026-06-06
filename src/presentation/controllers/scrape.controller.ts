import type { Context } from "hono";
import type { ScrapeProfileUseCase } from "../../application/use-cases/scrape-profile.use-case";
import type { ScrapeFeedsUseCase } from "../../application/use-cases/scrape-feeds.use-case";
import { InvalidUrlError, UnsupportedPlatformError } from "../../domain/errors/scrape.error";
import { feedsSchema, profileSchema } from "../schemas/scrape.schema";
import { toApiResponse } from "../mappers/response.mapper";

export class ScrapeController {
  constructor(
    private readonly profileUseCase: ScrapeProfileUseCase,
    private readonly feedsUseCase: ScrapeFeedsUseCase,
  ) {}

  async scrapeProfile(c: Context) {
    const parsed = profileSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ message: "Invalid payload", data: [] }, 400);
    return this.handle(
      c,
      () => this.profileUseCase.execute(parsed.data.url, parsed.data.proxyUrl),
      "Profile scraped",
    );
  }

  async scrapeFeeds(c: Context) {
    const parsed = feedsSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ message: "Invalid payload", data: [] }, 400);
    return this.handle(
      c,
      () => this.feedsUseCase.execute(parsed.data.url, parsed.data.niche, parsed.data.proxyUrl),
      "Feeds scraped",
    );
  }

  private async handle(
    c: Context,
    action: () => Promise<Awaited<ReturnType<ScrapeProfileUseCase["execute"]>>>,
    message: string,
  ) {
    try {
      const output = await action();
      return c.json(toApiResponse(message, output), 200);
    } catch (error) {
      if (error instanceof InvalidUrlError || error instanceof UnsupportedPlatformError) {
        return c.json({ message: error.message, data: [] }, 400);
      }
      return c.json({ message: "Scrape failed", data: [] }, 502);
    }
  }
}
