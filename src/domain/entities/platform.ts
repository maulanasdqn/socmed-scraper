export enum Platform {
  Facebook = "facebook",
  Instagram = "instagram",
  Threads = "threads",
  Twitter = "twitter",
  TikTok = "tiktok",
}

export const isPlatform = (value: string): value is Platform =>
  Object.values(Platform).includes(value as Platform);
