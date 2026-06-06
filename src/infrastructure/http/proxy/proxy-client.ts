import { connect } from "cloudflare:sockets";
import type { HttpResponse } from "../../../domain/ports/http-client.port";
import type { ProxyConfig } from "./proxy-url";
import { httpConnect, socks5Connect } from "./handshake";
import { buildRequest, parseResponse } from "./http-codec";

const TIMEOUT_MS = 20_000;

const withTimeout = <T>(promise: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const guard = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("proxy request timeout")), TIMEOUT_MS);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer)) as Promise<T>;
};

const run = async (
  url: string,
  headers: Record<string, string>,
  proxy: ProxyConfig,
): Promise<HttpResponse> => {
  const target = new URL(url);
  const port = target.protocol === "https:" ? 443 : 80;
  const socket = connect(
    { hostname: proxy.host, port: proxy.port },
    { secureTransport: "starttls", allowHalfOpen: false },
  );
  try {
    if (proxy.kind === "socks5") await socks5Connect(socket, proxy, target.hostname, port);
    else await httpConnect(socket, proxy, target.hostname, port);

    const tunnel =
      target.protocol === "https:"
        ? socket.startTls({ expectedServerHostname: target.hostname })
        : socket;
    const writer = tunnel.writable.getWriter();
    await writer.write(buildRequest(target, headers));
    writer.releaseLock();
    return await parseResponse(tunnel.readable);
  } finally {
    await socket.close().catch(() => undefined);
  }
};

export const proxiedGet = (
  url: string,
  headers: Record<string, string>,
  proxy: ProxyConfig,
): Promise<HttpResponse> => withTimeout(run(url, headers, proxy));
