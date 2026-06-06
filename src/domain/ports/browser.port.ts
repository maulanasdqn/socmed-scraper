export interface BrowserRenderOptions {
  waitForSelector?: string;
  timeoutMs?: number;
}

export interface BrowserPort {
  renderHtml(url: string, options?: BrowserRenderOptions): Promise<string>;
}
