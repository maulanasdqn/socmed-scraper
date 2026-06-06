import { DurableObject } from "cloudflare:workers";
import puppeteer, { type Browser, type Page } from "@cloudflare/puppeteer";
import type {
  BrowserCaptureOptions,
  BrowserRenderOptions,
} from "../../domain/ports/browser.port";

const KEEP_ALIVE_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface ManagerEnv {
  MYBROWSER: Fetcher;
}

export class BrowserManager extends DurableObject<ManagerEnv> {
  private browser?: Browser;

  private async newPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
    return page;
  }

  async renderHtml(url: string, options: BrowserRenderOptions = {}): Promise<string> {
    const browser = await this.ensureBrowser();
    const page = await this.newPage(browser);
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

  async captureResponses(
    url: string,
    urlPattern: string,
    options: BrowserCaptureOptions = {},
  ): Promise<string[]> {
    const browser = await this.ensureBrowser();
    const page = await this.newPage(browser);
    const bodies: string[] = [];
    const pending: Promise<void>[] = [];
    page.on("response", (res) => {
      if (!res.url().includes(urlPattern)) return;
      pending.push(
        res
          .text()
          .then((text) => {
            bodies.push(text);
          })
          .catch(() => undefined),
      );
    });
    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });
      if (options.scroll) {
        await page.evaluate("window.scrollBy(0, 3000)").catch(() => undefined);
      }
      await delay(options.settleMs ?? 2_500);
      await Promise.all(pending);
      return bodies;
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
