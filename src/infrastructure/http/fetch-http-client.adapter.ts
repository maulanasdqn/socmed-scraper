import type {
  HttpClientPort,
  HttpRequestOptions,
  HttpResponse,
} from "../../domain/ports/http-client.port";
import { buildBrowserHeaders } from "./browser-headers";
import { parseProxy, type ProxyConfig } from "./proxy/proxy-url";
import { proxiedGet } from "./proxy/proxy-client";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 350;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const isRetryable = (status: number): boolean =>
  status === 401 || status === 429 || status === 403 || status >= 500;

const nativeGet = async (
  url: string,
  headers: Record<string, string>,
): Promise<HttpResponse> => {
  const res = await fetch(url, { headers, redirect: "follow" });
  return {
    status: res.status,
    ok: res.ok,
    body: await res.text(),
    setCookie: res.headers.get("set-cookie") ?? "",
  };
};

export class FetchHttpClientAdapter implements HttpClientPort {
  async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    const referer = options.referer ?? new URL(url).origin + "/";
    const headers = buildBrowserHeaders(referer, options.headers);
    const proxy: ProxyConfig | null = parseProxy(options.proxyUrl ?? "");
    const baseRetries = options.retries ?? MAX_RETRIES;
    const retries = proxy ? Math.max(baseRetries, 5) : baseRetries;

    let attempt = 0;
    let last: HttpResponse = { status: 0, ok: false, body: "", setCookie: "" };

    while (attempt <= retries) {
      try {
        last = proxy ? await proxiedGet(url, headers, proxy) : await nativeGet(url, headers);
        if (last.ok || !isRetryable(last.status)) return last;
      } catch {
        last = { status: 0, ok: false, body: "", setCookie: "" };
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
