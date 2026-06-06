import type {
  BrowserCaptureOptions,
  BrowserPort,
  BrowserRenderOptions,
} from "../../domain/ports/browser.port";
import type { BrowserManager } from "./browser-manager.do";

export class PuppeteerBrowserAdapter implements BrowserPort {
  constructor(private readonly namespace: DurableObjectNamespace<BrowserManager>) {}

  private stub() {
    const id = this.namespace.idFromName("shared-browser");
    return this.namespace.get(id);
  }

  async renderHtml(url: string, options?: BrowserRenderOptions): Promise<string> {
    return this.stub().renderHtml(url, options);
  }

  async captureResponses(
    url: string,
    urlPattern: string,
    options?: BrowserCaptureOptions,
  ): Promise<string[]> {
    return this.stub().captureResponses(url, urlPattern, options);
  }
}
