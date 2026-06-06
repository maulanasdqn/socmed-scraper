export interface BrowserRenderOptions {
  waitForSelector?: string;
  timeoutMs?: number;
}

export interface BrowserCaptureOptions extends BrowserRenderOptions {
  scroll?: boolean;
  settleMs?: number;
}

export interface BrowserPort {
  renderHtml(url: string, options?: BrowserRenderOptions): Promise<string>;
  captureResponses(
    url: string,
    urlPattern: string,
    options?: BrowserCaptureOptions,
  ): Promise<string[]>;
}
