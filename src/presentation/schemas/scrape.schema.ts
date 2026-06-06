import { z } from "zod";

export const profileSchema = z.object({
  url: z.string().url(),
});

export const feedsSchema = z.object({
  url: z.string().url(),
  niche: z.string().trim().default(""),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type FeedsInput = z.infer<typeof feedsSchema>;
