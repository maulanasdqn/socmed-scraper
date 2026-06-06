import type { HttpResponse } from "../../../domain/ports/http-client.port";
import { ByteReader } from "./byte-reader";

const enc = new TextEncoder();
const CRLF2 = enc.encode("\r\n\r\n");

export const buildRequest = (target: URL, headers: Record<string, string>): Uint8Array => {
  const path = target.pathname + target.search;
  const lines = [`GET ${path} HTTP/1.1`, `Host: ${target.host}`];
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "host") continue;
    lines.push(`${key}: ${value}`);
  }
  lines.push("Accept-Encoding: identity", "Connection: close", "", "");
  return enc.encode(lines.join("\r\n"));
};

const dechunk = (body: Uint8Array): Uint8Array => {
  const out: number[] = [];
  let i = 0;
  while (i < body.length) {
    let line = "";
    while (i < body.length && body[i] !== 0x0a) {
      if (body[i] !== 0x0d) line += String.fromCharCode(body[i]);
      i += 1;
    }
    i += 1;
    const size = parseInt(line.trim(), 16);
    if (!size || Number.isNaN(size)) break;
    for (let j = 0; j < size && i < body.length; j += 1, i += 1) out.push(body[i]);
    i += 2;
  }
  return new Uint8Array(out);
};

export const parseResponse = async (readable: ReadableStream<Uint8Array>): Promise<HttpResponse> => {
  const reader = new ByteReader(readable.getReader());
  const headBytes = await reader.readUntil(CRLF2);
  const bodyBytes = await reader.readAll();
  reader.release();

  const headText = new TextDecoder().decode(headBytes);
  const lines = headText.split("\r\n");
  const status = Number(lines[0]?.split(/\s+/)[1] ?? 0);
  const setCookie = lines
    .filter((l) => l.toLowerCase().startsWith("set-cookie:"))
    .map((l) => l.slice(l.indexOf(":") + 1).trim())
    .join("; ");
  const chunked = lines.some((l) => /^transfer-encoding:\s*chunked/i.test(l));
  const body = chunked ? dechunk(bodyBytes) : bodyBytes;

  return {
    status,
    ok: status >= 200 && status < 300,
    body: new TextDecoder().decode(body),
    setCookie,
  };
};
