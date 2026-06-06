import { DurableObject } from "cloudflare:workers";
import puppeteer, { type Browser } from "@cloudflare/puppeteer";
import type { BrowserRenderOptions } from "../../domain/ports/browser.port";

const KEEP_ALIVE_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 20_000;

interface ManagerEnv {
  MYBROWSER: Fetcher;
}

export class BrowserManager extends DurableObject<ManagerEnv> {
  private browser?: Browser;

  async renderHtml(url: string, options: BrowserRenderOptions = {}): Promise<string> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();
    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });
      if (options.waitForSelector) {
        await page
          .waitForSelector(options.waitForSelector, { timeout: 8_000 })
          .catch(() => undefined);
      }
      return await page.content();
    } finally {
      await page.close().catch(() => undefined);
      await this.ctx.storage.setAlarm(Date.now() + KEEP_ALIVE_MS);
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    const sessions = await puppeteer.sessions(this.env.MYBROWSER);
    const free = sessions.find((s) => !s.connectionId);
    this.browser = free
      ? await puppeteer.connect(this.env.MYBROWSER, free.sessionId)
      : await puppeteer.launch(this.env.MYBROWSER);
    return this.browser;
  }

  async alarm(): Promise<void> {
    if (this.browser?.isConnected()) await this.browser.disconnect();
    this.browser = undefined;
  }
}
