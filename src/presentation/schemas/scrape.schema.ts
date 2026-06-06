import { z } from "zod";

export const profileSchema = z.object({
  url: z.string().url(),
  proxyUrl: z.string().trim().default(""),
});

export const feedsSchema = z.object({
  url: z.string().url(),
  niche: z.string().trim().default(""),
  proxyUrl: z.string().trim().default(""),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type FeedsInput = z.infer<typeof feedsSchema>;
