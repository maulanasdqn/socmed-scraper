import type {
  HttpClientPort,
  HttpRequestOptions,
  HttpResponse,
} from "../../domain/ports/http-client.port";
import { buildBrowserHeaders } from "./browser-headers";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 350;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const isRetryable = (status: number): boolean =>
  status === 429 || status === 403 || status >= 500;

export class FetchHttpClientAdapter implements HttpClientPort {
  async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    const referer = options.referer ?? new URL(url).origin + "/";
    const headers = buildBrowserHeaders(referer, options.headers);
    const retries = options.retries ?? MAX_RETRIES;

    let attempt = 0;
    let last: HttpResponse = { status: 0, ok: false, body: "" };

    while (attempt <= retries) {
      try {
        const res = await fetch(url, { headers, redirect: "follow" });
        const body = await res.text();
        last = { status: res.status, ok: res.ok, body };
        if (res.ok || !isRetryable(res.status)) return last;
      } catch {
        last = { status: 0, ok: false, body: "" };
      }
      attempt += 1;
      if (attempt <= retries) {
        const jitter = Math.floor(BASE_DELAY_MS * Math.random());
        await sleep(BASE_DELAY_MS * 2 ** attempt + jitter);
      }
    }
    return last;
  }
}
