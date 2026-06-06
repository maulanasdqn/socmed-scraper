export interface HttpRequestOptions {
  headers?: Record<string, string>;
  referer?: string;
  retries?: number;
  proxyUrl?: string;
}

export interface HttpResponse {
  status: number;
  ok: boolean;
  body: string;
  setCookie: string;
}

export interface HttpClientPort {
  get(url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
}
