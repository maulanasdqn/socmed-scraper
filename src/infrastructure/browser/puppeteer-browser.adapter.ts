import type { BrowserPort, BrowserRenderOptions } from "../../domain/ports/browser.port";
import type { BrowserManager } from "./browser-manager.do";

export class PuppeteerBrowserAdapter implements BrowserPort {
  constructor(private readonly namespace: DurableObjectNamespace<BrowserManager>) {}

  async renderHtml(url: string, options?: BrowserRenderOptions): Promise<string> {
    const id = this.namespace.idFromName("shared-browser");
    const stub = this.namespace.get(id);
    return stub.renderHtml(url, options);
  }
}
