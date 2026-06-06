import type { ScrapeOutput } from "../../application/use-cases/scrape-output";
import type { ScrapeItem } from "../../domain/entities/scrape-result";

export interface ApiResponse {
  message: string;
  data: ScrapeItem[];
  meta: {
    platform: string;
    degraded: boolean;
    cached: boolean;
  };
}

export const toApiResponse = (message: string, output: ScrapeOutput): ApiResponse => ({
  message,
  data: output.data,
  meta: {
    platform: output.platform,
    degraded: output.degraded,
    cached: output.cached,
  },
});
