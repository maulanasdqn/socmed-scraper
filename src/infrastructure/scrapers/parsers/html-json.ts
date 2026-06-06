export const extractScriptJson = <T = unknown>(html: string, scriptId: string): T | null => {
  const pattern = new RegExp(
    `<script[^>]*id=["']${scriptId}["'][^>]*>([\\s\\S]*?)</script>`,
    "i",
  );
  const match = html.match(pattern);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
};

export const extractLdJson = (html: string): unknown[] => {
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const out: unknown[] = [];
  for (const match of html.matchAll(pattern)) {
    try {
      out.push(JSON.parse(match[1]));
    } catch {
      continue;
    }
  }
  return out;
};

export const extractAllJsonScripts = (html: string): unknown[] => {
  const pattern = /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const out: unknown[] = [];
  for (const match of html.matchAll(pattern)) {
    try {
      out.push(JSON.parse(match[1]));
    } catch {
      continue;
    }
  }
  return out;
};

export const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[, ]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const toText = (value: unknown): string => (typeof value === "string" ? value : "");

export const parseJsonLoose = <T = unknown>(text: string): T | null => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
};
