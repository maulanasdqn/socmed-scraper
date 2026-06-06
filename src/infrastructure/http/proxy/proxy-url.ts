export interface ProxyConfig {
  kind: "http" | "socks5";
  host: string;
  port: number;
  username: string;
  password: string;
}

export const parseProxy = (raw: string): ProxyConfig | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }
  const scheme = url.protocol.replace(":", "").toLowerCase();
  const kind = scheme.startsWith("socks") ? "socks5" : scheme.startsWith("http") ? "http" : null;
  if (!kind || !url.hostname) return null;
  return {
    kind,
    host: url.hostname,
    port: url.port ? Number(url.port) : kind === "socks5" ? 1080 : 8080,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
};
