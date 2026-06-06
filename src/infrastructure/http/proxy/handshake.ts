import type { ProxyConfig } from "./proxy-url";
import { ByteReader } from "./byte-reader";

const enc = new TextEncoder();
const CRLF2 = enc.encode("\r\n\r\n");

export const httpConnect = async (
  socket: Socket,
  proxy: ProxyConfig,
  host: string,
  port: number,
): Promise<void> => {
  const writer = socket.writable.getWriter();
  let head = `CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n`;
  if (proxy.username) {
    head += `Proxy-Authorization: Basic ${btoa(`${proxy.username}:${proxy.password}`)}\r\n`;
  }
  await writer.write(enc.encode(head + "\r\n"));
  writer.releaseLock();
  const reader = new ByteReader(socket.readable.getReader());
  const status = new TextDecoder().decode(await reader.readUntil(CRLF2)).split(/\s+/)[1];
  reader.release();
  if (status !== "200") throw new Error(`http proxy CONNECT ${status}`);
};

export const socks5Connect = async (
  socket: Socket,
  proxy: ProxyConfig,
  host: string,
  port: number,
): Promise<void> => {
  const writer = socket.writable.getWriter();
  const reader = new ByteReader(socket.readable.getReader());
  const methods = proxy.username ? [0x00, 0x02] : [0x00];
  await writer.write(new Uint8Array([0x05, methods.length, ...methods]));
  const greeting = await reader.readN(2);
  if (greeting[0] !== 0x05 || greeting[1] === 0xff) throw new Error("socks5 no method");
  if (greeting[1] === 0x02) {
    const user = enc.encode(proxy.username);
    const pass = enc.encode(proxy.password);
    await writer.write(new Uint8Array([0x01, user.length, ...user, pass.length, ...pass]));
    const auth = await reader.readN(2);
    if (auth[1] !== 0x00) throw new Error("socks5 auth failed");
  }
  const domain = enc.encode(host);
  await writer.write(
    new Uint8Array([0x05, 0x01, 0x00, 0x03, domain.length, ...domain, (port >> 8) & 0xff, port & 0xff]),
  );
  const reply = await reader.readN(4);
  if (reply[1] !== 0x00) throw new Error(`socks5 connect ${reply[1]}`);
  const addrLen = reply[3] === 0x01 ? 4 : reply[3] === 0x04 ? 16 : (await reader.readN(1))[0];
  await reader.readN(addrLen + 2);
  writer.releaseLock();
  reader.release();
};
