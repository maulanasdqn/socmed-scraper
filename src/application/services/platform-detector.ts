import { Platform } from "../../domain/entities/platform";
import { InvalidUrlError, UnsupportedPlatformError } from "../../domain/errors/scrape.error";

const HOST_MAP: Array<[RegExp, Platform]> = [
  [/(^|\.)tiktok\.com$/, Platform.TikTok],
  [/(^|\.)threads\.(net|com)$/, Platform.Threads],
  [/(^|\.)instagram\.com$/, Platform.Instagram],
  [/(^|\.)(twitter|x)\.com$/, Platform.Twitter],
  [/(^|\.)(facebook|fb)\.com$/, Platform.Facebook],
];

export const detectPlatform = (url: string): Platform => {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new InvalidUrlError(url);
  }
  const match = HOST_MAP.find(([pattern]) => pattern.test(host));
  if (!match) throw new UnsupportedPlatformError(url);
  return match[1];
};

export const extractUsername = (url: string): string => {
  const path = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const first = path.split("/")[0] ?? "";
  return first.replace(/^@/, "");
};
