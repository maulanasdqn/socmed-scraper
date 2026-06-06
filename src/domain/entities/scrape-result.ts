import type { Platform } from "./platform";
import type { NormalizedProfile } from "./profile";
import type { NormalizedPost } from "./post";

export type ScrapeItem = NormalizedProfile | NormalizedPost;

export interface ScrapeResult<T extends ScrapeItem = ScrapeItem> {
  platform: Platform;
  data: T[];
  degraded: boolean;
}
