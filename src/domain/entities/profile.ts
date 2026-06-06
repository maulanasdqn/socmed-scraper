import type { Platform } from "./platform";

export interface NormalizedProfile {
  platform: Platform;
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  url: string;
  followers: number;
  following: number;
  postsCount: number;
  verified: boolean;
  raw: unknown;
}
